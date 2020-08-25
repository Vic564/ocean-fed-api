if (process.env.NODE_ENV !== 'production') require('dotenv').config();

const config = {
    databaseURL: process.env.DATABASE
};

module.exports = config;