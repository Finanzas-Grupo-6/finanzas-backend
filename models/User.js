// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  saldo: { type: Number, default: 100 }  // Campo de saldo con valor predeterminado de 0
});

module.exports = mongoose.model('User', userSchema);
