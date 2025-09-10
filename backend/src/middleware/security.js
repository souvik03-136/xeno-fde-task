const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP'
});

const securityMiddleware = (app) => {
  app.use(helmet());
  app.use(limiter);
};

module.exports = securityMiddleware;