const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');

// POST /trips/start - Creates a new 'in_progress' trip record.
router.post('/start', tripController.startTrip);

// GET /trips/active - Returns a list of all trips with status 'in_progress'
router.get('/active', tripController.getActiveTrips);

// POST /trips/:tripId/complete - Marks a trip as completed
router.post('/:tripId/complete', tripController.completeTrip);

module.exports = router;