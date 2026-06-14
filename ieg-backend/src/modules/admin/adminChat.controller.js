'use strict';

const ChatSetting = require('../messages/chatSetting.model');
const BlockedLog = require('../messages/blockedLog.model');
const { Conversation } = require('../messages/message.model');
const User = require('../users/user.model');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const { getPagination } = require('../../utils/pagination');

// ─── Get Global Chat Settings ───────────────────────────────────────────────
const getChatSettings = async (req, res) => {
  let settings = await ChatSetting.findOne();
  if (!settings) {
    settings = await ChatSetting.create({});
  }
  ApiResponse.success(res, settings, 'Chat settings retrieved');
};

// ─── Update Global Chat Settings ─────────────────────────────────────────────
const updateChatSettings = async (req, res) => {
  let settings = await ChatSetting.findOne();
  if (!settings) {
    settings = new ChatSetting({});
  }
  
  const allowedKeys = [
    'chatEnabled',
    'fileSharingEnabled',
    'imageSharingEnabled',
    'readReceiptsEnabled',
    'typingIndicatorsEnabled',
    'onlineStatusVisible',
    'maxFileSize',
    'allowedFileTypes',
    'presenceTimeout',
    'retentionPeriod',
  ];

  allowedKeys.forEach((key) => {
    if (req.body[key] !== undefined) {
      settings[key] = req.body[key];
    }
  });

  await settings.save();
  ApiResponse.success(res, settings, 'Chat settings updated successfully');
};

// ─── View General Chat Logs ──────────────────────────────────────────────────
const getChatLogs = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const [data, total] = await Promise.all([
    Conversation.find()
      .populate('participants', 'fullName email companyName role avatarUrl')
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Conversation.countDocuments(),
  ]);

  ApiResponse.paginated(res, data, total, page, limit);
};

// ─── View Blocked Contact Bypass Logs ───────────────────────────────────────
const getBlockedLogs = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const [data, total] = await Promise.all([
    BlockedLog.find()
      .populate('senderId', 'fullName email companyName role')
      .populate('receiverId', 'fullName email companyName role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    BlockedLog.countDocuments(),
  ]);

  ApiResponse.paginated(res, data, total, page, limit);
};

// ─── Suspend / Restore Specific User Chat Access ────────────────────────────
const toggleUserChatSuspension = async (req, res) => {
  const { id } = req.params;
  const { isChatSuspended } = req.body;

  if (isChatSuspended === undefined) {
    throw ApiError.badRequest('Field isChatSuspended is required in request body');
  }

  const user = await User.findByIdAndUpdate(id, { isChatSuspended }, { new: true });
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  // If user is suspended, proactively sever any active Socket connections
  if (isChatSuspended) {
    try {
      const socketService = require('../../sockets/socket');
      const onlineMap = socketService.getOnlineUsers();
      const session = onlineMap[String(user._id)];
      if (session) {
        const io = socketService.getIo();
        const clientSocket = io?.sockets?.sockets?.get(session.socketId);
        clientSocket?.emit('error', 'Your chat access has been suspended by the administrator.');
        clientSocket?.disconnect(true);
      }
    } catch (_) {
      // socket optional
    }
  }

  ApiResponse.success(
    res,
    user,
    `User chat access has been ${isChatSuspended ? 'suspended' : 'restored'}`
  );
};

module.exports = {
  getChatSettings,
  updateChatSettings,
  getChatLogs,
  getBlockedLogs,
  toggleUserChatSuspension,
};
