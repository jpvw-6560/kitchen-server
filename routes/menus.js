// routes/menus.js
// Routes pour le calendrier des menus

const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');

router.get('/period', menuController.getMenusByPeriod);
router.get('/semaine', menuController.getSemaineCourante);
router.get('/mois', menuController.getMoisCourant);
router.get('/liste-courses', menuController.getListeCourses);
router.get('/suggerer', menuController.suggererPlat);
router.get('/:date', menuController.getMenuByDate);
router.post('/', menuController.setMenu);
router.patch('/:date/valider', menuController.validerMenu);
router.delete('/:date', menuController.deleteMenu);

module.exports = router;
