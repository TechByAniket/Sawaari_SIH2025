const express = require('express');
const router = express.Router();
const etaController = require('../controllers/etaController');

// Defines the endpoint: GET /eta/to-nearest-stop?lat=...&lng=...
router.get('/to-nearest-stop', etaController.getEtaToNearestStop);

module.exports = router;