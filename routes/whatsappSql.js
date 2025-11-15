// WhatsApp Twilio webhook for SQL AI assistant
const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const { getSQLQuery } = require('../controllers/openAIController');

// Load from environment or .env
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM; // e.g. 'whatsapp:+14155238886'
const client = twilio(accountSid, authToken);

// Webhook endpoint for Twilio WhatsApp
router.post('/whatsapp-sql', async (req, res) => {
  console.log('BODY:', req.body);
  const from = req.body.From;
  const body = req.body.Body;
  if (!body) return res.status(400).send('No message body');
  try {
    // Use incoming message as SQL question
    const result = await getSQLQuery({ q: body });
    const reply = result.sqlQuery || 'Sorry, could not generate a SQL query.';
    // Send reply via Twilio
    await client.messages.create({
      from: whatsappFrom,
      to: from,
      body: reply
    });
    res.status(200).send('OK');
  } catch (err) {
    await client.messages.create({
      from: whatsappFrom,
      to: from,
      body: 'Error: ' + (err.message || 'Unknown error')
    });
    res.status(500).send('Error');
  }
});

module.exports = router;
