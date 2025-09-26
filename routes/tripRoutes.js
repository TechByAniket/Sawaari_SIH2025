const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');

// POST /trips/start
// Creates a new 'in_progress' trip record.
// curl -X POST http://localhost:3000/trips/start -H "Content-Type: application/json" -d '{ "schedule_id": 807, "bus_id": 101 }'
router.post('/start', tripController.startTrip);

module.exports = router;