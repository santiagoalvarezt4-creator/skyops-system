/**
 * Expone en las vistas:
 *  - flash: mensaje de un solo uso guardado en sesión (se muestra con SweetAlert2).
 *  - currentUser: usuario autenticado (o null).
 */
module.exports = (req, res, next) => {
  res.locals.flash = req.session.flash || null;
  res.locals.currentUser = req.session.user || null;
  delete req.session.flash;
  next();
};
