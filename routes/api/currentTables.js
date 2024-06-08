const express = require('express');
const router = express.Router();
const validateToken = require('../../middleware/auth');

const { create, getAllCurrentTable } = require('../../controllers/currentTable');

router.post(
  '/',
  create,
);

router.get('/',  getAllCurrentTable)

module.exports = router;
