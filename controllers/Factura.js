const Factura = require('../models/Factura');

// Crear nueva factura
exports.createFactura = async (req, res) => {
  try {
    console.log("Datos de la factura recibidos:", req.body); // Imprimir los datos recibidos

    const factura = new Factura(req.body);
    await factura.save();
    
    res.status(201).json(factura);
  } catch (error) {
    console.error("Error al crear la factura:", error); // Imprimir el error en la consola
    res.status(400).json({ message: error.message });
  }
};

// Obtener todas las facturas
exports.getFacturas = async (req, res) => {
  try {
    const facturas = await Factura.find();
    res.json(facturas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener factura por ID
exports.getFacturaById = async (req, res) => {
  try {
    const factura = await Factura.findById(req.params.id);
    if (!factura) {
      return res.status(404).json({ message: 'Factura no encontrada' });
    }
    res.json(factura);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar factura
exports.updateFactura = async (req, res) => {
  try {
    const factura = await Factura.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!factura) {
      return res.status(404).json({ message: 'Factura no encontrada' });
    }
    res.json(factura);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Eliminar factura
exports.deleteFactura = async (req, res) => {
  try {
    const factura = await Factura.findByIdAndDelete(req.params.id);
    if (!factura) {
      return res.status(404).json({ message: 'Factura no encontrada' });
    }
    res.json({ message: 'Factura eliminada con éxito' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFacturasPorMes = async (req, res) => {
  try {
    console.log("Iniciando la consulta de facturas por mes.");

    const facturas = await Factura.aggregate([
      {
        $group: {
          _id: { $month: "$fechaVencimiento" }, // Agrupar por mes de fecha de vencimiento
          total: { $sum: 1 } // Contar el total de facturas por mes
        }
      },
      {
        $project: {
          mes: "$_id",
          total: 1,
          _id: 0
        }
      }
    ]);

    console.log("Facturas agrupadas por mes:", facturas);

    // Para devolver nombres de meses en lugar de números
    const meses = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    
    // Mapeo para obtener el nombre del mes
    const facturasPorMes = facturas.map(factura => {
      const mesNombre = meses[factura.mes - 1]; // Ajustar el índice
      console.log(`Mes: ${mesNombre}, Total: ${factura.total}`); // Mostrar mes y total
      return {
        mes: mesNombre,
        total: factura.total
      };
    });

    console.log("Facturas por mes:", facturasPorMes);

    // Devolver la respuesta
    res.json(facturasPorMes);
  } catch (error) {
    console.error("Error al obtener facturas por mes:", error);
    res.status(500).json({ message: error.message });
  }
};
