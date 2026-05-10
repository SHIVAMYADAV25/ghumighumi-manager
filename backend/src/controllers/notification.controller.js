const Notification = require('../models/Notification');
const catchAsync = require('../utils/catchAsync');

exports.getNotifications = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const query = { recipient: req.user._id };
  if (unreadOnly === 'true') query.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .populate('sender', 'name avatar')
      .populate('trip', 'title')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit)),
    Notification.countDocuments(query),
    Notification.countDocuments({ recipient: req.user._id, isRead: false }),
  ]);

  res.json({
    success: true,
    data: notifications,
    unreadCount,
    pagination: { total, page: parseInt(page), limit: parseInt(limit) },
  });
});

exports.markAsRead = catchAsync(async (req, res) => {
  const { ids } = req.body; // array of notification ids, or empty to mark all

  const query = { recipient: req.user._id, isRead: false };
  if (ids?.length) query._id = { $in: ids };

  await Notification.updateMany(query, { isRead: true, readAt: new Date() });

  res.json({ success: true, message: 'Notifications marked as read.' });
});

exports.deleteNotification = catchAsync(async (req, res) => {
  await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
  res.json({ success: true, message: 'Notification deleted.' });
});

exports.clearAll = catchAsync(async (req, res) => {
  await Notification.deleteMany({ recipient: req.user._id, isRead: true });
  res.json({ success: true, message: 'Read notifications cleared.' });
});