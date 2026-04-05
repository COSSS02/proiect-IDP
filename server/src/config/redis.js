const { createClient } = require('redis');
const RedisStore = require('connect-redis');

const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://redis:6379'
});

redisClient.on('error', err => console.log('Redis Client Error', err));

redisClient.connect().catch(console.error);

const redisStore = new RedisStore.RedisStore({
    client: redisClient,
   prefix: 'session:',
});

module.exports = { redisClient, redisStore };