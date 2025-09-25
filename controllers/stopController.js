const stopService = require("../services/stopService");

const getNearbyStops = async (req, res) => {
  const { lat, lng } = req.query; // user’s current location
  try {
    const stops = await stopService.getNearbyStops(lat, lng);
    res.json(stops);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const getIncomingBuses = async (req, res) => {
  const { stop_id } = req.params;
  try {
    const buses = await stopService.getIncomingBuses(stop_id);
    res.json(buses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const searchStopRoutes = async (req, res) => {
  const query = req.query.query;
  try {
    const results = await stopService.searchStopRoutes(query);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



module.exports = { getNearbyStops, getIncomingBuses, searchStopRoutes };
