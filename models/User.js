// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String // plain text for now
});

module.exports = mongoose.model('User', userSchema);
