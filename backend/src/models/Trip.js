const mongoose = require('mongoose');

const collaboratorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: {
    type: String,
    enum: ['owner', 'editor', 'viewer'],
    default: 'viewer',
  },
  joinedAt: { type: Date, default: Date.now },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastViewed: { type: Date },
}, { _id: true });

const tripSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Trip title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  slug: { type: String, unique: true },
  description: { type: String, maxlength: 1000, default: '' },
  coverImage: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' },
  },
  destination: {
    name: { type: String, required: true },
    country: { type: String },
    coordinates: {
      lat: Number,
      lng: Number,
    },
    placeId: String,
  },
  startDate: { type: Date, required: [true, 'Start date is required'] },
  endDate: { type: Date, required: [true, 'End date is required'] },
  status: {
    type: String,
    enum: ['planning', 'upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'planning',
  },
  visibility: {
    type: String,
    enum: ['private', 'invite_only', 'public'],
    default: 'private',
  },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  collaborators: [collaboratorSchema],
  tags: [{ type: String, trim: true, lowercase: true }],
  budget: {
    total: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'USD' },
    spent: { type: Number, default: 0 },
  },
  travelers: { type: Number, default: 1, min: 1 },
  isArchived: { type: Boolean, default: false },
  settings: {
    allowMemberInvite: { type: Boolean, default: false }, // can editors invite?
    commentingEnabled: { type: Boolean, default: true },
    activityLog: { type: Boolean, default: true },
  },
  // Extra: AI-generated packing suggestions flag
  aiSuggestionsEnabled: { type: Boolean, default: false },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtuals
tripSchema.virtual('duration').get(function () {
  if (!this.startDate || !this.endDate) return 0;
  const diff = this.endDate - this.startDate;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

tripSchema.virtual('daysUntilTrip').get(function () {
  if (!this.startDate) return null;
  const now = new Date();
  const diff = this.startDate - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

tripSchema.virtual('budgetRemaining').get(function () {
  return (this.budget?.total || 0) - (this.budget?.spent || 0);
});

// Indexes
tripSchema.index({ owner: 1, createdAt: -1 });
tripSchema.index({ 'collaborators.user': 1 });
tripSchema.index({ slug: 1 });
tripSchema.index({ status: 1 });
tripSchema.index({ startDate: 1, endDate: 1 });

// Pre-save: generate slug
tripSchema.pre('save', async function (next) {
  if (this.isModified('title') || this.isNew) {
    const slugify = require('slugify');
    const base = slugify(this.title, { lower: true, strict: true });
    let slug = `${base}-${Date.now().toString(36)}`;
    this.slug = slug;
  }
  next();
});

// Method: check if user has access
tripSchema.methods.getUserRole = function (userId) {
  const normalizedUserId = userId.toString();

  // Owner check
  const ownerId =
    this.owner?._id?.toString?.() ||
    this.owner?.toString?.();

  if (ownerId === normalizedUserId) {
    return 'owner';
  }

  // Collaborator check
  const collaborator = this.collaborators.find((c) => {
    const collaboratorId =
      c.user?._id?.toString?.() ||
      c.user?.toString?.();

    return collaboratorId === normalizedUserId;
  });

  return collaborator ? collaborator.role : null;
};

tripSchema.methods.hasAccess = function (userId) {
  return this.getUserRole(userId) !== null;
};

tripSchema.methods.canEdit = function (userId) {
  const role = this.getUserRole(userId);
  return ['owner', 'editor'].includes(role);
};

module.exports = mongoose.model('Trip', tripSchema);