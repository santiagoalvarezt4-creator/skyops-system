/**
 * Seed de usuarios base de AeroGestión.
 * Uso: npm run seed   (o: node src/scripts/seed.js)
 *
 * Es idempotente: se puede ejecutar varias veces sin duplicar registros.
 *  - Si la persona ya existe (por cédula) conserva sus datos personales.
 *  - El usuario se crea o se actualiza con la contraseña y el rol indicados.
 *  - El piloto se crea en la tabla `pilotos` si aún no existe.
 */
const bcrypt = require('bcryptjs');
const pool = require('../config/database');

const SALT_ROUNDS = 10;
const PASSWORD = 'Admin123*';

const SEED = [
  {
    persona: {
      cedula_identidad: '100100100',
      nombres: 'Santiago',
      apellidos: 'Administrador',
      telefono: '3001001000',
      direccion: 'Av. El Dorado # 103-09',
      base_iata: 'BOG',
    },
    usuario: { email: 'admin@skyops.com', rol: 'ADMINISTRADOR' },
  },
  {
    persona: {
      cedula_identidad: '200200200',
      nombres: 'Carlos',
      apellidos: 'Piloto',
      telefono: '3002002000',
      direccion: 'Cra. 43A # 1-50',
      base_iata: 'MDE',
    },
    usuario: { email: 'piloto@skyops.com', rol: 'PILOTO' },
    piloto: { licencia_numero: 'ATPL-98234', horas_vuelo: 3200 },
  },
];

async function seedEntry(conn, { persona, usuario, piloto }, passwordHash) {
  const [[base]] = await conn.query('SELECT id_base FROM bases WHERE codigo_iata = ?', [persona.base_iata]);
  if (!base) throw new Error(`No existe la base ${persona.base_iata}`);

  const [[rol]] = await conn.query('SELECT id_rol FROM roles WHERE nombre = ?', [usuario.rol]);
  if (!rol) throw new Error(`No existe el rol ${usuario.rol}`);

  // Persona: inserta o reutiliza la existente (LAST_INSERT_ID devuelve su id en ambos casos)
  const [p] = await conn.query(
    `INSERT INTO personas (cedula_identidad, nombres, apellidos, telefono, direccion, id_base_regreso)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE id_persona = LAST_INSERT_ID(id_persona)`,
    [persona.cedula_identidad, persona.nombres, persona.apellidos, persona.telefono, persona.direccion, base.id_base]
  );
  const idPersona = p.insertId;

  // Usuario: inserta o actualiza contraseña, rol y estado
  await conn.query(
    `INSERT INTO usuarios (id_persona, email, password_hash, id_rol, estado)
     VALUES (?, ?, ?, ?, 'ACTIVO')
     ON DUPLICATE KEY UPDATE
       password_hash = VALUES(password_hash),
       id_rol = VALUES(id_rol),
       estado = 'ACTIVO',
       token_recuperacion = NULL,
       expiracion_token = NULL`,
    [idPersona, usuario.email, passwordHash, rol.id_rol]
  );

  if (piloto) {
    // Conserva licencia y horas si el piloto ya existe
    await conn.query(
      `INSERT INTO pilotos (id_persona, licencia_numero, horas_vuelo)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE id_persona = id_persona`,
      [idPersona, piloto.licencia_numero, piloto.horas_vuelo]
    );
  }

  console.log(`  ✔ ${usuario.rol.padEnd(13)} ${usuario.email} (id_persona ${idPersona})`);
}

(async () => {
  const conn = await pool.getConnection();
  try {
    console.log('Sembrando usuarios base...');
    const passwordHash = await bcrypt.hash(PASSWORD, SALT_ROUNDS);

    await conn.beginTransaction();
    for (const entry of SEED) await seedEntry(conn, entry, passwordHash);
    await conn.commit();

    console.log('Seed completado.');
  } catch (err) {
    await conn.rollback();
    console.error('✖ Error en el seed:', err.message);
    process.exitCode = 1;
  } finally {
    conn.release();
    await pool.end();
  }
})();
