const mongoose = require('mongoose');

const carteraSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
  },
  fechaCreacion: {
    type: Date,
    default: Date.now,
  },
  fechaDescuento: {
    type: Date,
    required: true,
  },
  totalLetras: {
    type: Number,
    default: 0,
  },
  tea: {
    type: Number,
    default: 0.0,
  },
  tcea: {
    type: Number,
    default: 0.0,
  },
  estado: {
    type: String,
    enum: ['activa', 'inactiva'], // Posibles estados
    default: 'activa',
  },
});

const Cartera = mongoose.model('Cartera', carteraSchema);

module.exports = Cartera;
