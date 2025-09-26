const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');

// POST /trips/start - Creates a new 'in_progress' trip record.
router.post('/start', tripController.startTrip);

// GET /trips/active - Returns a list of all trips with status 'in_progress'
router.get('/active', tripController.getActiveTrips);

module.exports = router;