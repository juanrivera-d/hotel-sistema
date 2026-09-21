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

router.get('/api/reservas/disponibilidad', async (req, res) => {
    try {
        const { fechaEntrada, fechaSalida } = req.query;
        if (!fechaEntrada || !fechaSalida) {
            return res.status(400).json({ error: "Debes enviar fechaEntrada y fechaSalida" });
        }
        const habitaciones = await reservaModel.consultarDisponibilidad(fechaEntrada, fechaSalida);
        res.status(200).json(habitaciones);
    } catch (error) {
        console.error("Error al consultar disponibilidad:", error);
        res.status(500).json({ error: "Error del servidor al consultar disponibilidad" });
    }
});

router.post('/api/reservas', async (req, res) => {
    try {
        const { fechaEntrada, fechaSalida, idUsuario, idHabitacion } = req.body;

        const habitacion = await reservaModel.obtenerHabitacionPorId(idHabitacion);
        if (!habitacion) {
            return res.status(404).json({ error: "Habitación no encontrada" });
        }

        const noches = Math.ceil(
            (new Date(fechaSalida) - new Date(fechaEntrada)) / (1000 * 60 * 60 * 24)
        );
        if (noches <= 0) {
            return res.status(400).json({ error: "La fecha de salida debe ser posterior a la de entrada" });
        }

        const precioTotal = noches * Number(habitacion.precioNoche);

        await reservaModel.crearReserva(fechaEntrada, fechaSalida, precioTotal, idUsuario, idHabitacion);
        res.status(201).json({ mensaje: "Reserva creada con éxito", precioTotal, noches });
    } catch (error) {
        console.error("Error al insertar reserva:", error);
        res.status(500).json({ error: "Error del servidor al insertar la reserva" });
    }
});

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

module.exports = router;
