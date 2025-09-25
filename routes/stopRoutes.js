const express = require('express');
const router = express.Router();
const stopController = require('../controllers/stopController');


// GET /stops/nearby?lat=19.123&lng=72.836
router.get("/nearby", stopController.getNearbyStops);

// GET /stops/:stop_id/incoming-buses              example -> /stops/12/incoming-buses
router.get("/:stop_id/incoming-buses", stopController.getIncomingBuses);

// GET /stops/search?query=andh ---------example---> /stops/search?query=bandra
router.get("/search", stopController.searchStopRoutes);

// GET /stops/:stop_id/active-buses ----- example --> /stops/502/active-buses?direction=UP
// router.get("/:stop_id/active-buses", stopController.getActiveBusesByStop);

// GET /stops/:stop_id/active-trips ----- example --> /stops/502/active-trips?direction=UP
// router.get("/:stop_id/active-trips", stopController.getActiveTripsByStop);


module.exports = router;
