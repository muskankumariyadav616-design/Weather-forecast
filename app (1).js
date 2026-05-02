//  app.js — Main controller (real API version)


const App = (() => {

  let state = {
    isCelsius:   true,
    weekData:    [],
    allHourly:   [],
    currentData: null,
    currentChart:'temp',
    location:    'Udaipur',
  };

  const $ = id => document.getElementById(id);

  // ── Loading helpers ──
  function showLoading(msg) {
    let wrap = $('loadingWrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'loadingWrap';
      wrap.style.cssText = 'position:fixed;inset:0;background:rgba(10,12,15,.85);z-index:500;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;backdrop-filter:blur(6px)';
      wrap.innerHTML = `
        <div id="loadSpinner" style="width:48px;height:48px;border:3px solid #252b35;border-top-color:#00e5b0;border-radius:50%;animation:spin .8s linear infinite"></div>
        <div id="loadMsg" style="font-family:Space Mono,monospace;font-size:.8rem;letter-spacing:.2em;color:#00e5b0"></div>
        <style>@keyframes spin{to{transform:rotate(360deg)}}</style>`;
      document.body.appendChild(wrap);
    }
    $('loadMsg').textContent = msg || 'LOADING...';
    wrap.style.display = 'flex';
  }
  function hideLoading() {
    const wrap = $('loadingWrap');
    if (wrap) wrap.style.display = 'none';
  }
  function showError(msg) {
    hideLoading();
    let box = $('errorBox');
    if (!box) {
      box = document.createElement('div');
      box.id = 'errorBox';
      box.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:#2a1515;border:1px solid #ff6b35;color:#ff6b35;font-family:Space Mono,monospace;font-size:.75rem;padding:12px 20px;border-radius:6px;z-index:600;letter-spacing:.1em;cursor:pointer';
      box.onclick = () => box.remove();
      document.body.appendChild(box);
    }
    box.textContent = '⚠ ' + msg + ' (click to dismiss)';
    setTimeout(() => box?.remove(), 5000);
  }

  // ── Load city data from real API ──
  async function loadCity(cityName) {
    showLoading(`FETCHING ${cityName.toUpperCase()}...`);
    try {
      const data = await WeatherData.loadCity(cityName);
      state.weekData    = data.weekData;
      state.allHourly   = data.allHourly;
      state.currentData = data.currentData;
      state.location    = data.locationName;
      $('locInput').value = data.locationName;
      renderAll();
      Charts.drawWeatherArt(
        $('weatherCanvas'),
        data.currentData.condition,
        new Date().getHours() >= 6 && new Date().getHours() < 19
      );
      $('lastUpdated').textContent = 'Updated: ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (err) {
      showError(err.message || 'Could not load weather data');
    } finally {
      hideLoading();
    }
  }

  // ── Render current conditions ──
  function renderCurrent() {
    const c = state.currentData;
    if (!c) return;
    const tempStr = state.isCelsius ? `${Math.round(c.tempC)}°` : `${WeatherData.toF(c.tempC)}°`;
    $('currentTemp').textContent = tempStr;
    $('currentDesc').textContent = `${c.icon}  ${c.label}`;
    $('currentDate').textContent = new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    $('curHumidity').textContent = `${c.humidity}%`;
    $('curWind').textContent     = `${c.wind} km/h`;
    $('curVis').textContent      = `${c.visibility} km`;
    $('curUV').textContent       = c.uvIndex;
  }

  // ── Render hourly strip ──
  function renderHourly() {
    const track = $('hourlyTrack');
    track.innerHTML = '';
    const todayHourly = WeatherData.getHourlyForDay(state.allHourly, 0);
    todayHourly.forEach(hr => {
      const tempStr = state.isCelsius ? `${Math.round(hr.tempC)}°` : `${WeatherData.toF(hr.tempC)}°`;
      const card = document.createElement('div');
      card.className = `hour-card${hr.isNow ? ' now' : ''}`;
      card.innerHTML = `
        <div class="hour-time">${hr.isNow ? 'NOW' : hr.label}</div>
        <div class="hour-icon">${hr.icon}</div>
        <div class="hour-temp">${tempStr}</div>
        <div class="hour-hum">💧 ${hr.humidity}%</div>`;
      track.appendChild(card);
    });
    const nowCard = track.querySelectorAll('.hour-card')[new Date().getHours()];
    if (nowCard) setTimeout(() => nowCard.scrollIntoView({ behavior:'smooth', block:'nearest', inline:'center' }), 100);
  }

  // ── Render week grid ──
  function renderWeekGrid() {
    const grid = $('weekGrid');
    grid.innerHTML = '';
    state.weekData.forEach((d, i) => {
      const hi = state.isCelsius ? `${Math.round(d.hiC)}°` : `${WeatherData.toF(d.hiC)}°`;
      const lo = state.isCelsius ? `${Math.round(d.loC)}°` : `${WeatherData.toF(d.loC)}°`;
      const card = document.createElement('div');
      card.className = `day-card${i === 0 ? ' today' : ''}`;
      card.innerHTML = `
        <div class="day-name">${i === 0 ? 'TODAY' : d.dayShort}</div>
        <div class="day-date">${d.dateLabel}</div>
        <div class="day-icon">${d.icon}</div>
        <div class="day-hi">${hi}</div>
        <div class="day-lo">${lo}</div>
        <div class="day-rain">🌧 ${d.rainChance}%</div>
        <div class="rain-bar"><div class="rain-fill" style="width:0%" data-width="${d.rainChance}%"></div></div>`;
      card.addEventListener('click', () => openDetail(i));
      grid.appendChild(card);
    });
    requestAnimationFrame(() => {
      document.querySelectorAll('.rain-fill').forEach(el => { el.style.width = el.dataset.width; });
    });
  }

  // ── Open detail panel ──
  function openDetail(dayIndex) {
    const d  = state.weekData[dayIndex];
    const hi = state.isCelsius ? `${Math.round(d.hiC)}°C` : `${WeatherData.toF(d.hiC)}°F`;
    const lo = state.isCelsius ? `${Math.round(d.loC)}°C` : `${WeatherData.toF(d.loC)}°F`;
    $('detailDayName').textContent = dayIndex === 0 ? 'TODAY' : d.dayName;
    $('detailDate').textContent    = `${d.dateLabel} · ${d.label} ${d.icon}`;
    $('detailHigh').textContent    = hi;
    $('detailLow').textContent     = lo;
    $('detailMetrics').innerHTML   = [
      { label:'HUMIDITY',    value:`${d.humidity}%`,    icon:'💧' },
      { label:'WIND',        value:`${d.wind} km/h`,    icon:'🌬' },
      { label:'RAIN CHANCE', value:`${d.rainChance}%`,  icon:'🌧' },
      { label:'UV INDEX',    value:d.uvIndex,            icon:'☀' },
      { label:'VISIBILITY',  value:`${d.visibility} km`,icon:'👁' },
      { label:'PRESSURE',    value:`${d.pressure} hPa`, icon:'📊' },
    ].map(m => `<div class="dm-card"><div class="dm-label">${m.icon} ${m.label}</div><div class="dm-value">${m.value}</div></div>`).join('');

    const dayHourly = WeatherData.getHourlyForDay(state.allHourly, dayIndex);
    Charts.drawDetailChart($('detailChart'), dayHourly, state.isCelsius);

    $('detailPanel').classList.add('open');
    $('overlay').classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeDetail() {
    $('detailPanel').classList.remove('open');
    $('overlay').classList.remove('active');
    document.body.style.overflow = '';
  }

  // ── Render week chart ──
  function renderWeekChart() {
    Charts.drawWeekChart($('weekChart'), state.weekData, state.currentChart, state.isCelsius);
  }

  // ── Render everything ──
  function renderAll() {
    renderCurrent();
    renderHourly();
    renderWeekGrid();
    renderWeekChart();
  }

  // ── Events ──
  function setupEvents() {
    // Unit toggle
    $('celsiusBtn').addEventListener('click', () => {
      if (!state.isCelsius) { state.isCelsius = true; $('celsiusBtn').classList.add('active'); $('fahrenheitBtn').classList.remove('active'); renderAll(); }
    });
    $('fahrenheitBtn').addEventListener('click', () => {
      if (state.isCelsius) { state.isCelsius = false; $('fahrenheitBtn').classList.add('active'); $('celsiusBtn').classList.remove('active'); renderAll(); }
    });

    // Search
    $('searchBtn').addEventListener('click', () => {
      const val = $('locInput').value.trim();
      if (val) loadCity(val);
    });
    $('locInput').addEventListener('keydown', e => {
      if (e.key === 'Enter') { const val = $('locInput').value.trim(); if (val) loadCity(val); }
    });

    // Chart tabs
    document.querySelectorAll('.chart-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.chart-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentChart = btn.dataset.chart;
        renderWeekChart();
      });
    });

    // Panel close
    $('detailClose').addEventListener('click', closeDetail);
    $('overlay').addEventListener('click', closeDetail);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDetail(); });

    // Resize
    window.addEventListener('resize', renderWeekChart);
  }

  // ── Boot ──
  function init() {
    setupEvents();
    loadCity(state.location);
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
