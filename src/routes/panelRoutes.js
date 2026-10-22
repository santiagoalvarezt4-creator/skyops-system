const { Router } = require('express');
const panel = require('../controllers/panelController');
const { hasRole } = require('../middlewares/authMiddleware');

const router = Router();

router.get('/admin/dashboard', hasRole('ADMINISTRADOR'), panel.adminDashboard);
router.get('/piloto/portal', hasRole('PILOTO'), panel.pilotoPortal);

module.exports = router;
