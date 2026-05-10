const Notification = require('../models/Notification');
const { getIO } = require('../socket/socketManager');
const logger = require('./logger');

const createNotification = async ({
  recipient,
  sender,
  type,
  title,
  message,
  data = {},
  trip,
  link,
}) => {
  try {
    const notification = await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      data,
      trip,
      link,
    });

    // Real-time push via Socket.IO
    const io = getIO();
    if (io) {
      io.to(`user:${recipient}`).emit('notification:new', {
        ...notification.toObject(),
      });
    }

    return notification;
  } catch (err) {
    logger.error('Notification creation error:', err.message);
  }
};

const createBulkNotifications = async (notifications) => {
  try {
    const created = await Notification.insertMany(notifications);
    const io = getIO();
    if (io) {
      created.forEach((notif) => {
        io.to(`user:${notif.recipient}`).emit('notification:new', notif.toObject());
      });
    }
    return created;
  } catch (err) {
    logger.error('Bulk notification error:', err.message);
  }
};

module.exports = { createNotification, createBulkNotifications };