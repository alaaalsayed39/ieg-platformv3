const Notification = require('./notification.model');
const { getPagination } = require('../../utils/pagination');

const create = async (userId, { type, title, body, link, metadata }) => {
  return Notification.create({ userId, type, title, body, link, metadata });
};

const getMyNotifications = async (userId, query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = { userId };
  if (query.unread === 'true') filter.isRead = false;
  const [data, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(filter),
  ]);
  const unreadCount = await Notification.countDocuments({ userId, isRead: false });
  return { data, total, page, limit, unreadCount };
};

const markRead = async (userId, notificationId) => {
  return Notification.findOneAndUpdate({ _id: notificationId, userId }, { isRead: true }, { new: true });
};

const markAllRead = async (userId) => {
  await Notification.updateMany({ userId, isRead: false }, { isRead: true });
};

module.exports = { create, getMyNotifications, markRead, markAllRead };
