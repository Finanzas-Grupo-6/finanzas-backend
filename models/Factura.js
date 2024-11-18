const mongoose = require('mongoose');

const facturaSchema = new mongoose.Schema({
  cliente: { type: String, required: true },
  numeroFactura: { type: String, required: true },
  monto: { type: Number, required: true },
  moneda: { type: String, required: true },
  fechaVencimiento: { type: Date, required: true },
  carteraId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cartera', required: true },
});

const Factura = mongoose.model('Factura', facturaSchema);

module.exports = Factura;
