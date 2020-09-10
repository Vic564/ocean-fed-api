const express = require("express");
const mongoose = require("mongoose");
const bodyparser = require("body-parser");
const nodemailer = require("nodemailer");
const sendGridTransport = require("nodemailer-sendgrid-transport");
const cors = require("cors");
const app = express();
if (process.env.NODE_ENV !== "production") require("dotenv").config();

app.use(cors());

// Our models
const Guest = require("./models/guest");
const Reservation = require("./models/reservation");

const config = require("./config/config");
const port = process.env.PORT || 4000;

app.use(bodyparser.json());

// Nodemailer
const transport = nodemailer.createTransport(
  sendGridTransport({
    auth: {
      api_key: config.mail,
    },
  })
);


// Dev routes:
app.get("/", (req, res) => {
  res.send("<h1 style='text-align: center'>DEV MSG:<br> L'OCÉAN API WORKS!</h1>");
});

app.get("/reservations", async (req, res) => {
  const reservations = await Reservation.find();
  res.send(reservations);
});

app.get("/guests", async (req, res) => {
  const guests = await Guest.find();
  res.send(guests);
});

app.post("/delete-reservation", async (req, res) => {
  await console.log(req.body.refId);
  const deletedReservationResponse = await Reservation.deleteOne({ refId: req.body.refId });
  res.send("just deleted " + JSON.stringify(deletedReservationResponse.deletedCount) + " reservation.");
});

app.post("/cancel-reservation", async (req, res) => {
  await console.log(req.body.refIdToCancel);

  await Reservation.findOne({ refId: req.body.refIdToCancel }, async (err, doc) => {
    if (err) return console.log("there was an error", err);
    if (doc) {
      const guestWhoIsGoingToCancel = await Guest.findOne({ _id: doc.guestId});
      console.log(guestWhoIsGoingToCancel);
      await doc.remove( async (err, doc) => {
        if (err) return console.log("there was an error", err);
        if (doc) console.log("document removed", doc);
        await sendCancellationConfirmationEmail(guestWhoIsGoingToCancel.email);
        res.send("just cancelled reservation with ref " + JSON.stringify(doc.refId));
      })
    }
  })
});

app.post("/update-reservation", async (req, res) => {
  await console.log(req.body);

  await Reservation.findOneAndUpdate(
    { refId: req.body.reservationData.refId },
    { date: req.body.reservationData.date, time: req.body.reservationData.time, seats: req.body.reservationData.seats },
    { new: true },
    async (err, reservationDoc) => {
      if (err) return console.log("there was an error", err);
      if (reservationDoc) {
        await Guest.findOneAndUpdate(
          { _id: reservationDoc.guestId },
          { name: req.body.guestData.name, email: req.body.guestData.email, phone: req.body.guestData.phone },
          { new: true },
          (err, guestDoc) => {
            if (err) return console.log("there was an error", err);
            if (guestDoc) {
              console.log("updated reservation:", reservationDoc, "updated Guest:", guestDoc);
              res.send({ updatedReservation: reservationDoc, updatedGuest: guestDoc });
            }
          }
        );
      }
    }
  );
});

app.post("/reservations-by-date", async (req, res) => {
  await console.log(req.body.date);

  const reservationsByDate = await Reservation.find({ date: req.body.date });
  console.log(reservationsByDate);
  res.send(reservationsByDate);
});

app.post("/create-guest-and-reservation", async (req, res) => {
  await console.log(req.body);

  const guestWithSameEmail = await Guest.findOne({ email: req.body.guestData.email });

  console.log("sameEmail? :", guestWithSameEmail);

  if (!guestWithSameEmail) {
    const guest = new Guest({
      name: req.body.guestData.name,
      email: req.body.guestData.email,
      phone: req.body.guestData.phone,
    });

    await guest.save(async (err) => {
      if (err) return console.log("there was an error", err);

      const lastReservation = await Reservation.findOne().sort("-_id");
      let refId = 1;
      !lastReservation ? refId : (refId = lastReservation.refId + 1);

      const reservation = new Reservation({
        refId: refId,
        date: req.body.reservationData.date,
        time: req.body.reservationData.time,
        seats: req.body.reservationData.seats,
        guestId: guest._id,
      });

      await reservation.save(async (err) => {
        if (err) return console.log("there was an error", err);

        const guestsDB = await Guest.find();
        const reservationsDB = await Reservation.find();
        console.log("GUESTS IN DB: ", guestsDB);
        console.log("RESERVATIONS IN DB: ", reservationsDB);

        await sendReservationConfirmationEmail(req.body.guestData.email, refId);

        res.send({ guestsDB, reservationsDB });
      });
    });
  } else {
    await guestWithSameEmail.update(
      {
        name: req.body.guestData.name,
        phone: req.body.guestData.phone,
      },

      async (err) => {
        if (err) return console.log("there was an error", err);

        const lastReservation = await Reservation.findOne().sort("-_id");
        let refId = 1;
        !lastReservation ? refId : (refId = lastReservation.refId + 1);

        const reservation = new Reservation({
          refId: refId,
          date: req.body.reservationData.date,
          time: req.body.reservationData.time,
          seats: req.body.reservationData.seats,
          guestId: guestWithSameEmail._id,
        });

        await reservation.save(async (err) => {
          if (err) return console.log("there was an error", err);

          const guestsDB = await Guest.find();
          const reservationsDB = await Reservation.find();
          console.log("GUESTS IN DB: ", guestsDB);
          console.log("RESERVATIONS IN DB: ", reservationsDB);

          await sendReservationConfirmationEmail(req.body.guestData.email, refId);

          res.send({ guestsDB, reservationsDB });
        });
      }
    );
  }
});

function sendReservationConfirmationEmail(userEmail, refId) {
  transport.sendMail({
    to: userEmail,
    from: "no-reply@locean.com",
    subject: "Bokning klar!",
    html:
      "<h1>Du har bokat ett bord hos Restaurangen L'Océan! Välkomnen.</h1><br><p>Your bokningreferens: " +
      refId +
      "</p><p>Your email: " +
      userEmail +
      "</p><p>Vill du avboka? Följa länken: <a href='http://localhost:3000/cancel'>Avbokning sida<a>.</p>",
  });
}

function sendCancellationConfirmationEmail(userEmail) {
  transport.sendMail({
    to: userEmail,
    from: "no-reply@locean.com",
    subject: "Du har avbokat",
    html:
      "<h1>Du har avbokat ett bord hos Restaurangen L'Océan!</h1><p>Vill du boka igen? Följa länken: <a href='http://localhost:3000/reservation'>Bokning sida<a>.</p>",
  });
}

const dbOptions = { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false };

// Start servern
mongoose.connect(config.databaseURL, dbOptions).then(() => {
  app.listen(port, () => console.log(`App listening on port ${port}! http://localhost:4000`));
});
