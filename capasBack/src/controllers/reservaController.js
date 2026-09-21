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

// IMPORTANTE: esta ruta genérica /:id va DESPUÉS de las rutas específicas de arriba,
// porque ':id' hace match con CUALQUIER texto (incluido "disponibilidad") y
// Express usa la primera ruta que coincida, en el orden en que están escritas.
router.get('/api/reservas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const reserva = await reservaModel.obtenerReservaPorId(id);
        if (!reserva) {
            return res.status(404).json({ error: "Reserva no encontrada" });
        }
        res.status(200).json(reserva);
    } catch (error) {
        console.error("Error al obtener la reserva:", error);
        res.status(500).json({ error: "Error del servidor al obtener la reserva" });
    }
});

router.post('/api/reservas', async (req, res) => {
    try {
        const { documento, nombreCompleto, email, fechaEntrada, fechaSalida, idHabitacion } = req.body;

        // Validar que no lleguen campos vacíos
        if (!documento || !nombreCompleto || !email || !fechaEntrada || !fechaSalida || !idHabitacion) {
            return res.status(400).json({ error: "Todos los campos (datos del huésped y reserva) son obligatorios" });
        }

        // Llamar a la nueva función del modelo que inserta/reutiliza el usuario y crea la reserva
        const resultado = await reservaModel.crearReservaConUsuario(
            documento,
            nombreCompleto,
            email,
            fechaEntrada,
            fechaSalida,
            idHabitacion
        );

        res.status(201).json({
            mensaje: "Reserva creada con éxito",
            idReserva: resultado.idReserva,
            precioTotal: resultado.precioTotal,
            noches: resultado.noches
        });
    } catch (error) {
        if (error.codigo === 'CONFLICTO_FECHAS') {
            return res.status(409).json({ error: error.message });
        }
        console.error("Error al insertar reserva:", error);
        res.status(500).json({ error: error.message || "Error del servidor al insertar la reserva" });
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

// Simula lo que en el proyecto real dispararía el módulo de pagos de Johan
router.put('/api/reservas/:id/confirmar', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await reservaModel.confirmarReserva(id);
        if (result.affectedRows === 0) {
            return res.status(409).json({ error: "La reserva no está Pendiente, no se puede confirmar" });
        }
        res.status(200).json({ mensaje: "Pago simulado: reserva confirmada con éxito" });
    } catch (error) {
        console.error("Error al confirmar reserva:", error);
        res.status(500).json({ error: "Error del servidor al confirmar la reserva" });
    }
});

module.exports = router;
