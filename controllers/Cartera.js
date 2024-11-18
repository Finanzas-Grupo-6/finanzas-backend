const Cartera = require("../models/Cartera");
const Factura = require("../models/Factura");
const User = require("../models/User");


exports.getMontoTotalPorMes = async (req, res) => {
  try {
    const montoTotalPorMes = await Factura.aggregate([
      {
        $group: {
          _id: { $month: "$fechaVencimiento" },
          totalMonto: { $sum: "$monto" }
        }
      },
      {
        $project: {
          mes: "$_id",
          totalMonto: 1,
          _id: 0
        }
      }
    ]);

    // Para devolver nombres de meses en lugar de números
    const meses = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    
    const montoPorMes = montoTotalPorMes.map(monto => ({
      mes: meses[monto.mes - 1],
      totalMonto: monto.totalMonto
    }));

    res.json(montoPorMes);
  } catch (error) {
    console.error("Error al obtener monto total por mes:", error);
    res.status(500).json({ message: error.message });
  }
};


// Crear nueva cartera
exports.createCartera = async (req, res) => {
  try {
    const cartera = new Cartera(req.body);
    await cartera.save();
    res.status(201).json(cartera);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Obtener todas las carteras con sus facturas
exports.getCarteras = async (req, res) => {
  try {
    const carteras = await Cartera.find();

    // Función para obtener la fecha de hoy en UTC
    const obtenerFechaDeHoyUTC = () => {
      const ahora = new Date();
      return new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate()));
    };

    const hoyUTC = obtenerFechaDeHoyUTC();

    // Para cada cartera, buscar sus facturas y calcular el TCEA
    const carterasConFacturas = await Promise.all(
      carteras.map(async (cartera) => {
        const facturas = await Factura.find({ carteraId: cartera._id });
        const tea = parseFloat(cartera.tea) / 100; // Convertir TEA a formato decimal

        if (isNaN(tea)) {
          throw new Error(`La TEA de la cartera con ID ${cartera._id} no es un número válido`);
        }

        let montoTotal = 0;
        let pesoTotal = 0;
        const facturasConValorDescontado = facturas.map((factura) => {
          const montoFactura = parseFloat(factura.monto);
          const fechaVencimiento = new Date(factura.fechaVencimiento);

          // Calcular días restantes
          const fechaDescuentoUTC = Date.UTC(
            cartera.fechaDescuento.getUTCFullYear(),
            cartera.fechaDescuento.getUTCMonth(),
            cartera.fechaDescuento.getUTCDate()
          );
          const vencimientoUTC = Date.UTC(
            fechaVencimiento.getUTCFullYear(),
            fechaVencimiento.getUTCMonth(),
            fechaVencimiento.getUTCDate()
          );

          const diasRestantes = Math.ceil((vencimientoUTC - fechaDescuentoUTC) / (1000 * 60 * 60 * 24));

          let valorDescontado;
          if (diasRestantes > 0) {
            const TEP = Math.pow(1 + tea, diasRestantes / 365) - 1;
            const tasaDescontada = TEP / (1 + TEP);
            valorDescontado = montoFactura * (1 - tasaDescontada);
          } else {
            valorDescontado = montoFactura;
          }

          montoTotal += valorDescontado;

          return {
            ...factura.toObject(),
            valorDescontado: valorDescontado.toFixed(2),
          };
        });

        // Calcular el peso total para el TCEA
        facturasConValorDescontado.forEach((factura) => {
          const montoFactura = parseFloat(factura.monto);
          const pesoFactura = montoFactura / montoTotal;
          pesoTotal += pesoFactura;
        });

        // Calcular el TCEA
        const TCEA = tea * pesoTotal * 100;

        return {
          ...cartera.toObject(),
          facturas: facturasConValorDescontado,
          numeroDeFacturas: facturas.length,
          tcea: TCEA.toFixed(2),
        };
      })
    );

    res.json(carterasConFacturas);
  } catch (error) {
    console.error("Error en getCarteras:", error);
    res.status(500).json({ message: error.message });
  }
};


