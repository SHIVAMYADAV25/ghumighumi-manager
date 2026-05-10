const Comment = require('../models/Comment');
const { AppError } = require('../middleware/errorHandler');
const catchAsync = require('../utils/catchAsync');
const { createNotification } = require('../utils/notifications');
const { logActivity } = require('../utils/activityLog');
const { getIO } = require('../socket/socketManager');

// GET /trips/:tripId/comments
exports.getComments = catchAsync(async (req, res) => {
  const { targetType, targetId, page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const query = {
    trip: req.trip._id,
    parent: null, // top-level only
    isDeleted: false,
  };

  if (targetType) query.targetType = targetType;
  if (targetId) query.targetId = targetId;

  const [comments, total] = await Promise.all([
    Comment.find(query)
      .populate('author', 'name avatar')
      .populate('mentions', 'name')
      .sort('createdAt')
      .skip(skip)
      .limit(parseInt(limit)),
    Comment.countDocuments(query),
  ]);

  // Fetch replies for each top-level comment
  const commentIds = comments.map((c) => c._id);
  const replies = await Comment.find({ parent: { $in: commentIds }, isDeleted: false })
    .populate('author', 'name avatar')
    .sort('createdAt');

  const commentsWithReplies = comments.map((comment) => ({
    ...comment.toJSON(),
    replies: replies.filter((r) => r.parent.toString() === comment._id.toString()),
  }));

  res.json({
    success: true,
    data: commentsWithReplies,
    pagination: { total, page: parseInt(page), limit: parseInt(limit) },
  });
});

// POST /trips/:tripId/comments
exports.createComment = catchAsync(async (req, res) => {
  const { content, targetType, targetId, parentId, mentions } = req.body;

  const comment = await Comment.create({
    trip: req.trip._id,
    author: req.user._id,
    content,
    targetType,
    targetId,
    parent: parentId || null,
    mentions: mentions || [],
  });

  await comment.populate('author', 'name avatar');

  // Notify mentions
  if (mentions?.length) {
    const mentionNotifs = mentions.map((userId) => ({
      recipient: userId,
      sender: req.user._id,
      type: 'comment_mention',
      title: 'You were mentioned',
      message: `${req.user.name} mentioned you in a comment`,
      trip: req.trip._id,
      link: `/trips/${req.trip._id}/comments`,
    }));
    const { createBulkNotifications } = require('../utils/notifications');
    await createBulkNotifications(mentionNotifs);
  }

  // If reply, notify parent comment author
  if (parentId) {
    const parent = await Comment.findById(parentId);
    if (parent && parent.author.toString() !== req.user._id.toString()) {
      await createNotification({
        recipient: parent.author,
        sender: req.user._id,
        type: 'comment_added',
        title: 'New reply',
        message: `${req.user.name} replied to your comment`,
        trip: req.trip._id,
      });
    }
  }

  const io = getIO();
  io?.to(`trip:${req.trip._id}`).emit('comment:created', { comment });

  res.status(201).json({ success: true, data: comment });
});

// PATCH /trips/:tripId/comments/:id
exports.updateComment = catchAsync(async (req, res, next) => {
  const comment = await Comment.findOne({ _id: req.params.id, trip: req.trip._id });
  if (!comment) return next(new AppError('Comment not found.', 404));

  if (comment.author.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized.', 403));
  }

  comment.content = req.body.content;
  comment.isEdited = true;
  await comment.save();

  const io = getIO();
  io?.to(`trip:${req.trip._id}`).emit('comment:updated', { comment });

  res.json({ success: true, data: comment });
});

// DELETE /trips/:tripId/comments/:id
exports.deleteComment = catchAsync(async (req, res, next) => {
  const comment = await Comment.findOne({ _id: req.params.id, trip: req.trip._id });
  if (!comment) return next(new AppError('Comment not found.', 404));

  if (comment.author.toString() !== req.user._id.toString() && req.userRole !== 'owner') {
    return next(new AppError('Not authorized.', 403));
  }

  // Soft delete
  comment.isDeleted = true;
  comment.deletedAt = new Date();
  comment.content = '[deleted]';
  await comment.save();

  const io = getIO();
  io?.to(`trip:${req.trip._id}`).emit('comment:deleted', { commentId: comment._id });

  res.json({ success: true, message: 'Comment deleted.' });
});

// POST /trips/:tripId/comments/:id/react
exports.reactToComment = catchAsync(async (req, res, next) => {
  const { emoji } = req.body;
  const comment = await Comment.findOne({ _id: req.params.id, trip: req.trip._id });
  if (!comment) return next(new AppError('Comment not found.', 404));

  const existingReaction = comment.reactions.findIndex(
    (r) => r.user.toString() === req.user._id.toString() && r.emoji === emoji
  );

  if (existingReaction >= 0) {
    comment.reactions.splice(existingReaction, 1); // toggle off
  } else {
    comment.reactions.push({ user: req.user._id, emoji });
  }

  await comment.save();

  const io = getIO();
  io?.to(`trip:${req.trip._id}`).emit('comment:reacted', {
    commentId: comment._id,
    reactions: comment.reactions,
  });

  res.json({ success: true, data: { reactions: comment.reactions } });
});