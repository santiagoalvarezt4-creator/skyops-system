/**
 * Validaciones del lado del servidor.
 * Las mismas reglas se replican en src/public/js/validation.js para el cliente.
 */
const PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
  digits: /^\d+$/,
  letters: /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+(?:\s[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+)*$/,
  // Mínimo 8 caracteres, al menos una letra y un número (bcrypt admite hasta 72 bytes)
  password: /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/,
};

const clean = (v) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : '');

const isEmpty = (v) => clean(v) === '';

function validateEmail(email, errors) {
  if (isEmpty(email)) errors.push('El correo electrónico es obligatorio.');
  else if (!PATTERNS.email.test(clean(email)) || clean(email).length > 150)
    errors.push('El formato del correo electrónico no es válido.');
}

function validatePassword(password, confirm, errors) {
  if (!password) return errors.push('La contraseña es obligatoria.');
  if (!PATTERNS.password.test(password))
    errors.push('La contraseña debe tener mínimo 8 caracteres e incluir letras y números.');
  if (password !== confirm) errors.push('Las contraseñas no coinciden.');
}

function validateLogin({ email, password }) {
  const errors = [];
  if (isEmpty(email) || !password) {
    errors.push('Completa el correo y la contraseña.');
    return { errors, data: { email: clean(email).toLowerCase() } };
  }
  validateEmail(email, errors);
  return { errors, data: { email: clean(email).toLowerCase(), password } };
}

function validateRegister(body) {
  const errors = [];
  const data = {
    cedula: clean(body.cedula),
    nombres: clean(body.nombres),
    apellidos: clean(body.apellidos),
    telefono: clean(body.telefono),
    direccion: clean(body.direccion),
    id_base: clean(body.id_base),
    email: clean(body.email).toLowerCase(),
  };

  const required = {
    cedula: 'cédula',
    nombres: 'nombres',
    apellidos: 'apellidos',
    telefono: 'teléfono',
    direccion: 'dirección',
    id_base: 'base de operaciones',
    email: 'correo electrónico',
  };
  const missing = Object.keys(required).filter((k) => data[k] === '');
  if (missing.length || !body.password) {
    errors.push(
      `Campos obligatorios vacíos: ${[...missing.map((k) => required[k]), ...(!body.password ? ['contraseña'] : [])].join(', ')}.`
    );
    return { errors, data };
  }

  if (!PATTERNS.digits.test(data.cedula) || data.cedula.length < 5 || data.cedula.length > 20)
    errors.push('La cédula debe contener solo números (entre 5 y 20 dígitos).');
  if (!PATTERNS.letters.test(data.nombres) || data.nombres.length > 100)
    errors.push('Los nombres solo pueden contener letras y espacios.');
  if (!PATTERNS.letters.test(data.apellidos) || data.apellidos.length > 100)
    errors.push('Los apellidos solo pueden contener letras y espacios.');
  if (!PATTERNS.digits.test(data.telefono) || data.telefono.length < 7 || data.telefono.length > 20)
    errors.push('El teléfono debe contener solo números (entre 7 y 20 dígitos).');
  if (data.direccion.length < 5 || data.direccion.length > 200)
    errors.push('La dirección debe tener entre 5 y 200 caracteres.');
  if (!PATTERNS.digits.test(data.id_base)) errors.push('Selecciona una base de operaciones válida.');

  validateEmail(data.email, errors);
  validatePassword(body.password, body.confirm_password, errors);

  return { errors, data: { ...data, password: body.password } };
}

function validateForgot({ email }) {
  const errors = [];
  validateEmail(email, errors);
  return { errors, data: { email: clean(email).toLowerCase() } };
}

function validateReset({ password, confirm_password }) {
  const errors = [];
  validatePassword(password, confirm_password, errors);
  return { errors, data: { password } };
}

module.exports = { PATTERNS, validateLogin, validateRegister, validateForgot, validateReset };
