const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });

const express = require('express');
const session = require('express-session');

const flashMiddleware = require('./middlewares/flashMiddleware');
const authRoutes = require('./routes/authRoutes');
const panelRoutes = require('./routes/panelRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Motor de plantillas ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.disable('x-powered-by');

// --- Parsers y archivos estáticos ---
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Sesiones ---
app.use(
  session({
    name: 'aero.sid',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 2, // 2 horas
    },
  })
);

// --- Mensajes flash (SweetAlert2) y usuario disponible en las vistas ---
app.use(flashMiddleware);

// --- Rutas ---
app.use('/', authRoutes);
app.use('/', panelRoutes);

// --- 404 ---
app.use((req, res) => {
  res.status(404).render('errors/error', {
    title: 'Página no encontrada',
    code: 404,
    message: 'La ruta que buscas no existe o fue desviada a otro destino.',
  });
});

// --- Manejador de errores ---
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).render('errors/error', {
    title: 'Error interno',
    code: 500,
    message: 'Ocurrió un error inesperado. Intenta nuevamente en unos minutos.',
  });
});

// En Express 5 los errores de arranque (p. ej. EADDRINUSE) llegan al callback de listen.
const server = app.listen(PORT, (err) => {
  if (err) {
    if (err.code === 'EADDRINUSE') {
      console.error(`✖  El puerto ${PORT} ya está en uso. Detén el otro proceso o cambia PORT en .env.`);
    } else {
      console.error('✖  No se pudo iniciar el servidor:', err);
    }
    process.exitCode = 1;
    return;
  }
  console.log(`✈  AeroGestión escuchando en http://localhost:${PORT}`);
});

module.exports = { app, server };
