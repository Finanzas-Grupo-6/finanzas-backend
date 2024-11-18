const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const carteraRoutes = require('./routes/Cartera');
const facturaRoutes = require('./routes/Factura');
const authRoutes = require('./routes/authRoutes'); // Importar rutas de autenticación

const app = express();
app.use(cors());
app.use(express.json());

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/finanzas-202402-erick', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Conectado a MongoDB'))
.catch(err => console.error('Error de conexión a MongoDB:', err));

app.use('/api/carteras', carteraRoutes);
app.use('/api/facturas', facturaRoutes);
app.use('/api/auth', authRoutes);

// Iniciar el servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
