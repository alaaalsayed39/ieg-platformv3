'use strict';

const { Conversation, Message } = require('./message.model');
const ChatSetting = require('./chatSetting.model');
const User = require('../users/user.model');
const ApiError = require('../../utils/ApiError');
const { saveFile, resolveFilePath } = require('../../utils/fileStorage');
const path = require('path');

// ─── Get User Conversations ──────────────────────────────────────────────────
const getConversations = async (userId) => {
  const list = await Conversation.find({ participants: userId })
    .populate({
      path: 'participants',
      select: 'fullName email companyName role avatarUrl presenceStatus lastSeen isChatSuspended',
    })
    .sort({ lastMessageAt: -1 })
    .lean();

  // For each conversation, compute unreadCount dynamically
  const enriched = await Promise.all(
    list.map(async (conv) => {
      const unreadCount = await Message.countDocuments({
        conversationId: conv._id,
        receiverId: userId,
        status: { $ne: 'read' },
      });

      // Filter out current user from participants array to find the "other" user easily
      const partner = conv.participants.find((p) => String(p._id) !== String(userId)) || null;

      return {
        ...conv,
        partner,
        unreadCount,
      };
    })
  );

  return enriched;
};

// ─── Get Messages in Conversation ───────────────────────────────────────────
const getMessages = async (userId, conversationId) => {
  const conv = await Conversation.findById(conversationId).lean();
  if (!conv) throw ApiError.notFound('Conversation not found');

  const isParticipant = conv.participants.some((p) => String(p) === String(userId));
  if (!isParticipant) {
    throw ApiError.forbidden('You are not a participant in this conversation');
  }

  // Retrieve messages in chronological order
  const messages = await Message.find({ conversationId })
    .populate('senderId', 'fullName avatarUrl role presenceStatus')
    .populate('receiverId', 'fullName avatarUrl role presenceStatus')
    .sort({ createdAt: 1 })
    .limit(100) // retrieve latest 100 messages
    .lean();

  // Mark all unread messages received by this user in this conversation as read
  const unreadMsgIds = messages
    .filter((m) => String(m.receiverId._id || m.receiverId) === String(userId) && m.status !== 'read')
    .map((m) => m._id);

  if (unreadMsgIds.length > 0) {
    await Message.updateMany(
      { _id: { $in: unreadMsgIds } },
      { status: 'read', isRead: true, readAt: new Date() }
    );

    // Notify the sender about status update if they are online
    const socketService = require('../../sockets/socket');
    const onlineMap = socketService.getOnlineUsers();
    const firstMsg = messages.find((m) => unreadMsgIds.includes(m._id));
    if (firstMsg) {
      const senderIdStr = String(firstMsg.senderId._id || firstMsg.senderId);
      if (onlineMap[senderIdStr]) {
        const io = socketService.getIo();
        io?.to(`user:${senderIdStr}`).emit('message:status_update', {
          conversationId,
          messageIds: unreadMsgIds,
          status: 'read',
          readAt: new Date(),
        });
      }
    }
  }

  return messages;
};

// ─── Initiate/Create Conversation ───────────────────────────────────────────
const initiateConversation = async (userId, participantId) => {
  if (String(userId) === String(participantId)) {
    throw ApiError.badRequest('You cannot start a conversation with yourself');
  }

  // Check if conversation already exists
  let conv = await Conversation.findOne({
    participants: { $all: [userId, participantId] },
  })
    .populate({
      path: 'participants',
      select: 'fullName email companyName role avatarUrl presenceStatus lastSeen isChatSuspended',
    })
    .lean();

  if (conv) {
    const partner = conv.participants.find((p) => String(p._id) !== String(userId)) || null;
    return { ...conv, partner, unreadCount: 0 };
  }

  // Verify recipient exists
  const participant = await User.findById(participantId);
  if (!participant) throw ApiError.notFound('User not found');

  // Create conversation
  const created = await Conversation.create({
    participants: [userId, participantId],
    lastMessage: 'Conversation started',
    lastMessageAt: new Date(),
  });

  const populated = await Conversation.findById(created._id)
    .populate({
      path: 'participants',
      select: 'fullName email companyName role avatarUrl presenceStatus lastSeen isChatSuspended',
    })
    .lean();

  const partner = populated.participants.find((p) => String(p._id) !== String(userId)) || null;
  return { ...populated, partner, unreadCount: 0 };
};

