const express = require('express')
const mongoose = require('mongoose');
var cors = require('cors')
const app = express();

var corsOptions = {
  origin: 'http://localhost:3000',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

if (process.env.NODE_ENV !== 'production') require('dotenv').config();

// Our models
const Guest = require("./models/guest");

const dbConfig = require('./config/config');
const port = process.env.PORT || 4000;

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('Ocean api works!')
})

app.get('/create', cors(corsOptions), async (req, res) => {

  const newGuest = new Guest();
  newGuest.name = "Roger";
  newGuest.email = "roger@gmail.com";
  newGuest.phone = "0705843795";

  await newGuest.save();

  res.send('newGuest saved!');
})

const dbOptions = { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false };

// Start servern
mongoose.connect(dbConfig.databaseURL, dbOptions).then(() => {
    app.listen(port, () => console.log(`App listening on port ${port}! http://localhost:4000`))
});