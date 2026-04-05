const stripe = require('stripe');
require('dotenv').config();

const stripeClient = stripe(process.env.STRIPE_SECRET);

module.exports = stripeClient;