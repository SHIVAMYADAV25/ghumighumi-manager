const catchAsync = require('../utils/catchAsync');
const { AppError } = require('../middleware/errorHandler');
const Itinerary = require('../models/Itinerary');

// Uses Open-Meteo — free, no API key required
exports.getWeather = catchAsync(async (req, res, next) => {
  const { lat, lng, startDate, endDate } = req.query;

  if (!lat || !lng) return next(new AppError('lat and lng are required.', 400));

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&start_date=${startDate}&end_date=${endDate}`;

  const response = await fetch(url);
  if (!response.ok) return next(new AppError('Weather service unavailable.', 503));

  const data = await response.json();

  // Map WMO codes to descriptions
  const weatherDescriptions = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Foggy', 48: 'Freezing fog', 51: 'Light drizzle', 53: 'Moderate drizzle',
    61: 'Light rain', 63: 'Moderate rain', 65: 'Heavy rain',
    71: 'Light snow', 73: 'Moderate snow', 75: 'Heavy snow',
    80: 'Light showers', 81: 'Moderate showers', 82: 'Heavy showers',
    95: 'Thunderstorm', 96: 'Thunderstorm with hail',
  };

  const forecast = data.daily.time.map((date, i) => ({
    date,
    maxTemp: data.daily.temperature_2m_max[i],
    minTemp: data.daily.temperature_2m_min[i],
    precipitation: data.daily.precipitation_sum[i],
    condition: weatherDescriptions[data.daily.weathercode[i]] || 'Unknown',
    code: data.daily.weathercode[i],
  }));

  res.json({ success: true, data: forecast });
});

// Save weather to itinerary days
exports.saveWeatherToItinerary = catchAsync(async (req, res) => {
  const { weatherData } = req.body; // [{ date, condition, maxTemp, code }]

  const bulkOps = weatherData.map((w) => ({
    updateOne: {
      filter: { trip: req.trip._id, date: new Date(w.date) },
      update: {
        $set: {
          weather: {
            condition: w.condition,
            temp: w.maxTemp,
            icon: w.code,
            fetchedAt: new Date(),
          },
        },
      },
    },
  }));

  await Itinerary.bulkWrite(bulkOps);
  res.json({ success: true, message: 'Weather saved to itinerary.' });
});