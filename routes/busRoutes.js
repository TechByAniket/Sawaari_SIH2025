const express = require('express');
const router = express.Router();
const busController = require('../controllers/busController');

// GET /buses/search?query=andh
router.get("/search", busController.searchBusRoutes);

// GET /routes/:route_no/active-buses ----- example --> /routes/502/active-buses?direction=UP
router.get("/routes/:route_no/active-buses", busController.getActiveBusesByRoute);

router.get("/all-routes", busController.getAllBusRoutes);


module.exports = router;

