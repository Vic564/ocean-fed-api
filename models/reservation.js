const mongoose = require("mongoose");
const Schema = require("mongoose").Schema;

const reservationSchema = new Schema({
  refId: { type: Number, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  seats: { type: Number, required: true },
  guestId: { type: Schema.Types.ObjectId, ref: "Guest", required: true }
});

const Reservation = mongoose.model("Reservation", reservationSchema);

module.exports = Reservation;
