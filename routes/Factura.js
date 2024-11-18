const express = require('express');
const router = express.Router();
const facturaController = require('../controllers/factura');

// Rutas de facturas
router.get('/a/por-mes/a', facturaController.getFacturasPorMes); // Obtener facturas por mes
router.post('/', facturaController.createFactura); // Crear nueva factura
router.get('/', facturaController.getFacturas); // Obtener todas las facturas
router.get('/:id', facturaController.getFacturaById); // Obtener factura por ID
router.put('/:id', facturaController.updateFactura); // Actualizar factura
router.delete('/:id', facturaController.deleteFactura); // Eliminar factura



module.exports = router;
