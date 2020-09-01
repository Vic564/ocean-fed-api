const express = require('express')
const mongoose = require('mongoose');
const bodyparser = require('body-parser');
const cors = require('cors');
const app = express();

app.use(cors());

if (process.env.NODE_ENV !== 'production') require('dotenv').config();

// Our models
const Guest = require("./models/guest");
const Reservation = require("./models/reservation");

const dbConfig = require('./config/config');
const port = process.env.PORT || 4000;

app.use(bodyparser.json());

app.get('/', (req, res) => {
  res.send("<h1 style='text-align: center'>DEV MSG:<br> L'OCÉAN API WORKS!</h1>");
});

app.post('/reservations-by-date', async (req, res) => {

  await console.log(req.body.date);

  const reservationsByDate = await Reservation.find({ date: req.body.date });
  console.log(reservationsByDate);
  res.send(reservationsByDate);
});

// get to deleteall is DEV, made as a shorcut for deleting all entries in GUEST table.
app.get('/deleteall', async (req, res) => {
  const responseGuest = await Guest.deleteMany();
  const responseReservation = await Reservation.deleteMany();
  console.log(responseGuest.deletedCount + responseReservation.deletedCount + " model(s) deleted.");
  res.send(JSON.stringify(responseGuest.deletedCount + responseReservation.deletedCount) + " model(s) deleted.");
});

app.post('/create-guest-and-reservation', async (req, res) => {

  await console.log(req.body);

  const guest = new Guest({
    name: req.body.guestData.name,
    email: req.body.guestData.email,
    phone: req.body.guestData.phone
  });

  await guest.save(async (err) => {
    if (err) return console.log('there was an error', err);

    const lastReservation = await Reservation.findOne().sort('-_id');
    let refId = 1;
    !lastReservation ? refId : refId = lastReservation.refId + 1;

    const reservation = new Reservation({
      refId: refId,
      date: req.body.reservationData.date,
      time: req.body.reservationData.time,
      seats: req.body.reservationData.seats,
      guestId: guest._id
    });

    await reservation.save(async (err) => {
      if (err) return console.log("there was an error", err);

      const guestsDB = await Guest.find();
      const reservationsDB = await Reservation.find();
      console.log("GUESTS IN DB: ", guestsDB);
      console.log("RESERVATIONS IN DB: ", reservationsDB);
      res.send({ guestsDB, reservationsDB });

    });
  });

});

const dbOptions = { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false };

// Start servern
mongoose.connect(dbConfig.databaseURL, dbOptions).then(() => {
    app.listen(port, () => console.log(`App listening on port ${port}! http://localhost:4000`))
});