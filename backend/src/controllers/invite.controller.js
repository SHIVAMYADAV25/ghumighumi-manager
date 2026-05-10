const Invite = require('../models/Invite');
const Trip = require('../models/Trip');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const catchAsync = require('../utils/catchAsync');
const { sendEmail, emailTemplates } = require('../utils/email');
const { createNotification } = require('../utils/notifications');
const { logActivity } = require('../utils/activityLog');

// POST /trips/:tripId/collaborators/invite (via email)
exports.sendInvite = catchAsync(async (req, res, next) => {
  const { email, role = 'viewer', message } = req.body;
  const trip = req.trip;

  // Check not already a collaborator
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const isCollaborator = trip.collaborators.some(
      (c) => c.user._id.toString() === existingUser._id.toString()
    ) || trip.owner._id.toString() === existingUser._id.toString();

    if (isCollaborator) {
      return next(new AppError('This user is already a collaborator.', 409));
    }
  }

  // Revoke existing pending invite
  await Invite.findOneAndUpdate(
    { trip: trip._id, email, status: 'pending' },
    { status: 'revoked' }
  );

  const invite = await Invite.create({
    trip: trip._id,
    invitedBy: req.user._id,
    email,
    role,
    message,
  });

  const inviteUrl = `${process.env.CLIENT_URL}/invite/${invite.token}`;
  await sendEmail({
    to: email,
    ...emailTemplates.tripInvite(req.user.name, trip.title, role, inviteUrl, message),
  });

  await logActivity({
    trip: trip._id,
    user: req.user._id,
    action: 'invite_sent',
    description: `Invited ${email} as ${role}`,
    meta: { email, role },
  });

  res.status(201).json({
    success: true,
    message: `Invitation sent to ${email}`,
    data: { inviteId: invite._id, email, role, expiresAt: invite.expiresAt },
  });
});

// GET /invites/:token - preview invite
exports.getInvite = catchAsync(async (req, res, next) => {
  const invite = await Invite.findOne({ token: req.params.token, status: 'pending' })
    .populate('trip', 'title destination startDate endDate coverImage')
    .populate('invitedBy', 'name avatar');

  if (!invite || invite.expiresAt < new Date()) {
    if (invite) await Invite.findByIdAndUpdate(invite._id, { status: 'expired' });
    return next(new AppError('Invitation not found or has expired.', 404));
  }

  res.json({ success: true, data: invite });
});

// POST /invites/:token/accept
exports.acceptInvite = catchAsync(async (req, res, next) => {
  const invite = await Invite.findOne({ token: req.params.token, status: 'pending' })
    .populate('trip');

  if (!invite || invite.expiresAt < new Date()) {
    return next(new AppError('Invitation not found or has expired.', 404));
  }

  // Check if logged-in user email matches invite email
  if (req.user.email !== invite.email) {
    return next(new AppError('This invitation was sent to a different email address.', 403));
  }

  const trip = await Trip.findById(invite.trip._id);

  // Add as collaborator
  const alreadyCollaborator = trip.collaborators.some(
    (c) => c.user.toString() === req.user._id.toString()
  );

  if (!alreadyCollaborator) {
    trip.collaborators.push({
      user: req.user._id,
      role: invite.role,
      invitedBy: invite.invitedBy,
    });
    await trip.save();
  }

  invite.status = 'accepted';
  invite.acceptedBy = req.user._id;
  invite.acceptedAt = new Date();
  await invite.save();

  await createNotification({
    recipient: invite.invitedBy,
    sender: req.user._id,
    type: 'collaborator_joined',
    title: 'Invitation Accepted',
    message: `${req.user.name} accepted your invitation to "${trip.title}"`,
    trip: trip._id,
    link: `/trips/${trip._id}`,
  });

  await logActivity({
    trip: trip._id,
    user: req.user._id,
    action: 'invite_accepted',
    description: `${req.user.name} joined the trip`,
  });

  res.json({ success: true, message: 'Invitation accepted!', data: { tripId: trip._id } });
});

// POST /invites/:token/decline
exports.declineInvite = catchAsync(async (req, res, next) => {
  const invite = await Invite.findOne({ token: req.params.token, status: 'pending' });
  if (!invite) return next(new AppError('Invitation not found.', 404));

  invite.status = 'declined';
  await invite.save();

  res.json({ success: true, message: 'Invitation declined.' });
});

// GET /trips/:tripId/collaborators/invites (pending invites list)
exports.getTripInvites = catchAsync(async (req, res) => {
  const invites = await Invite.find({ trip: req.trip._id, status: 'pending' })
    .select('email role expiresAt createdAt')
    .sort('-createdAt');

  res.json({ success: true, data: invites });
});

// DELETE /trips/:tripId/collaborators/invites/:id (revoke)
exports.revokeInvite = catchAsync(async (req, res, next) => {
  const invite = await Invite.findOne({ _id: req.params.id, trip: req.trip._id });
  if (!invite) return next(new AppError('Invite not found.', 404));

  invite.status = 'revoked';
  await invite.save();

  res.json({ success: true, message: 'Invite revoked.' });
});