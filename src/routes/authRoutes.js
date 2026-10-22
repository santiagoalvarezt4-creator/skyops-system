const { Router } = require('express');
const auth = require('../controllers/authController');
const { isGuest, isAuthenticated } = require('../middlewares/authMiddleware');

const router = Router();

router.get('/', (req, res) => res.redirect('/login'));

router.get('/login', isGuest, auth.showLogin);
router.post('/login', isGuest, auth.login);

router.get('/register', isGuest, auth.showRegister);
router.post('/register', isGuest, auth.register);

router.get('/forgot-password', isGuest, auth.showForgot);
router.post('/forgot-password', isGuest, auth.forgot);

router.get('/reset-password/:token', isGuest, auth.showReset);
router.post('/reset-password/:token', isGuest, auth.reset);

router.post('/logout', isAuthenticated, auth.logout);

module.exports = router;
