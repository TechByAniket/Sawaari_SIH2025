const etaService = require('../services/etaService');

const getEtaToNearestStop = async (req, res) => {
  const { lat, lng } = req.query; // Get user's location from URL

  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng query parameters are required.' });
  }

  try {
    const etas = await etaService.calculateEtaToNearestStop(parseFloat(lat), parseFloat(lng));
    res.json(etas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getEtaToNearestStop };