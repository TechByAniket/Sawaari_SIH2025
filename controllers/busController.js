const busService = require("../services/busService");

// GET /buses/search?query=andh
const searchBusRoutes = async (req, res) => {
  const query = req.query.query;
  try {
    const results = await busService.searchBusRoutes(query);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /routes/:route_no/active-buses ----- example --> /routes/502/active-buses?direction=UP
const getActiveBusesByRoute = async (req, res) => {
  const { route_no } = req.params;
  const { direction } = req.query; // optional filter
  try {
    const buses = await busService.getActiveBusesByRoute(route_no, direction);
    res.json(buses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAllActiveTrips = async (req, res) => {
  try {
    const trips = await busService.getAllActiveTrips();
    res.json(trips);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const getBusLiveLocation = async (req, res) => {
  const { bus_id } = req.params;
  try {
    const location = await busService.getBusLiveLocation(bus_id);
    if (location) {
      res.json(location);
    } else {
      res.status(404).json({ message: 'Live location not found for this bus.' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Add this function to your busController.js
const updateBusLocation = async (req, res) => {
  const { bus_id } = req.params;
  const { lat, lng } = req.body;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'Latitude and longitude are required.' });
  }

  try {
    const updatedTrip = await busService.updateBusLocation(bus_id, lat, lng);
    if (updatedTrip) {
      res.json({ message: 'Location updated successfully', trip: updatedTrip });
    } else {
      res.status(404).json({ message: 'No active trip found for this bus.' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


module.exports = { getActiveBusesByRoute, searchBusRoutes, getAllActiveTrips, getBusLiveLocation, updateBusLocation };