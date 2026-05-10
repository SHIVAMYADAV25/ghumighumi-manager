const logger = require('../utils/logger');

class AppError extends Error {
  constructor(message, statusCode, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

const handleCastError = (err) =>
  new AppError(`Invalid ${err.path}: ${err.value}`, 400);

const handleDuplicateKey = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return new AppError(`${field} already exists.`, 409);
};

const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((e) => e.message);
  return new AppError('Validation failed.', 400, errors);
};

const handleJWTError = () => new AppError('Invalid token. Please log in.', 401);
const handleJWTExpiredError = () => new AppError('Token expired. Please log in again.', 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message,
    errors: err.errors,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      errors: err.errors || undefined,
    });
  } else {
    logger.error('Unexpected error:', err);
    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Something went wrong. Please try again.',
    });
  }
};

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err, message: err.message };
    if (err.name === 'CastError') error = handleCastError(err);
    if (err.code === 11000) error = handleDuplicateKey(err);
    if (err.name === 'ValidationError') error = handleValidationError(err);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
    sendErrorProd(error, res);
  }
};

const notFound = (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found.`, 404));
};

module.exports = { AppError, errorHandler, notFound };