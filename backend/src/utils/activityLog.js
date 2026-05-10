const ActivityLog = require('../models/ActivityLog');
const { getIO } = require('../socket/socketManager');
const logger = require('./logger');

const logActivity = async ({ trip, user, action, entityType, entityId, description, meta = {} }) => {
  try {
    const log = await ActivityLog.create({ trip, user, action, entityType, entityId, description, meta });
    
    // Broadcast to trip room
    const io = getIO();
    if (io) {
      const populated = await log.populate('user', 'name avatar');
      io.to(`trip:${trip}`).emit('activity:log', populated.toObject());
    }

    return log;
  } catch (err) {
    logger.error('Activity log error:', err.message);
  }
};

module.exports = { logActivity };