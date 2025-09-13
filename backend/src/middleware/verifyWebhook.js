const crypto = require('crypto');

const verifyWebhook = (req, res, next) => {
  const hmac = req.headers['x-shopify-hmac-sha256'];
  const topic = req.headers['x-shopify-topic'];

  if (!hmac || !topic) {
    return res.status(401).json({ error: 'Missing webhook signature' });
  }

  const body = req.body;
  let bodyString;

  if (typeof body === 'string') {
    bodyString = body;
  } else {
    bodyString = JSON.stringify(body);
  }

  const generatedHash = crypto
    .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET || 'default-secret')
    .update(bodyString, 'utf8')
    .digest('base64');

  if (generatedHash !== hmac) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  req.webhookTopic = topic;
  next();
};

module.exports = verifyWebhook;