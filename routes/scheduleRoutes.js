const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');

// GET /schedules/today
// Returns a list of all scheduled trips for today that are not yet active.
router.get('/today', scheduleController.getTodaySchedules);

module.exports = router;