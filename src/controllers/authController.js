const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { ROLE_HOME } = require('../middlewares/authMiddleware');
const {
  validateLogin,
  validateRegister,
  validateForgot,
  validateReset,
} = require('../utils/validators');

const SALT_ROUNDS = 10;
const DEFAULT_ROLE = 'PILOTO'; // Rol asignado a los usuarios que se registran
const RESET_TOKEN_MINUTES = 30; // Vigencia del enlace de recuperación

// Hash ficticio para igualar el tiempo de respuesta cuando el correo no existe
const DUMMY_HASH = bcrypt.hashSync('dummy-password-aero', SALT_ROUNDS);

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

const errorFlash = (errors, title = 'Revisa el formulario') => ({
  icon: 'error',
  title,
  list: errors,
});

const getBases = async () => {
  const [bases] = await pool.query(
    'SELECT id_base, codigo_iata, nombre_ciudad FROM bases ORDER BY nombre_ciudad'
  );
  return bases;
};

/* ============================ LOGIN ============================ */

exports.showLogin = (req, res) => {
  res.render('auth/login', { title: 'Iniciar sesión', old: {} });
};

exports.login = async (req, res) => {
  const { errors, data } = validateLogin(req.body);
  const renderError = (status, flash) =>
    res.status(status).render('auth/login', {
      title: 'Iniciar sesión',
      old: { email: data.email },
      flash,
    });

  if (errors.length) return renderError(400, errorFlash(errors, 'Datos incompletos'));

  const [rows] = await pool.query(
    `SELECT u.id_usuario, u.id_persona, u.email, u.password_hash, u.estado,
            r.nombre AS rol, p.nombres, p.apellidos
       FROM usuarios u
       JOIN personas p ON p.id_persona = u.id_persona
       JOIN roles r    ON r.id_rol     = u.id_rol
      WHERE u.email = ?
      LIMIT 1`,
    [data.email]
  );
  const user = rows[0];

  const passwordOk = await bcrypt.compare(data.password, user ? user.password_hash : DUMMY_HASH);
  if (!user || !passwordOk) {
    return renderError(401, {
      icon: 'error',
      title: 'Credenciales incorrectas',
      text: 'El correo o la contraseña no son válidos.',
    });
  }

  if (user.estado !== 'ACTIVO') {
    return renderError(403, {
      icon: 'warning',
      title: 'Cuenta no disponible',
      text: `Tu cuenta se encuentra ${user.estado.toLowerCase()}. Contacta al administrador.`,
    });
  }

  const home = ROLE_HOME[user.rol];
  if (!home) {
    return renderError(403, {
      icon: 'info',
      title: 'Portal no disponible',
      text: `El portal para el perfil ${user.rol} aún no está habilitado.`,
    });
  }

  // Regenerar la sesión evita ataques de fijación de sesión
  await new Promise((resolve, reject) =>
    req.session.regenerate((err) => (err ? reject(err) : resolve()))
  );
  req.session.user = {
    id: user.id_usuario,
    idPersona: user.id_persona,
    email: user.email,
    nombre: `${user.nombres} ${user.apellidos}`,
    nombres: user.nombres,
    rol: user.rol,
  };
  req.session.flash = {
    icon: 'success',
    title: `¡Bienvenido, ${user.nombres}!`,
    text: 'Sesión iniciada correctamente.',
    toast: true,
  };
  await new Promise((resolve, reject) => req.session.save((err) => (err ? reject(err) : resolve())));
  return res.redirect(home);
};

/* =========================== REGISTRO =========================== */

exports.showRegister = async (req, res) => {
  res.render('auth/register', { title: 'Crear cuenta', bases: await getBases(), old: {} });
};

