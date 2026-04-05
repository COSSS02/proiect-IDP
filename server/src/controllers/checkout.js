const stripe = require('../config/stripe');
const Cart = require('../models/cart');
const User = require('../models/user');
const Order = require('../models/orders');
const { redisClient } = require('../config/redis');

function parseMySQLDateTime(s) {
    if (!s) return null;
    if (typeof s === 'string') {
        const normalized = s.includes('T') ? s : s.replace(' ', 'T');
        const d = new Date(normalized);
        return isNaN(d) ? null : d;
    }
    const d = new Date(s);
    return isNaN(d) ? null : d;
};

function getEffectiveUnitPrice(item) {
    const price = Number(item.price || 0);
    const dprice = Number(item.discountPrice || 0);
    const start = parseMySQLDateTime(item.discountStartDate);
    const end = parseMySQLDateTime(item.discountEndDate);
    const now = new Date();
    const active =
        dprice > 0 &&
        start && end &&
        now >= start && now <= end &&
        dprice < price;
    return active ? dprice : price;
};

const checkoutController = {

    async createCheckoutSession(req, res) {
        try {
            const userId = req.user.id;
            const { shippingAddressId, billingAddressId } = req.body;

            if (!shippingAddressId || !billingAddressId) {
                return res.status(400).json({ message: "Shipping and billing addresses are required." });
            }

            let cartItems;
            const cacheKey = `cart:user:${userId}`;
            const cachedCart = await redisClient.get(cacheKey);
            if (cachedCart) {
                cartItems = JSON.parse(cachedCart);
            } else {
                cartItems = await Cart.getByUserId(req.user.id);
            }

            if (!cartItems || cartItems.length === 0) {
                return res.status(400).json({ message: "Your cart is empty." });
            }

            let stripeCustomerId = await User.getStripeCustomerId(userId);
            if (!stripeCustomerId) {
                const customer = await stripe.customers.create({ email: req.user.email });
                stripeCustomerId = customer.id;
                await User.setStripeCustomerId(userId, stripeCustomerId);
            }

            const line_items = cartItems.map(item => {
                const unit = getEffectiveUnitPrice(item.product);
                return {
                    price_data: {
                        currency: 'usd',
                        product_data: { name: item.product.name },
                        unit_amount: Math.round(unit * 100),
                    },
                    quantity: item.quantity,
                };
            });

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                mode: 'payment',
                customer: stripeCustomerId,
                line_items,
                success_url: `${process.env.CLIENT_URL || 'https://localhost:5173'}/order/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.CLIENT_URL || 'https://localhost:5173'}/cart`,
                metadata: {
                    cart_user_id: userId,
                    shippingAddressId: shippingAddressId,
                    billingAddressId: billingAddressId,
                },
                payment_intent_data: {
                    setup_future_usage: 'on_session',
                },
            });

            res.status(200).json({ id: session.id });

        } catch (error) {
            console.error("Error creating Stripe checkout session:", error);
            res.status(500).json({ message: "Failed to create checkout session", error: error.message });
        }
    },

    async fulfillOrder(req, res) {
        try {
            const { sessionId } = req.body;

            const existingOrder = await Order.findByStripeSessionId(sessionId);
            if (existingOrder) {
                return res.status(200).json({ message: "Order already processed.", orderId: existingOrder.id });
            }

            // If no order exists, proceed with creation
            const session = await stripe.checkout.sessions.retrieve(sessionId);

            if (session.payment_status === 'paid') {
                const { cart_user_id, shippingAddressId, billingAddressId } = session.metadata;

                await redisClient.del(`cart:user:${cart_user_id}`)
                await redisClient.del(`orders:user:${cart_user_id}`)

                if (parseInt(cart_user_id, 10) !== req.user.id) {
                    return res.status(403).json({ message: "Forbidden: User mismatch." });
                }

                const result = await Order.createFromCart(
                    cart_user_id,
                    {
                        shippingAddressId: shippingAddressId,
                        billingAddressId: billingAddressId,
                        totalAmount: session.amount_total / 100,
                        stripeSessionId: sessionId
                    }
                );

                res.status(200).json({ message: "Order placed successfully", orderId: result.orderId });
            } else {
                res.status(400).json({ message: "Payment not successful." });
            }
        } catch (error) {
            res.status(500).json({ message: "Failed to fulfill order", error: error.message });
        }
    }
};

module.exports = checkoutController;