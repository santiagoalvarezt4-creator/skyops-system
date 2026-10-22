/** Ruta de inicio de cada rol tras autenticarse. */
const ROLE_HOME = {
  ADMINISTRADOR: '/admin/dashboard',
  PILOTO: '/piloto/portal',
};

/** Exige sesión activa. Evita que el navegador cachee páginas protegidas. */
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    res.set('Cache-Control', 'no-store');
    return next();
  }
  req.session.flash = {
    icon: 'warning',
    title: 'Acceso restringido',
    text: 'Debes iniciar sesión para continuar.',
  };
  return res.redirect('/login');
};

/** Exige que el usuario autenticado tenga alguno de los roles indicados. */
const hasRole = (...roles) => [
  isAuthenticated,
  (req, res, next) => {
    if (roles.includes(req.session.user.rol)) return next();
    return res.status(403).render('errors/error', {
      title: 'Acceso denegado',
      code: 403,
      message: 'Tu perfil no tiene autorización para acceder a esta sección.',
    });
  },
];

/** Solo para invitados: si ya hay sesión, redirige al panel de su rol. */
const isGuest = (req, res, next) => {
  const user = req.session.user;
  if (user && ROLE_HOME[user.rol]) return res.redirect(ROLE_HOME[user.rol]);
  return next();
};

module.exports = { ROLE_HOME, isAuthenticated, hasRole, isGuest };
