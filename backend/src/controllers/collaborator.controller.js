const Trip = require('../models/Trip');
const User = require('../models/User');
const Invite = require('../models/Invite');
const { AppError } = require('../middleware/errorHandler');
const catchAsync = require('../utils/catchAsync');
const { sendEmail, emailTemplates } = require('../utils/email');
const { createNotification } = require('../utils/notifications');
const { logActivity } = require('../utils/activityLog');
const { getIO } = require('../socket/socketManager');

// GET /trips/:tripId/collaborators
exports.getCollaborators = catchAsync(async (req, res) => {
  const trip = await Trip.findById(req.trip._id)
    .populate('owner', 'name email avatar lastActive')
    .populate('collaborators.user', 'name email avatar lastActive');

  const collaborators = [
    {
      user: trip.owner,
      role: 'owner',
      joinedAt: trip.createdAt,
    },
    ...trip.collaborators.map((c) => ({
      user: c.user,
      role: c.role,
      joinedAt: c.joinedAt,
      lastViewed: c.lastViewed,
      invitedBy: c.invitedBy,
    })),
  ];

  res.json({ success: true, data: collaborators });
});

// PATCH /trips/:tripId/collaborators/:userId/role
exports.updateRole = catchAsync(async (req, res, next) => {
  const { role } = req.body;
  if (!['editor', 'viewer'].includes(role)) {
    return next(new AppError('Invalid role. Must be editor or viewer.', 400));
  }

  const trip = req.trip;
  const targetId = req.params.userId;

  if (targetId === trip.owner.toString()) {
    return next(new AppError('Cannot change owner role.', 400));
  }

  const collab = trip.collaborators.find((c) => c.user._id.toString() === targetId);
  if (!collab) return next(new AppError('Collaborator not found.', 404));

  collab.role = role;
  await trip.save();

  await createNotification({
    recipient: targetId,
    sender: req.user._id,
    type: 'role_changed',
    title: 'Your role was updated',
    message: `Your role in "${trip.title}" was changed to ${role}`,
    trip: trip._id,
    link: `/trips/${trip._id}`,
  });

  await logActivity({
    trip: trip._id,
    user: req.user._id,
    action: 'role_changed',
    description: `Changed collaborator role to ${role}`,
    meta: { targetUserId: targetId, newRole: role },
  });

  const io = getIO();
  io?.to(`trip:${trip._id}`).emit('collaborator:roleChanged', { userId: targetId, role });

  res.json({ success: true, message: `Role updated to ${role}.` });
});

// DELETE /trips/:tripId/collaborators/:userId
exports.removeCollaborator = catchAsync(async (req, res, next) => {
  const trip = req.trip;
  const targetId = req.params.userId;

  if (targetId === trip.owner._id.toString()) {
    return next(new AppError('Cannot remove trip owner.', 400));
  }

  const collabIndex = trip.collaborators.findIndex((c) => c.user._id.toString() === targetId);
  if (collabIndex === -1) return next(new AppError('Collaborator not found.', 404));

  trip.collaborators.splice(collabIndex, 1);
  await trip.save();

  await createNotification({
    recipient: targetId,
    sender: req.user._id,
    type: 'collaborator_left',
    title: 'Removed from trip',
    message: `You were removed from "${trip.title}"`,
  });

  await logActivity({
    trip: trip._id,
    user: req.user._id,
    action: 'collaborator_removed',
    description: 'Removed a collaborator',
    meta: { removedUserId: targetId },
  });

  const io = getIO();
  io?.to(`trip:${trip._id}`).emit('collaborator:removed', { userId: targetId });
  io?.to(`user:${targetId}`).emit('trip:accessRevoked', { tripId: trip._id });

  res.json({ success: true, message: 'Collaborator removed.' });
});

// POST /trips/:tripId/collaborators/leave
exports.leaveTrip = catchAsync(async (req, res, next) => {
  const trip = req.trip;
  const userId = req.user._id.toString();

  if (trip.owner._id.toString() === userId) {
    return next(new AppError('Owner cannot leave their own trip.', 400));
  }

  const collabIndex = trip.collaborators.findIndex((c) => c.user._id.toString() === userId);
  if (collabIndex === -1) return next(new AppError('Not a collaborator.', 404));

  trip.collaborators.splice(collabIndex, 1);
  await trip.save();

  res.json({ success: true, message: 'Left trip successfully.' });
});