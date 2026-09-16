const { Router } = require('express');
const router = Router();
const reservaModel = require('../models/reservaModel');

router.get('/api/reservas', async (req, res) => {
    try {
        const reservas = await reservaModel.obtenerReservas();
        res.status(200).json(reservas);
    } catch (error) {
        console.error("Error al obtener reservas:", error);
        res.status(500).json({ error: "Error del servidor al obtener las reservas" });
    }
});

router.post('/api/reservas', async (req, res) => {
    try {
        const { fechaEntrada, fechaSalida, precioTotal, idUsuario, idHabitacion } = req.body;
        await reservaModel.crearReserva(fechaEntrada, fechaSalida, precioTotal, idUsuario, idHabitacion);
        res.status(201).json({ mensaje: "Reserva creada con éxito" });
    } catch (error) {
        console.error("Error al insertar reserva:", error);
        res.status(500).json({ error: "Error del servidor al insertar la reserva" });
    }
});

// PUT: Cancelar reserva
router.put('/api/reservas/:id/cancelar', async (req, res) => {
    try {
        const { id } = req.params;
        await reservaModel.cancelarReserva(id);
        res.status(200).json({ mensaje: "Reserva cancelada con éxito" });
    } catch (error) {
        console.error("Error al cancelar reserva:", error);
        res.status(500).json({ error: "Error del servidor al cancelar la reserva" });
    }
});

// GET: Buscar habitaciones disponibles por fechas
router.get('/api/reservas/disponibilidad', async (req, res) => {
    try {
        const { fechaEntrada, fechaSalida } = req.query;
        if (!fechaEntrada || !fechaSalida) {
            return res.status(400).json({ error: "Debe proporcionar fechaEntrada y fechaSalida" });
        }
        const disponibles = await reservaModel.consultarDisponibilidad(fechaEntrada, fechaSalida);
        res.status(200).json(disponibles);
    } catch (error) {
        console.error("Error al consultar disponibilidad:", error);
        res.status(500).json({ error: "Error del servidor al consultar disponibilidad" });
    }
});

module.exports = router;