const mysql = require('mysql2/promise');


const connection = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'root', 
    database: 'bd_redes'
});


async function obtenerReservas() {
    const query = `
        SELECT r.idReserva, r.fechaEntrada, r.fechaSalida, r.precioTotal, r.estado,
               u.nombreCompleto AS cliente, h.numeroHabitacion
        FROM reserva r
        INNER JOIN usuario u ON r.idUsuario = u.idUsuario
        INNER JOIN habitacion h ON r.idHabitacion = h.idHabitacion
    `;
    const result = await connection.query(query);
    return result[0];
}

// Obtener una sola reserva con sus datos completos (para que el módulo de pagos sepa cuánto cobrar)
async function obtenerReservaPorId(idReserva) {
    const [rows] = await connection.query(`
        SELECT r.idReserva, r.fechaEntrada, r.fechaSalida, r.precioTotal, r.estado,
               u.idUsuario, u.nombreCompleto AS cliente,
               h.idHabitacion, h.numeroHabitacion
        FROM reserva r
        INNER JOIN usuario u ON r.idUsuario = u.idUsuario
        INNER JOIN habitacion h ON r.idHabitacion = h.idHabitacion
        WHERE r.idReserva = ?
    `, [idReserva]);
    return rows[0];
}

// Obtener una habitación por su ID (para calcular el precio de la reserva)
async function obtenerHabitacionPorId(idHabitacion) {
    const [rows] = await connection.query(
        'SELECT * FROM habitacion WHERE idHabitacion = ?',
        [idHabitacion]
    );
    return rows[0];
}

async function crearReserva(fechaEntrada, fechaSalida, precioTotal, idUsuario, idHabitacion) {
    // Antes de insertar, revisamos si ya existe una reserva activa que choque
    // con las fechas pedidas para esta misma habitación.
    const [conflictos] = await connection.query(`
        SELECT idReserva FROM reserva
        WHERE idHabitacion = ?
        AND estado IN ('Pendiente', 'Confirmada')
        AND (fechaEntrada < ? AND fechaSalida > ?)
    `, [idHabitacion, fechaSalida, fechaEntrada]);

    if (conflictos.length > 0) {
        const error = new Error('La habitación ya está reservada en esas fechas');
        error.codigo = 'CONFLICTO_FECHAS';
        throw error;
    }

    const query = `
        INSERT INTO reserva (fechaEntrada, fechaSalida, precioTotal, estado, idUsuario, idHabitacion)
        VALUES (?, ?, ?, 'Pendiente', ?, ?)
    `;
    const result = await connection.query(query, [fechaEntrada, fechaSalida, precioTotal, idUsuario, idHabitacion]);
    return result[0];
}

// Cancelar una reserva (cambiar estado a 'Cancelada')
async function cancelarReserva(idReserva) {
    const [result] = await connection.query(
        "UPDATE reserva SET estado = 'Cancelada' WHERE idReserva = ?",
        [idReserva]
    );
    return result;
}

// Simular el pago: solo confirma si sigue Pendiente (evita confirmar una ya cancelada)
async function confirmarReserva(idReserva) {
    const [result] = await connection.query(
        "UPDATE reserva SET estado = 'Confirmada' WHERE idReserva = ? AND estado = 'Pendiente'",
        [idReserva]
    );
    return result;
}

// Consultar habitaciones disponibles entre dos fechas (excluyendo mantenimiento)
async function consultarDisponibilidad(fechaEntrada, fechaSalida) {
    const [rows] = await connection.query(`
        SELECT * FROM habitacion
        WHERE estado != 'Mantenimiento'
        AND idHabitacion NOT IN (
            SELECT idHabitacion FROM reserva
            WHERE estado IN ('Pendiente', 'Confirmada')
            AND (fechaEntrada < ? AND fechaSalida > ?)
        )
    `, [fechaSalida, fechaEntrada]);
    return rows;
}

// AGREGAR ESTA FUNCIÓN:
async function crearReservaConUsuario(documento, nombreCompleto, email, fechaEntrada, fechaSalida, idHabitacion) {
    // 1. Verificar o insertar el usuario en bd_redes
    const sqlUsuario = `
        INSERT INTO usuario (documento, nombreCompleto, email, password, rol, estado)
        VALUES (?, ?, ?, 'huesped123', 'Huesped', 'Activo')
        ON DUPLICATE KEY UPDATE idUsuario = LAST_INSERT_ID(idUsuario);
    `;
    const [resUsuario] = await connection.query(sqlUsuario, [documento, nombreCompleto, email]);
    const idUsuarioGenerado = resUsuario.insertId;

    // 2. Obtener el precio de la habitación para calcular el total
    const habitacion = await obtenerHabitacionPorId(idHabitacion);
    if (!habitacion) throw new Error('Habitación no encontrada');

    const inicio = new Date(fechaEntrada);
    const fin = new Date(fechaSalida);
    const noches = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));

    if (noches <= 0) throw new Error('La fecha de salida debe ser posterior a la de entrada');

    const precioTotal = noches * habitacion.precioNoche;

    // 3. Crear la reserva vinculada al idUsuario obtenido
    const resReserva = await crearReserva(fechaEntrada, fechaSalida, precioTotal, idUsuarioGenerado, idHabitacion);

    return { idReserva: resReserva.insertId, precioTotal, noches };
}

module.exports = {
    obtenerReservas,
    obtenerReservaPorId,
    obtenerHabitacionPorId,
    crearReserva,
    crearReservaConUsuario, 
    cancelarReserva,
    confirmarReserva,
    consultarDisponibilidad
};