// Obtener cartera por ID
exports.getCarteraById = async (req, res) => {
  try {
    // Encuentra la cartera por su ID
    const cartera = await Cartera.findById(req.params.id);
    if (!cartera) {
      return res.status(404).json({ message: "Cartera no encontrada" });
    }

    // Encuentra las facturas que pertenecen a esta cartera
    const facturas = await Factura.find({ carteraId: cartera._id });

    // Devuelve la cartera junto con las facturas
    //   console.log({ ...cartera.toObject(), facturas })
    res.json({ ...cartera.toObject(), facturas });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar cartera
exports.updateCartera = async (req, res) => {
  try {
    const cartera = await Cartera.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!cartera) {
      return res.status(404).json({ message: "Cartera no encontrada" });
    }
    res.json(cartera);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Eliminar cartera
exports.deleteCartera = async (req, res) => {
  try {
    const cartera = await Cartera.findByIdAndDelete(req.params.id);
    if (!cartera) {
      return res.status(404).json({ message: "Cartera no encontrada" });
    }
    res.json({ message: "Cartera eliminada con éxito" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.calcularMontoRecibirHoy = async (req, res) => {
  try {
    const { id } = req.params; // ID de la cartera
    console.log("ID de la cartera:", id);

    const cartera = await Cartera.findById(id);
    console.log("Cartera encontrada:", cartera);

    if (!cartera) {
      return res.status(404).json({ message: "Cartera no encontrada" });
    }

    const facturas = await Factura.find({ carteraId: cartera._id });
    console.log("Facturas encontradas:", facturas);

    if (facturas.length === 0) {
      return res
        .status(404)
        .json({ message: "No hay facturas asociadas a esta cartera" });
    }

    const tea = parseFloat(cartera.tea) / 100; // Convertir TEA a formato decimal
    console.log("TEA en formato decimal:", tea);

    if (isNaN(tea)) {
      throw new Error("La TEA de la cartera no es un número válido");
    }

    // Función para obtener la fecha de hoy en la zona horaria de Perú (UTC-5)
    const obtenerFechaDeHoyPeru = () => {
      const ahora = new Date();
      const opciones = { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' };
      const partesFecha = new Intl.DateTimeFormat('en-CA', opciones).format(ahora).split('-');
      const [year, month, day] = partesFecha;
      return new Date(`${year}-${month}-${day}T00:00:00-05:00`);
    };

    const hoy = obtenerFechaDeHoyPeru();
    console.log("Fecha de hoy (hora de Perú):", hoy);

    let montoTotal = 0;
    const resumenFacturas = [];
    let TCEA = 0;

    facturas.forEach((factura) => {
      console.log(`Procesando factura con ID ${factura._id}`);

      const montoFactura = parseFloat(factura.monto);
      console.log(`Monto de la factura: ${montoFactura}`);

      if (isNaN(montoFactura)) {
        console.warn(`Monto no válido en la factura con ID: ${factura._id}`);
        return;
      }

      const fechaVencimiento = new Date(factura.fechaVencimiento);
      console.log(`Fecha de vencimiento (UTC): ${fechaVencimiento.toISOString()}`);

      // Calcular los días restantes usando fechas en UTC
      const fechaDescuentoUTC = Date.UTC(
        cartera.fechaDescuento.getUTCFullYear(),
        cartera.fechaDescuento.getUTCMonth(),
        cartera.fechaDescuento.getUTCDate()
      );
      const vencimientoUTC = Date.UTC(
        fechaVencimiento.getUTCFullYear(),
        fechaVencimiento.getUTCMonth(),
        fechaVencimiento.getUTCDate()
      );

      const diasRestantes = Math.ceil((vencimientoUTC - fechaDescuentoUTC) / (1000 * 60 * 60 * 24));
      console.log(`Días restantes (UTC): ${diasRestantes}`);

      let valorDescontado;
      let tasaDescontada;

      const TEP = Math.pow(1 + tea, diasRestantes / 365) - 1; // Cálculo de TEP
      if (diasRestantes > 0) {
        // Calcula la Tasa Descontada (TD)
        tasaDescontada = TEP / (1 + TEP);
        console.log(`Tasa Descontada (TD): ${tasaDescontada}`);

        // Calcula el Valor Descontado (Vdsct)
        valorDescontado = montoFactura * (1 - tasaDescontada);
        console.log(`Valor descontado (Vdsct): ${valorDescontado}`);

        montoTotal += valorDescontado;
      } else {
        // Si la factura ya venció, se incluye el monto completo
        console.log(`La factura con ID ${factura._id} ya venció. Monto incluido sin descuento: ${montoFactura}`);
        valorDescontado = montoFactura;
        montoTotal += montoFactura;
      }

      // Agrega un resumen de esta factura al arreglo
      resumenFacturas.push({
        id: factura._id,
        numeroFactura: factura.numeroFactura, // Incluye el número de factura
        montoOriginal: montoFactura.toFixed(2),
        fechaVencimiento: fechaVencimiento.toISOString().split("T")[0], // Mantener en UTC
        diasRestantes: diasRestantes > 0 ? diasRestantes : 0,
        tasaDescontada: tasaDescontada ? tasaDescontada.toFixed(4) : '0.0000',
        montoDescontado: valorDescontado.toFixed(2),
      });
    });

    let pesoTotal = 0;
    facturas.forEach((factura) => {
      let pesoFactura = factura.monto / montoTotal;
      pesoTotal += pesoFactura;
    });

    TCEA = tea * pesoTotal * 100;

    console.log("Monto total a recibir hoy:", montoTotal);
    console.log(resumenFacturas);
    res.json({
      TCEA,
      montoRecibirHoy: montoTotal.toFixed(2),
      resumenFacturas,
      message: `El monto total a recibir hoy es de ${montoTotal.toFixed(2)}`,
    });
  } catch (error) {
    console.error("Error en calcularMontoRecibirHoy:", error);
    res.status(500).json({ message: error.message });
  }
};



exports.recibirSaldoYActualizarCartera = async (req, res) => {
  try {
    const { userId, carteraId } = req.params;

    // Buscar la cartera por ID
    const cartera = await Cartera.findById(carteraId);
    if (!cartera) {
      return res.status(404).json({ message: "Cartera no encontrada" });
    }

    // Obtener las facturas asociadas a la cartera
    const facturas = await Factura.find({ carteraId: cartera._id });
    if (facturas.length === 0) {
      return res
        .status(404)
        .json({ message: "No hay facturas asociadas a esta cartera" });
    }

    const tea = parseFloat(cartera.tea) / 100; // Cambiar de TCEA a TEA
    if (isNaN(tea)) {
      throw new Error("La TEA de la cartera no es un número válido");
    }

    // Función para obtener la fecha de hoy en la zona horaria de Perú (UTC-5)
    const obtenerFechaDeHoyPeru = () => {
      const ahora = new Date();
      const opciones = { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' };
      const partesFecha = new Intl.DateTimeFormat('en-CA', opciones).format(ahora).split('-');
      const [year, month, day] = partesFecha;
      return new Date(`${year}-${month}-${day}T00:00:00-05:00`); // Fecha de hoy a medianoche en Perú
    };

    const hoy = obtenerFechaDeHoyPeru();
    console.log("Fecha de hoy (hora de Perú):", hoy);

    let montoTotal = 0;

    for (const factura of facturas) {
      const montoFactura = parseFloat(factura.monto);
      if (isNaN(montoFactura)) {
        console.warn(`Monto no válido en la factura con ID: ${factura._id}`);
        continue;
      }

      const fechaVencimiento = new Date(factura.fechaVencimiento);
      if (isNaN(fechaVencimiento.getTime())) {
        console.warn(
          `Fecha de vencimiento no válida en la factura con ID: ${factura._id}`
        );
        continue;
      }

      // Calcular los días restantes usando fechas en UTC
      const fechaDescuentoUTC = Date.UTC(cartera.fechaDescuento.getUTCFullYear(), cartera.fechaDescuento.getUTCMonth(), cartera.fechaDescuento.getUTCDate());
      const vencimientoUTC = Date.UTC(fechaVencimiento.getUTCFullYear(), fechaVencimiento.getUTCMonth(), fechaVencimiento.getUTCDate());

      const diasRestantes = Math.ceil((vencimientoUTC - fechaDescuentoUTC) / (1000 * 60 * 60 * 24));
      console.log(`Días restantes (UTC): ${diasRestantes}`);

      let montoDescontado;
      if (diasRestantes > 0) {
        // Calcula la TEP
        const TEP = Math.pow(1 + tea, diasRestantes / 365) - 1;

        // Calcula la Tasa Descontada (TD)
        const tasaDescontada = TEP / (1 + TEP);

        // Calcula el Valor Descontado (Vdsct)
        montoDescontado = montoFactura * (1 - tasaDescontada);
      } else {
        // Si la factura ya venció, se incluye el monto completo
        montoDescontado = montoFactura;
      }

      montoTotal += montoDescontado;
    }

    // Actualizar el saldo del usuario
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Si el usuario no tiene saldo, inicializarlo
    if (typeof user.saldo !== "number") {
      user.saldo = 0;
    }

    user.saldo += montoTotal;
    await user.save();

    // Actualizar el estado de la cartera a "inactiva"
    cartera.estado = "inactiva";
    await cartera.save();

    res.json({
      message: `Saldo actualizado con éxito. El monto de ${montoTotal.toFixed(2)} ha sido añadido al saldo del usuario.`,
      saldoActualizado: user.saldo,
      estadoCartera: cartera.estado,
    });
  } catch (error) {
    console.error("Error en recibirSaldoYActualizarCartera:", error);
    res.status(500).json({ message: error.message });
  }
};

// Obtener todas las carteras con sus montos totales
exports.getCarterasConMontos = async (req, res) => {
  try {
    const carteras = await Cartera.find(); // Obtener todas las carteras
    const carterasConMontos = await Promise.all(
      carteras.map(async (cartera) => {
        const facturas = await Factura.find({ carteraId: cartera._id }); // Obtener facturas de la cartera
        const montoTotal = facturas.reduce((total, factura) => total + factura.monto, 0); // Calcular monto total
        return {
          ...cartera.toObject(), // Convertir a objeto y agregar el monto total
          montoTotal: montoTotal.toFixed(2), // Formato a dos decimales
        };
      })
    );

    res.json(carterasConMontos); // Enviar respuesta con carteras y montos
  } catch (error) {
    console.error("Error al obtener carteras con montos:", error);
    res.status(500).json({ message: error.message });
  }
};