// ─── Upload File Attachment ──────────────────────────────────────────────────
const uploadAttachment = async (userId, file) => {
  if (!file) throw ApiError.badRequest('No file uploaded');

  // Verify chat is enabled and fetch settings
  const settings = await ChatSetting.findOne() || {
    chatEnabled: true,
    fileSharingEnabled: true,
    imageSharingEnabled: true,
    maxFileSize: 10 * 1024 * 1024,
    allowedFileTypes: ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'],
  };

  if (!settings.chatEnabled) {
    throw ApiError.forbidden('Chat system is currently disabled by admin.');
  }

  // Check if file sharing is disabled globally
  if (!settings.fileSharingEnabled) {
    throw ApiError.forbidden('File sharing is disabled by admin.');
  }

  const ext = path.extname(file.originalname).toLowerCase();
  const isImage = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);

  if (isImage && !settings.imageSharingEnabled) {
    throw ApiError.forbidden('Image sharing is disabled by admin.');
  }

  // Validate File Extension
  if (!settings.allowedFileTypes.includes(ext)) {
    throw ApiError.badRequest(`File extension ${ext} not allowed. Allowed types: ${settings.allowedFileTypes.join(', ')}`);
  }

  // Block malicious extensions explicitly just in case settings is bypassed
  const forbiddenExts = ['.exe', '.bat', '.cmd', '.sh', '.js', '.py', '.zip', '.rar', '.7z', '.tar', '.gz'];
  if (forbiddenExts.includes(ext)) {
    throw ApiError.badRequest('Security violation: Executables, scripts, and archives are strictly prohibited.');
  }

  // Validate MIME type against common malicious categories
  const forbiddenMimePrefixes = ['application/x-msdownload', 'application/zip', 'application/x-rar-compressed'];
  if (forbiddenMimePrefixes.some((p) => file.mimetype.startsWith(p))) {
    throw ApiError.badRequest('Security violation: Invalid file format (executable or archive detected).');
  }

  // Validate File Size
  if (file.size > settings.maxFileSize) {
    throw ApiError.badRequest(`File exceeds maximum allowed size of ${Math.round(settings.maxFileSize / (1024 * 1024))}MB`);
  }

  // Save File
  const saveResult = await saveFile(file, userId, 'chat_attachments');

  return {
    fileName: file.originalname,
    fileUrl: saveResult.url,
    fileType: file.mimetype,
    fileSize: file.size,
    publicId: saveResult.publicId,
  };
};

// ─── Get Secure Attachment ────────────────────────────────────────────────────
const getAttachmentDetails = async (userId, messageId, index, role) => {
  const message = await Message.findById(messageId);
  if (!message) throw ApiError.notFound('Message not found');

  // Check download permissions
  const isParticipant =
    String(message.senderId) === String(userId) ||
    String(message.receiverId) === String(userId) ||
    role === 'admin';

  if (!isParticipant) {
    throw ApiError.forbidden('You do not have permission to view or download this attachment');
  }

  const attachment = message.attachments?.[index];
  if (!attachment) throw ApiError.notFound('Attachment not found at specified index');

  const isLocal = !attachment.fileUrl.startsWith('http');
  const localPath = isLocal ? resolveFilePath(attachment.fileUrl) : null;

  return {
    attachment,
    localPath,
    cloudinaryUrl: isLocal ? null : attachment.fileUrl,
  };
};

module.exports = {
  getConversations,
  getMessages,
  initiateConversation,
  uploadAttachment,
  getAttachmentDetails,
};
