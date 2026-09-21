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
 
// Obtener una habitación por su ID (para calcular el precio de la reserva)
async function obtenerHabitacionPorId(idHabitacion) {
    const [rows] = await connection.query(
        'SELECT * FROM habitacion WHERE idHabitacion = ?',
        [idHabitacion]
    );
    return rows[0];
}
 
async function crearReserva(fechaEntrada, fechaSalida, precioTotal, idUsuario, idHabitacion) {
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
 
module.exports = {
    obtenerReservas,
    obtenerHabitacionPorId,
    crearReserva,
    cancelarReserva,
    consultarDisponibilidad
};
