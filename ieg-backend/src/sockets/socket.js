'use strict';

const socketIo = require('socket.io');
const { verifyAccessToken } = require('../config/jwt');
const User = require('../modules/users/user.model');
const { Conversation, Message } = require('../modules/messages/message.model');
const ChatSetting = require('../modules/messages/chatSetting.model');
const BlockedLog = require('../modules/messages/blockedLog.model');
const { detectContactInfo } = require('../modules/messages/contactEngine');

let io = null;
const onlineUsers = {}; // Map of userId -> { socketId, status }

const init = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    },
  });

  // Socket authentication middleware via JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId).select('fullName email role isActive isChatSuspended');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      if (!user.isActive) {
        return next(new Error('Authentication error: User suspended'));
      }
      if (user.isChatSuspended) {
        return next(new Error('Authentication error: Your chat access is suspended'));
      }
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: ' + err.message));
    }
  });

  io.on('connection', async (socket) => {
    const userId = String(socket.user._id);

    // Track active connection
    onlineUsers[userId] = {
      socketId: socket.id,
      status: 'online',
      lastActivity: Date.now(),
    };

    // Update presence status in DB
    await User.findByIdAndUpdate(userId, { presenceStatus: 'online', lastSeen: new Date() }).catch(() => {});

    // Broadcast status change
    socket.broadcast.emit('presence:update', { userId, status: 'online' });

    // Send the joining user the list of all currently online users and their statuses
    const initialPresence = Object.keys(onlineUsers).map((id) => ({
      userId: id,
      status: onlineUsers[id].status,
    }));
    socket.emit('presence:initial', initialPresence);

    // Join room for this specific user so we can send direct notifications/events
    socket.join(`user:${userId}`);

    // Update other users' messages to "delivered" when this user comes online
    try {
      const pendingDeliveries = await Message.find({
        receiverId: userId,
        status: 'sent',
      });

      if (pendingDeliveries.length > 0) {
        const messageIds = pendingDeliveries.map((m) => m._id);
        await Message.updateMany(
          { _id: { $in: messageIds } },
          { status: 'delivered', deliveredAt: new Date() }
        );

        // Notify senders of these status changes
        pendingDeliveries.forEach((msg) => {
          const senderIdStr = String(msg.senderId);
          if (onlineUsers[senderIdStr]) {
            io.to(`user:${senderIdStr}`).emit('message:status_update', {
              conversationId: msg.conversationId,
              messageIds: [msg._id],
              status: 'delivered',
            });
          }
        });
      }
    } catch (err) {
      console.error('[Socket] Failed to process pending message deliveries:', err.message);
    }

    // Join room for a specific conversation
    socket.on('join:conversation', async (conversationId) => {
      socket.join(`conversation:${conversationId}`);

      // Automatically mark all unread messages received by this user in this conversation as "read"
      try {
        const unreadMessages = await Message.find({
          conversationId,
          receiverId: userId,
          status: { $ne: 'read' },
        });

        if (unreadMessages.length > 0) {
          const messageIds = unreadMessages.map((m) => m._id);
          await Message.updateMany(
            { _id: { $in: messageIds } },
            { status: 'read', isRead: true, readAt: new Date() }
          );

          // Emit read receipt back to the sender
          const firstMsg = unreadMessages[0];
          const senderIdStr = String(firstMsg.senderId);
          io.to(`conversation:${conversationId}`).emit('message:status_update', {
            conversationId,
            messageIds,
            status: 'read',
            readAt: new Date(),
          });
        }
      } catch (err) {
        console.error('[Socket] Failed to mark messages as read:', err.message);
      }
    });

    // Send a message via WebSockets
    socket.on('message:send', async (data, callback) => {
      try {
        const { conversationId, receiverId, content, attachments } = data;

        // Check if chat is enabled globally
        const settings = await ChatSetting.findOne() || { chatEnabled: true };
        if (!settings.chatEnabled) {
          return callback?.({ success: false, error: 'Chat is currently disabled by administrator.' });
        }

        // Verify sender is not suspended (fresh fetch check)
        const freshUser = await User.findById(userId).select('isChatSuspended');
        if (freshUser?.isChatSuspended) {
          return callback?.({ success: false, error: 'Your chat access has been suspended by the administrator.' });
        }

        const receiver = await User.findById(receiverId);
        if (!receiver) {
          return callback?.({ success: false, error: 'Receiver user not found.' });
        }

        // Contact details protection check
        const contactCheck = detectContactInfo(content);
        if (contactCheck.hasContactInfo) {
          // Log blocked attempt to database
          await BlockedLog.create({
            senderId: userId,
            receiverId,
            content,
            blockedPatterns: contactCheck.blockedPatterns,
          }).catch(() => {});

          return callback?.({
            success: false,
            error: 'Message blocked: Sharing phone numbers, emails, or social media handles is strictly prohibited.',
          });
        }

        // Determine message status based on receiver status and room activity
        let initialStatus = 'sent';
        let deliveredAt = undefined;
        let readAt = undefined;
        if (onlineUsers[receiverId]) {
          const receiverSocket = io.sockets.sockets.get(onlineUsers[receiverId].socketId);
          const inRoom = receiverSocket?.rooms?.has(`conversation:${conversationId}`);
          if (inRoom) {
            initialStatus = 'read';
            deliveredAt = new Date();
            readAt = new Date();
          } else {
            initialStatus = 'delivered';
            deliveredAt = new Date();
          }
        }

        // Create message
        const message = await Message.create({
          conversationId,
          senderId: userId,
          receiverId,
          content,
          attachments: attachments || [],
          status: initialStatus,
          isRead: initialStatus === 'read',
          deliveredAt,
          readAt,
        });

        const populatedMessage = await Message.findById(message._id)
          .populate('senderId', 'fullName avatarUrl role presenceStatus')
          .populate('receiverId', 'fullName avatarUrl role presenceStatus')
          .lean();

        // Update Conversation last message fields
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: content || (attachments?.length ? 'Sent an attachment' : ''),
          lastMessageAt: new Date(),
        }).catch(() => {});

        // Emit message to conversation room
        io.to(`conversation:${conversationId}`).emit('message:new', populatedMessage);

        // Notify receiver privately if they are online but not actively in the conversation room
        if (onlineUsers[receiverId]) {
          const receiverSocket = io.sockets.sockets.get(onlineUsers[receiverId].socketId);
          const inRoom = receiverSocket?.rooms?.has(`conversation:${conversationId}`);
          if (!inRoom) {
            io.to(`user:${receiverId}`).emit('message:notification', {
              from: socket.user.fullName,
              content: content || 'Sent an attachment',
              conversationId,
              message: populatedMessage,
            });
          }
        }

        callback?.({ success: true, message: populatedMessage });
      } catch (err) {
        console.error('[Socket] Error sending message:', err.message);
        callback?.({ success: false, error: err.message });
      }
    });

    // Handle typing indicators
    socket.on('message:typing', (data) => {
      const { conversationId } = data;
      socket.to(`conversation:${conversationId}`).emit('message:typing', {
        userId,
        name: socket.user.fullName,
      });
    });

    socket.on('message:stop_typing', (data) => {
      const { conversationId } = data;
      socket.to(`conversation:${conversationId}`).emit('message:stop_typing', {
        userId,
      });
    });

    // Inactivity -> Away toggle
    socket.on('presence:away', async () => {
      if (onlineUsers[userId]) {
        onlineUsers[userId].status = 'away';
        await User.findByIdAndUpdate(userId, { presenceStatus: 'away' }).catch(() => {});
        io.emit('presence:update', { userId, status: 'away' });
      }
    });

    // Activity -> Active toggle
    socket.on('presence:active', async () => {
      if (onlineUsers[userId]) {
        onlineUsers[userId].status = 'online';
        onlineUsers[userId].lastActivity = Date.now();
        await User.findByIdAndUpdate(userId, { presenceStatus: 'online' }).catch(() => {});
        io.emit('presence:update', { userId, status: 'online' });
      }
    });

    // Disconnect event handler
    socket.on('disconnect', async () => {
      if (onlineUsers[userId]?.socketId === socket.id) {
        delete onlineUsers[userId];
        const now = new Date();
        await User.findByIdAndUpdate(userId, { presenceStatus: 'offline', lastSeen: now }).catch(() => {});
        socket.broadcast.emit('presence:update', { userId, status: 'offline', lastSeen: now });
      }
    });
  });
};

const emitOrderUpdate = (order) => {
  if (io) {
    io.emit('order:updated', order);
  }
};

module.exports = {
  init,
  emitOrderUpdate,
  getIo: () => io,
  getOnlineUsers: () => onlineUsers,
};
