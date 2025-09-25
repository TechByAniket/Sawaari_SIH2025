const express = require('express');
const router = express.Router();
const busController = require('../controllers/busController');

// GET /buses/search?query=andh
router.get("/search", busController.searchBusRoutes);

// GET buses/routes/:route_no/active-buses ----- example --> buses/routes/502/active-buses?direction=UP
router.get("/routes/:route_no/active-buses", busController.getActiveBusesByRoute);

// GET /buses/active-trips
router.get("/active-trips", busController.getAllActiveTrips);

// GET /buses/:bus_id/live-location ----example --> /buses/1/live-location
router.get('/:bus_id/live-location', busController.getBusLiveLocation);

// Add this route to your busRoutes.js file
router.put('/:bus_id/location', busController.updateBusLocation);







module.exports = router;

