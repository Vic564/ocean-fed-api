const mongoose = require("mongoose");
const Schema = require("mongoose").Schema;

const guestSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String }
});

const Guest = mongoose.model("Guest", guestSchema);

module.exports = Guest;
