const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getUsers,
  getTables,
  getPlayers,
  getLogs,
  getOverview,
  getRakefee,
  getPerformance,
} = require('../../controllers/admin');

// router.get('/:id', getTemplateById);
router.get('/dashboard', getDashboard);
router.get('/users', getUsers);
router.get('/tables', getTables);
router.get('/players', getPlayers);
router.get('/logs', getLogs);
router.get('/overview', getOverview);
router.get('/rakefee', getRakefee);
router.get('/performance', getPerformance);

module.exports = router;
