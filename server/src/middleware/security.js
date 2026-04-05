const helmet = require('helmet');

const cspDirectives = {
    directives: {
        defaultSrc: [
            "'self'"
        ],
        connectSrc: [
            "'self'",
            "http://localhost:8080",
            "https://checkout.stripe.com",
            "https://api.stripe.com",
            "https://maps.googleapis.com"
        ],
        frameSrc: [
            "'self'",
            "http://localhost:8080",
            "https://checkout.stripe.com",
            "https://*.js.stripe.com",
            "https://js.stripe.com",
            "https://hooks.stripe.com",
            "https://connect-js.stripe.com"
        ],
        scriptSrc: [
            "'self'",
            "https://checkout.stripe.com",
            "https://*.js.stripe.com",
            "https://js.stripe.com",
            "https://maps.googleapis.com",
            "https://connect-js.stripe.com"
        ],
        imgSrc: [
            "'self'",
            "https://*.stripe.com"
        ],
        styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "'sha256-0hAheEzaMe6uXIKV4EehS9pu1am1lj/KnnzrOYqckXk='"
        ],
    },
};

module.exports = helmet.contentSecurityPolicy(cspDirectives);