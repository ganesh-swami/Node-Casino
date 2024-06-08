const express = require('express');
const router = express.Router();
const validateToken = require('../../middleware/auth');
const { handleSlotChipsRequest } = require('../../controllers/slotchips');

router.post('/slot', validateToken, handleSlotChipsRequest);

module.exports = router;
