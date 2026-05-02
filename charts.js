//  charts.js — Canvas chart renderers


const Charts = (() => {

  const COLORS = {
    accent: '#00e5b0',
    accent2: '#ff6b35',
    accent3: '#7b61ff',
    muted: '#3d4a58',
    text: '#6b7a8d',
    grid: '#1a2030',
  };

  /* ── Smooth curve helper ── */
  function smoothCurve(ctx, pts) {
    if (pts.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 0; i < pts.length - 1; i++) {
      const cp1x = pts[i].x + (pts[i+1].x - pts[i].x) / 3;
      const cp1y = pts[i].y;
      const cp2x = pts[i+1].x - (pts[i+1].x - pts[i].x) / 3;
      const cp2y = pts[i+1].y;
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, pts[i+1].x, pts[i+1].y);
    }
  }

  /* ── Weekly line chart ── */
  function drawWeekChart(canvas, weekData, metric, isCelsius) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const pad = { top: 30, right: 30, bottom: 50, left: 55 };
    ctx.clearRect(0, 0, W, H);

    // Extract series
    let values, color, label, unit;
    if (metric === 'temp') {
      values = weekData.map(d => isCelsius ? d.hiC : WeatherData.toF(d.hiC));
      color = COLORS.accent2;
      label = 'High Temperature';
      unit = isCelsius ? '°C' : '°F';
    } else if (metric === 'humidity') {
      values = weekData.map(d => d.humidity);
      color = COLORS.accent;
      label = 'Humidity';
      unit = '%';
    } else {
      values = weekData.map(d => d.rainChance);
      color = COLORS.accent3;
      label = 'Precipitation Chance';
      unit = '%';
    }

    const minV = Math.min(...values) - 5;
    const maxV = Math.max(...values) + 5;
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;

    const mapX = i => pad.left + (i / (values.length - 1)) * chartW;
    const mapY = v => pad.top + chartH - ((v - minV) / (maxV - minV)) * chartH;

    // Grid lines
    const gridCount = 5;
    for (let i = 0; i <= gridCount; i++) {
      const y = pad.top + (i / gridCount) * chartH;
      const v = maxV - (i / gridCount) * (maxV - minV);
      ctx.strokeStyle = COLORS.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(W - pad.right, y);
      ctx.stroke();
      ctx.fillStyle = COLORS.text;
      ctx.font = '11px Space Mono, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(v) + unit, pad.left - 8, y + 4);
    }

    // X labels
    weekData.forEach((d, i) => {
      ctx.fillStyle = COLORS.text;
      ctx.font = '10px Space Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(d.dayShort, mapX(i), H - 8);
      ctx.fillText(d.dateLabel, mapX(i), H - 22);
    });

    // Fill under curve
    const pts = values.map((v, i) => ({ x: mapX(i), y: mapY(v) }));
    const grad = ctx.createLinearGradient(0, pad.top, 0, H - pad.bottom);
    const hex = color.replace('#','');
    const r = parseInt(hex.slice(0,2),16), g = parseInt(hex.slice(2,4),16), b = parseInt(hex.slice(4,6),16);
    grad.addColorStop(0, `rgba(${r},${g},${b},0.25)`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);

    ctx.save();
    smoothCurve(ctx, pts);
    ctx.lineTo(pts[pts.length-1].x, H - pad.bottom);
    ctx.lineTo(pts[0].x, H - pad.bottom);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();

    // Stroke
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    smoothCurve(ctx, pts);
    ctx.stroke();

    // Dots + labels
    pts.forEach((pt, i) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.grid;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#e8edf5';
      ctx.font = 'bold 11px Syne, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(Math.round(values[i]) + unit, pt.x, pt.y - 12);
    });
  }

  /* ── Detail day chart: dual axis (temp + humidity) ── */
  function drawDetailChart(canvas, hourlyData, isCelsius) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const pad = { top: 24, right: 16, bottom: 28, left: 44 };
    ctx.clearRect(0, 0, W, H);

    const hours = hourlyData.filter((_, i) => i % 2 === 0); // Every 2h
    const temps = hours.map(h => isCelsius ? h.tempC : WeatherData.toF(h.tempC));
    const hums  = hours.map(h => h.humidity);

    const minT = Math.min(...temps) - 2, maxT = Math.max(...temps) + 2;
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;

    const mapX = i => pad.left + (i / (hours.length - 1)) * chartW;
    const mapYT = v => pad.top + chartH - ((v - minT) / (maxT - minT)) * chartH;
    const mapYH = v => pad.top + chartH - (v / 100) * chartH;

    // Grid
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (i / 4) * chartH;
      ctx.strokeStyle = COLORS.grid;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
    }

    // Humidity bars (subtle)
    hours.forEach((hr, i) => {
      const x = mapX(i);
      const barH = (hr.humidity / 100) * chartH;
      ctx.fillStyle = 'rgba(123,97,255,0.12)';
      ctx.fillRect(x - 6, pad.top + chartH - barH, 12, barH);
    });

    // Temp line
    const tPts = temps.map((v, i) => ({ x: mapX(i), y: mapYT(v) }));
    ctx.strokeStyle = COLORS.accent2;
    ctx.lineWidth = 2;
    smoothCurve(ctx, tPts);
    ctx.stroke();

    // Dots
    tPts.forEach((pt, i) => {
      if (hours[i].isNow) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.accent2;
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.grid;
        ctx.fill();
        ctx.strokeStyle = COLORS.accent2;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });

    // X labels
    hours.forEach((hr, i) => {
      ctx.fillStyle = COLORS.text;
      ctx.font = '9px Space Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(hr.label, mapX(i), H - 4);
    });

    // Y axis labels
    ctx.fillStyle = COLORS.accent2;
    ctx.font = '9px Space Mono, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(Math.round(maxT) + (isCelsius ? '°C' : '°F'), pad.left - 4, pad.top + 4);
    ctx.fillText(Math.round(minT) + (isCelsius ? '°C' : '°F'), pad.left - 4, pad.top + chartH);

    // Legend
    ctx.fillStyle = COLORS.accent2;
    ctx.fillRect(pad.left, H - 14, 10, 3);
    ctx.fillStyle = COLORS.text;
    ctx.font = '9px Space Mono, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Temp', pad.left + 14, H - 10);
    ctx.fillStyle = 'rgba(123,97,255,0.5)';
    ctx.fillRect(pad.left + 70, H - 14, 10, 8);
    ctx.fillStyle = COLORS.text;
    ctx.fillText('Humidity', pad.left + 84, H - 10);
  }

  /* ── Animated weather canvas (hero art) ── */
  function drawWeatherArt(canvas, condition, isDaytime) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W/2, cy = H/2;
    let frame = 0;

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // Background gradient
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.6);
      if (condition === 'sunny') {
        bg.addColorStop(0, 'rgba(255,200,0,0.12)');
        bg.addColorStop(1, 'rgba(255,100,0,0.02)');
      } else if (condition.includes('rain') || condition === 'drizzle') {
        bg.addColorStop(0, 'rgba(123,97,255,0.12)');
        bg.addColorStop(1, 'rgba(50,50,120,0.02)');
      } else {
        bg.addColorStop(0, 'rgba(0,229,176,0.07)');
        bg.addColorStop(1, 'rgba(0,0,0,0)');
      }
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.arc(cx, cy, W*0.5, 0, Math.PI*2); ctx.fill();

      if (condition === 'sunny') {
        // Pulsing sun
        const pulse = Math.sin(frame * 0.04) * 8;
        // Rays
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2 + frame * 0.008;
          ctx.strokeStyle = `rgba(255,200,0,${0.3 + Math.sin(frame*0.05 + i)*0.15})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(angle)*(80+pulse), cy + Math.sin(angle)*(80+pulse));
          ctx.lineTo(cx + Math.cos(angle)*(110+pulse), cy + Math.sin(angle)*(110+pulse));
          ctx.stroke();
        }
        const sg = ctx.createRadialGradient(cx,cy,0,cx,cy,70+pulse);
        sg.addColorStop(0,'rgba(255,220,60,0.95)'); sg.addColorStop(1,'rgba(255,140,0,0.3)');
        ctx.beginPath(); ctx.arc(cx,cy,70+pulse,0,Math.PI*2);
        ctx.fillStyle = sg; ctx.fill();

      } else if (condition === 'partly_cloudy') {
        // Sun partially behind cloud
        const pulse = Math.sin(frame * 0.03) * 5;
        const sg = ctx.createRadialGradient(cx-30,cy-20,0,cx-30,cy-20,55);
        sg.addColorStop(0,'rgba(255,220,60,0.85)'); sg.addColorStop(1,'rgba(255,140,0,0.1)');
        ctx.beginPath(); ctx.arc(cx-30,cy-20,55+pulse,0,Math.PI*2);
        ctx.fillStyle = sg; ctx.fill();
        drawCloud(ctx, cx+20, cy+10, 90, 0.9, frame);

      } else if (condition === 'cloudy') {
        drawCloud(ctx, cx-40, cy-20, 80, 0.7, frame);
        drawCloud(ctx, cx+20, cy+15, 100, 0.85, frame * 0.7);

      } else if (condition === 'rain' || condition === 'heavy_rain' || condition === 'drizzle') {
        drawCloud(ctx, cx, cy-40, 110, 0.9, frame);
        const drops = condition === 'heavy_rain' ? 18 : condition === 'drizzle' ? 6 : 12;
        for (let i = 0; i < drops; i++) {
          const progress = ((frame * (0.5 + i * 0.03) + i * 30) % 120) / 120;
          const dx = cx - 80 + i * (160 / drops);
          const dy = cy - 10 + progress * 120;
          const alpha = progress < 0.8 ? 0.7 : (1 - progress) * 3.5;
          ctx.strokeStyle = `rgba(123,161,255,${alpha})`;
          ctx.lineWidth = condition === 'drizzle' ? 1 : 1.5;
          ctx.beginPath();
          ctx.moveTo(dx, dy);
          ctx.lineTo(dx - 3, dy + 14);
          ctx.stroke();
        }
      } else if (condition === 'thunderstorm') {
        drawCloud(ctx, cx, cy-40, 120, 0.95, frame);
        // Lightning flash
        if (Math.sin(frame * 0.05) > 0.95) {
          ctx.fillStyle = 'rgba(255,255,100,0.4)';
          ctx.beginPath(); ctx.arc(cx,cy,W*0.5,0,Math.PI*2); ctx.fill();
        }
        ctx.strokeStyle = 'rgba(255,255,100,0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx,cy-20); ctx.lineTo(cx-12,cy+12);
        ctx.lineTo(cx+4,cy+12); ctx.lineTo(cx-10,cy+45);
        ctx.stroke();
      } else if (condition === 'haze') {
        for (let i = 0; i < 5; i++) {
          const y = cy - 40 + i * 22 + Math.sin(frame*0.02 + i) * 6;
          const alpha = 0.15 + Math.sin(frame*0.025 + i)*0.05;
          ctx.strokeStyle = `rgba(200,180,160,${alpha})`;
          ctx.lineWidth = 20;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(cx - 100, y); ctx.lineTo(cx + 100, y);
          ctx.stroke();
        }
      }

      frame++;
      requestAnimationFrame(draw);
    }

    function drawCloud(ctx, x, y, size, alpha, f) {
      const s = size / 100;
      const wobble = Math.sin(f * 0.02) * 3;
      ctx.fillStyle = `rgba(200,210,230,${alpha})`;
      ctx.beginPath();
      ctx.arc(x + wobble, y, 30*s, 0, Math.PI*2);
      ctx.arc(x - 32*s + wobble, y+8*s, 22*s, 0, Math.PI*2);
      ctx.arc(x + 32*s + wobble, y+10*s, 20*s, 0, Math.PI*2);
      ctx.arc(x + 10*s + wobble, y+15*s, 26*s, 0, Math.PI*2);
      ctx.arc(x - 10*s + wobble, y+16*s, 24*s, 0, Math.PI*2);
      ctx.fill();
    }

    draw();
  }

  return { drawWeekChart, drawDetailChart, drawWeatherArt };
})();
