const Attachment = require('../models/Attachment');
const { AppError } = require('../middleware/errorHandler');
const catchAsync = require('../utils/catchAsync');
const { deleteFile } = require('../config/cloudinary');
const { logActivity } = require('../utils/activityLog');

exports.getAttachments = catchAsync(async (req, res) => {
  const { category } = req.query;
  const query = { trip: req.trip._id };
  if (category) query.category = category;

  const attachments = await Attachment.find(query)
    .populate('uploadedBy', 'name avatar')
    .sort('-createdAt');

  res.json({ success: true, data: attachments });
});

exports.uploadAttachment = catchAsync(async (req, res, next) => {
  if (!req.file) return next(new AppError('No file uploaded.', 400));

  const { category, description, tags, linkedToType, linkedToId } = req.body;

  const attachment = await Attachment.create({
    trip: req.trip._id,
    uploadedBy: req.user._id,
    name: req.body.name || req.file.originalname,
    originalName: req.file.originalname,
    url: req.file.path,
    publicId: req.file.filename,
    mimeType: req.file.mimetype,
    size: req.file.size,
    category: category || 'other',
    description,
    tags: tags ? JSON.parse(tags) : [],
    linkedTo: linkedToType && linkedToId ? { type: linkedToType, id: linkedToId } : undefined,
  });

  await attachment.populate('uploadedBy', 'name avatar');

  await logActivity({
    trip: req.trip._id,
    user: req.user._id,
    action: 'attachment_uploaded',
    entityId: attachment._id,
    description: `Uploaded "${attachment.originalName}"`,
  });

  res.status(201).json({ success: true, data: attachment });
});

exports.deleteAttachment = catchAsync(async (req, res, next) => {
  const attachment = await Attachment.findOne({ _id: req.params.id, trip: req.trip._id });
  if (!attachment) return next(new AppError('Attachment not found.', 404));

  // Only uploader or owner can delete
  if (
    attachment.uploadedBy.toString() !== req.user._id.toString() &&
    req.userRole !== 'owner'
  ) {
    return next(new AppError('Not authorized.', 403));
  }

  await deleteFile(attachment.publicId, attachment.mimeType.startsWith('image') ? 'image' : 'raw');
  await Attachment.findByIdAndDelete(attachment._id);

  res.json({ success: true, message: 'Attachment deleted.' });
});