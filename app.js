const express = require('express')
const mongoose = require('mongoose');
const bodyparser = require('body-parser');
var cors = require('cors')
const app = express();

app.use(cors());

if (process.env.NODE_ENV !== 'production') require('dotenv').config();

// Our models
const Guest = require("./models/guest");

const dbConfig = require('./config/config');
const port = process.env.PORT || 4000;

app.use(bodyparser.json());

app.get('/', (req, res) => {
  res.send('Ocean api works!')
})

app.post('/create', async (req, res) => {

  await console.log("hey");
  await console.log(req.body);

  const newGuest = new Guest();
  newGuest.name = req.body.name;
  newGuest.email = req.body.email;
  newGuest.phone = req.body.phone;

  await newGuest.save();
  /* const allGuests = await Guest.find(); */

  res.send('newGuest saved!');
})

const dbOptions = { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false };

// Start servern
mongoose.connect(dbConfig.databaseURL, dbOptions).then(() => {
    app.listen(port, () => console.log(`App listening on port ${port}! http://localhost:4000`))
});