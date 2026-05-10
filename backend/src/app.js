require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const { errorHandler, notFound } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const tripRoutes = require('./routes/trip.routes');
const itineraryRoutes = require('./routes/itinerary.routes');
const activityRoutes = require('./routes/activity.routes');
const collaboratorRoutes = require('./routes/collaborator.routes');
const commentRoutes = require('./routes/comment.routes');
const checklistRoutes = require('./routes/checklist.routes');
const budgetRoutes = require('./routes/budget.routes');
const attachmentRoutes = require('./routes/attachment.routes');
const reservationRoutes = require('./routes/reservation.routes');
const notificationRoutes = require('./routes/notification.routes');
const inviteRoutes = require('./routes/invite.routes');
const weatherRoutes = require('./routes/weather.routes');

const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts. Try again in 15 minutes.' },
});

app.use('/api', globalLimiter);
app.use('/api/v1/auth', authLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

// Data sanitization
app.use(mongoSanitize());

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.http(msg.trim()) }
  }));
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// API Routes
const API = '/api/v1';
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/users`, userRoutes);
app.use(`${API}/trips`, tripRoutes);
app.use(`${API}/trips/:tripId/itineraries`, itineraryRoutes);
app.use(`${API}/trips/:tripId/activities`, activityRoutes);
app.use(`${API}/trips/:tripId/collaborators`, collaboratorRoutes);
app.use(`${API}/trips/:tripId/comments`, commentRoutes);
app.use(`${API}/trips/:tripId/checklists`, checklistRoutes);
app.use(`${API}/trips/:tripId/budget`, budgetRoutes);
app.use(`${API}/trips/:tripId/attachments`, attachmentRoutes);
app.use(`${API}/trips/:tripId/reservations`, reservationRoutes);
app.use(`${API}/notifications`, notificationRoutes);
app.use(`${API}/invites`, inviteRoutes);
app.use(`${API}/weather`, weatherRoutes);

// 404 & error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;