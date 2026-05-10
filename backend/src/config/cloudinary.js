const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Trip attachments storage
const attachmentStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: `wandersync/trips/${req.params.tripId}/attachments`,
    resource_type: 'auto',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt'],
    public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`,
  }),
});

// Avatar storage
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'wandersync/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
  },
});

// Trip cover image storage
const coverStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req) => ({
    folder: `wandersync/covers`,
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 630, crop: 'fill' }],
  }),
});

const uploadAttachment = multer({
  storage: attachmentStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadCover = multer({
  storage: coverStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const deleteFile = async (publicId, resourceType = 'image') => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    console.error('Cloudinary delete error:', err);
  }
};

module.exports = { cloudinary, uploadAttachment, uploadAvatar, uploadCover, deleteFile };