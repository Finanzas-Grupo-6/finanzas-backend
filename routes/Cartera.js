const express = require('express');
const router = express.Router();
const carteraController = require('../controllers/Cartera');

// Rutas para la cartera
router.get('/monto-por-mes', carteraController.getMontoTotalPorMes);
router.get('/montos', carteraController.getCarterasConMontos);
router.post('/', carteraController.createCartera);
router.get('/', carteraController.getCarteras);
router.get('/:id', carteraController.getCarteraById);
router.put('/:id', carteraController.updateCartera);
router.delete('/:id', carteraController.deleteCartera);
router.get('/:id/recibir-hoy', carteraController.calcularMontoRecibirHoy);
router.post('/recibir-saldo/:userId/:carteraId', carteraController.recibirSaldoYActualizarCartera);


module.exports = router;
