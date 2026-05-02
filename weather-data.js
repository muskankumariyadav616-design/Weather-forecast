// =============================================
//  weather-data.js — Real API via Open-Meteo
//  Free, no API key required
// =============================================

const WeatherData = (() => {

  const WMO_MAP = {
    0:  { cond: 'sunny',         icon: '☀️',  label: 'Clear Sky' },
    1:  { cond: 'sunny',         icon: '🌤️',  label: 'Mainly Clear' },
    2:  { cond: 'partly_cloudy', icon: '⛅',  label: 'Partly Cloudy' },
    3:  { cond: 'cloudy',        icon: '☁️',  label: 'Overcast' },
    45: { cond: 'haze',          icon: '🌫️',  label: 'Foggy' },
    48: { cond: 'haze',          icon: '🌫️',  label: 'Icy Fog' },
    51: { cond: 'drizzle',       icon: '🌦️',  label: 'Light Drizzle' },
    53: { cond: 'drizzle',       icon: '🌦️',  label: 'Drizzle' },
    55: { cond: 'drizzle',       icon: '🌦️',  label: 'Heavy Drizzle' },
    61: { cond: 'rain',          icon: '🌧️',  label: 'Light Rain' },
    63: { cond: 'rain',          icon: '🌧️',  label: 'Moderate Rain' },
    65: { cond: 'heavy_rain',    icon: '🌧️',  label: 'Heavy Rain' },
    71: { cond: 'snow',          icon: '❄️',  label: 'Light Snow' },
    73: { cond: 'snow',          icon: '❄️',  label: 'Moderate Snow' },
    75: { cond: 'snow',          icon: '❄️',  label: 'Heavy Snow' },
    77: { cond: 'snow',          icon: '🌨️',  label: 'Snow Grains' },
    80: { cond: 'rain',          icon: '🌦️',  label: 'Rain Showers' },
    81: { cond: 'rain',          icon: '🌧️',  label: 'Moderate Showers' },
    82: { cond: 'heavy_rain',    icon: '⛈️',  label: 'Heavy Showers' },
    85: { cond: 'snow',          icon: '🌨️',  label: 'Snow Showers' },
    95: { cond: 'thunderstorm',  icon: '⛈️',  label: 'Thunderstorm' },
    96: { cond: 'thunderstorm',  icon: '⛈️',  label: 'Thunderstorm + Hail' },
    99: { cond: 'thunderstorm',  icon: '⛈️',  label: 'Heavy Thunderstorm' },
  };

  function getWMO(code) {
    return WMO_MAP[code] || { cond: 'partly_cloudy', icon: '⛅', label: 'Variable' };
  }

  async function geocodeCity(cityName) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Geocoding failed');
    const data = await res.json();
    if (!data.results || data.results.length === 0) throw new Error(`City "${cityName}" not found`);
    const r = data.results[0];
    return { name: r.name, country: r.country, lat: r.latitude, lon: r.longitude, timezone: r.timezone || 'auto' };
  }

  async function fetchForecast(lat, lon, timezone) {
    const tz  = encodeURIComponent(timezone || 'auto');
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`
      + `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max,uv_index_max`
      + `&hourly=temperature_2m,relativehumidity_2m,weathercode,windspeed_10m,visibility,precipitation_probability`
      + `&current_weather=true&timezone=${tz}&forecast_days=7`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Weather fetch failed');
    return res.json();
  }

  function parseAPIData(apiData) {
    const daily  = apiData.daily;
    const hourly = apiData.hourly;
    const cur    = apiData.current_weather;
    const DAY_NAMES   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const MON_NAMES   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    // All 7*24 hourly entries
    const allHourly = hourly.time.map((t, h) => {
      const wmo = getWMO(hourly.weathercode[h]);
      const hi  = h % 24;
      return {
        hour:       hi,
        label:      hi === 0 ? '12AM' : hi < 12 ? `${hi}AM` : hi === 12 ? '12PM' : `${hi-12}PM`,
        tempC:      hourly.temperature_2m[h] ?? 25,
        humidity:   hourly.relativehumidity_2m[h] ?? 60,
        rainChance: hourly.precipitation_probability?.[h] ?? 0,
        wind:       Math.round(hourly.windspeed_10m?.[h] ?? 10),
        condition:  wmo.cond,
        icon:       wmo.icon,
        isNow:      false,
      };
    });

    // Mark current hour on today's slice
    const nowH = new Date().getHours();
    if (allHourly[nowH]) allHourly[nowH].isNow = true;

    // 7-day forecast
    const weekData = daily.time.map((dateStr, i) => {
      const d   = new Date(dateStr + 'T12:00:00');
      const wmo = getWMO(daily.weathercode[i]);
      const slice = allHourly.slice(i * 24, i * 24 + 24);
      const hums  = slice.map(h => h.humidity).filter(v => v != null);
      const avgHum = hums.length ? Math.round(hums.reduce((a,b)=>a+b,0)/hums.length) : 70;
      const midVis = allHourly[i * 24 + 12]?.wind ?? 10;
      return {
        index:      i,
        date:       d,
        dayName:    DAY_NAMES[d.getDay()],
        dayShort:   DAY_NAMES[d.getDay()].slice(0,3).toUpperCase(),
        dateLabel:  `${d.getDate()} ${MON_NAMES[d.getMonth()]}`,
        hiC:        daily.temperature_2m_max[i] ?? 30,
        loC:        daily.temperature_2m_min[i] ?? 20,
        rainChance: daily.precipitation_probability_max[i] ?? 0,
        wind:       Math.round(daily.windspeed_10m_max[i] ?? 10),
        uvIndex:    Math.round(daily.uv_index_max?.[i] ?? 5),
        humidity:   avgHum,
        visibility: Math.round((allHourly[i * 24 + 12]?.wind ?? 10000) / 1000) || 10,
        pressure:   1013,
        condition:  wmo.cond,
        icon:       wmo.icon,
        label:      wmo.label,
      };
    });

    // Current conditions
    const curWMO = getWMO(cur.weathercode);
    const currentData = {
      tempC:      cur.temperature,
      humidity:   allHourly[nowH]?.humidity ?? weekData[0].humidity,
      wind:       Math.round(cur.windspeed),
      visibility: weekData[0].visibility,
      uvIndex:    weekData[0].uvIndex,
      condition:  curWMO.cond,
      icon:       curWMO.icon,
      label:      curWMO.label,
    };

    return { weekData, allHourly, currentData };
  }

  async function loadCity(cityName) {
    const geo  = await geocodeCity(cityName);
    const raw  = await fetchForecast(geo.lat, geo.lon, geo.timezone);
    const data = parseAPIData(raw);
    return {
      ...data,
      locationName: `${geo.name}, ${geo.country}`,
      lat: geo.lat,
      lon: geo.lon,
    };
  }

  function getHourlyForDay(allHourly, dayIndex) {
    return allHourly.slice(dayIndex * 24, dayIndex * 24 + 24).map((h, i) => ({
      ...h,
      hour:  i,
      label: i === 0 ? '12AM' : i < 12 ? `${i}AM` : i === 12 ? '12PM' : `${i-12}PM`,
    }));
  }

  function toF(c)          { return Math.round((c * 9/5 + 32) * 10) / 10; }
  function fmtTemp(c, cel) { return cel ? `${Math.round(c)}°` : `${toF(c)}°`; }

  return { loadCity, getHourlyForDay, toF, fmtTemp, getWMO };
})();
