const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

// Cada quien agrega su propio controller aqui cuando lo tenga listo
const reservaController = require('./controllers/reservaController'); // Juan David
// const habitacionController = require('./controllers/habitacionController'); // Javier
// const usuarioController = require('./controllers/usuarioController');       // Santiago
// const pagoController = require('./controllers/pagoController');             // Johan
// const servicioController = require('./controllers/servicioController');    // Sofia

const app = express();

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

app.use(reservaController);
// app.use(habitacionController);
// app.use(usuarioController);
// app.use(pagoController);
// app.use(servicioController);

app.listen(3000, () => {
    console.log('HotelProyecto ejecutandose en el puerto 3000');
});