exports.register = async (req, res) => {
  const { errors, data } = validateRegister(req.body);
  const bases = await getBases();
  const { password, ...old } = data;
  const renderError = (status, flash) =>
    res.status(status).render('auth/register', { title: 'Crear cuenta', bases, old, flash });

  if (errors.length) return renderError(400, errorFlash(errors));

  if (!bases.some((b) => String(b.id_base) === data.id_base)) {
    return renderError(400, errorFlash(['La base de operaciones seleccionada no existe.']));
  }

  const [[dupCedula]] = await pool.query(
    'SELECT 1 AS existe FROM personas WHERE cedula_identidad = ? LIMIT 1',
    [data.cedula]
  );
  const [[dupEmail]] = await pool.query('SELECT 1 AS existe FROM usuarios WHERE email = ? LIMIT 1', [
    data.email,
  ]);
  const dupErrors = [];
  if (dupCedula) dupErrors.push('Ya existe una persona registrada con esa cédula.');
  if (dupEmail) dupErrors.push('El correo electrónico ya está registrado.');
  if (dupErrors.length) return renderError(409, errorFlash(dupErrors, 'Registro duplicado'));

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[role]] = await conn.query('SELECT id_rol FROM roles WHERE nombre = ?', [DEFAULT_ROLE]);
    if (!role) throw new Error(`No existe el rol por defecto ${DEFAULT_ROLE}`);

    const [persona] = await conn.query(
      `INSERT INTO personas (cedula_identidad, nombres, apellidos, telefono, direccion, id_base_regreso)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.cedula, data.nombres, data.apellidos, data.telefono, data.direccion, data.id_base]
    );

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    await conn.query(
      'INSERT INTO usuarios (id_persona, email, password_hash, id_rol) VALUES (?, ?, ?, ?)',
      [persona.insertId, data.email, hash, role.id_rol]
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      return renderError(409, errorFlash(['La cédula o el correo ya están registrados.'], 'Registro duplicado'));
    }
    throw err;
  } finally {
    conn.release();
  }

  req.session.flash = {
    icon: 'success',
    title: '¡Registro exitoso!',
    text: 'Tu cuenta fue creada. Ya puedes iniciar sesión.',
  };
  return res.redirect('/login');
};

/* ===================== RECUPERAR CONTRASEÑA ===================== */

exports.showForgot = (req, res) => {
  res.render('auth/forgot-password', { title: 'Recuperar contraseña', old: {} });
};

exports.forgot = async (req, res) => {
  const { errors, data } = validateForgot(req.body);
  if (errors.length) {
    return res.status(400).render('auth/forgot-password', {
      title: 'Recuperar contraseña',
      old: data,
      flash: errorFlash(errors, 'Correo inválido'),
    });
  }

  const [[user]] = await pool.query(
    "SELECT id_usuario FROM usuarios WHERE email = ? AND estado = 'ACTIVO' LIMIT 1",
    [data.email]
  );

  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    // Se guarda solo el hash del token; la expiración se calcula con el reloj de MySQL
    await pool.query(
      `UPDATE usuarios
          SET token_recuperacion = ?, expiracion_token = DATE_ADD(NOW(), INTERVAL ? MINUTE)
        WHERE id_usuario = ?`,
      [sha256(token), RESET_TOKEN_MINUTES, user.id_usuario]
    );

    const link = `${req.protocol}://${req.get('host')}/reset-password/${token}`;
    // TODO: enviar por correo (p. ej. con nodemailer). En desarrollo se muestra en consola.
    console.log(`\n[RECUPERACIÓN] Enlace para ${data.email} (válido ${RESET_TOKEN_MINUTES} min):\n${link}\n`);
  }

  // Respuesta genérica para no revelar qué correos existen
  req.session.flash = {
    icon: 'success',
    title: 'Solicitud enviada',
    text: `Si el correo está registrado, recibirás un enlace válido por ${RESET_TOKEN_MINUTES} minutos para restablecer tu contraseña.`,
  };
  return res.redirect('/login');
};

const findUserByToken = async (token) => {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const [[user]] = await pool.query(
    `SELECT id_usuario FROM usuarios
      WHERE token_recuperacion = ? AND expiracion_token > NOW()
      LIMIT 1`,
    [sha256(token)]
  );
  return user || null;
};

const invalidTokenRedirect = (req, res) => {
  req.session.flash = {
    icon: 'error',
    title: 'Enlace inválido',
    text: 'El enlace de recuperación no es válido o ha expirado. Solicita uno nuevo.',
  };
  return res.redirect('/forgot-password');
};

exports.showReset = async (req, res) => {
  const user = await findUserByToken(req.params.token);
  if (!user) return invalidTokenRedirect(req, res);
  res.render('auth/reset-password', { title: 'Restablecer contraseña', token: req.params.token });
};

exports.reset = async (req, res) => {
  const { token } = req.params;
  const user = await findUserByToken(token);
  if (!user) return invalidTokenRedirect(req, res);

  const { errors, data } = validateReset(req.body);
  if (errors.length) {
    return res.status(400).render('auth/reset-password', {
      title: 'Restablecer contraseña',
      token,
      flash: errorFlash(errors),
    });
  }

  const hash = await bcrypt.hash(data.password, SALT_ROUNDS);
  await pool.query(
    `UPDATE usuarios
        SET password_hash = ?, token_recuperacion = NULL, expiracion_token = NULL
      WHERE id_usuario = ?`,
    [hash, user.id_usuario]
  );

  req.session.flash = {
    icon: 'success',
    title: 'Contraseña actualizada',
    text: 'Ya puedes iniciar sesión con tu nueva contraseña.',
  };
  return res.redirect('/login');
};

/* ============================ LOGOUT ============================ */

exports.logout = (req, res) => {
  req.session.regenerate(() => {
    req.session.flash = {
      icon: 'success',
      title: 'Sesión cerrada',
      text: '¡Buen vuelo! Vuelve pronto.',
      toast: true,
    };
    res.redirect('/login');
  });
};
