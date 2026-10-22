const pool = require('../config/database');

exports.adminDashboard = async (req, res) => {
  const [[stats]] = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM usuarios)                                AS usuarios,
       (SELECT COUNT(*) FROM aviones)                                 AS aviones,
       (SELECT COUNT(*) FROM aviones WHERE estado = 'OPERATIVO')      AS aviones_operativos,
       (SELECT COUNT(*) FROM vuelos  WHERE estado = 'PROGRAMADO')     AS vuelos_programados,
       (SELECT COUNT(*) FROM bases)                                   AS bases`
  );

  const [usuarios] = await pool.query(
    `SELECT u.email, u.estado, r.nombre AS rol, p.nombres, p.apellidos, b.codigo_iata,
            DATE_FORMAT(u.created_at, '%d/%m/%Y') AS creado
       FROM usuarios u
       JOIN personas p ON p.id_persona = u.id_persona
       JOIN roles r    ON r.id_rol     = u.id_rol
       JOIN bases b    ON b.id_base    = p.id_base_regreso
      ORDER BY u.created_at DESC, u.id_usuario DESC
      LIMIT 8`
  );

  res.render('admin/dashboard', { title: 'Panel de administración', stats, usuarios });
};

exports.pilotoPortal = async (req, res) => {
  const { idPersona } = req.session.user;

  const [[perfil]] = await pool.query(
    `SELECT p.cedula_identidad, p.nombres, p.apellidos, p.telefono,
            b.codigo_iata, b.nombre_ciudad, b.nombre_aeropuerto,
            pl.licencia_numero, pl.horas_vuelo
       FROM personas p
       JOIN bases b        ON b.id_base     = p.id_base_regreso
       LEFT JOIN pilotos pl ON pl.id_persona = p.id_persona
      WHERE p.id_persona = ?`,
    [idPersona]
  );

  const [vuelos] = await pool.query(
    `SELECT v.codigo_vuelo, v.estado,
            o.codigo_iata AS origen,  o.nombre_ciudad AS ciudad_origen,
            d.codigo_iata AS destino, d.nombre_ciudad AS ciudad_destino,
            DATE_FORMAT(v.fecha_salida, '%d/%m/%Y') AS fecha_salida,
            TIME_FORMAT(v.hora_salida, '%H:%i')     AS hora_salida,
            TIME_FORMAT(v.hora_llegada, '%H:%i')    AS hora_llegada,
            a.matricula, a.modelo
       FROM vuelos v
       JOIN bases o   ON o.id_base  = v.id_origen
       JOIN bases d   ON d.id_base  = v.id_destino
       JOIN aviones a ON a.id_avion = v.id_avion
      WHERE v.id_piloto = ?
      ORDER BY v.fecha_salida, v.hora_salida`,
    [idPersona]
  );

  res.render('piloto/portal', { title: 'Portal del piloto', perfil, vuelos });
};
