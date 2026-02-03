const { authenticate, authorize, generateToken } = require('./auth');
const { errorHandler, notFound } = require('./errorHandler');

module.exports = {
  authenticate,
  authorize,
  generateToken,
  errorHandler,
  notFound
};
