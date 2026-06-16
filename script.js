const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let w, h;

function resize() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

const colors = ['#00f0ff', '#1fffac', '#aaff00'];
const skyrmions = [];
const lightningBolts = [];

function createSkyrmion(x = Math.random() * 2 - 1, y = Math.random() * 2 - 1) {
  return {
    x,
    y,
    z: Math.random() * 0.8 + 0.2,
    pulse: Math.random() * Math.PI,
    color: colors[Math.floor(Math.random() * colors.length)],
    spinDirection: Math.random() < 0.5 ? 1 : -1,
    forceX: 0,
    forceY: 0,
  };
}

for (let i = 0; i < 150; i++) skyrmions.push(createSkyrmion());

let rotationAngle = 0;
let shiftX = 0, shiftY = 0;
let targetShiftX = 0, targetShiftY = 0;
let audioLevel = 0;

navigator.mediaDevices.getUserMedia({ audio: true, video: false })
  .then(stream => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const mic = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    mic.connect(analyser);
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    function analyze() {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
      audioLevel = sum / dataArray.length;
      requestAnimationFrame(analyze);
    }
    analyze();
  })
  .catch(err => console.error("Microphone access denied:", err));

setInterval(() => {
  if (audioLevel > 30) {
    targetShiftX = (Math.random() - 0.5) * 0.6;
    targetShiftY = (Math.random() - 0.5) * 0.6;

    skyrmions.forEach(s => {
      const dx = s.x;
      const dy = s.y;
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
      const strength = Math.min(audioLevel / 100, 1);
      s.forceX += (dx / dist) * strength * 0.02;
      s.forceY += (dy / dist) * strength * 0.02;
    });
  } else {
    targetShiftX = 0;
    targetShiftY = 0;
  }
}, 100);

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function drawNebula() {
  const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 1.5);
  grad.addColorStop(0, 'rgba(20,20,40,0.2)');
  grad.addColorStop(1, 'rgba(0,0,0,0.05)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function drawLightning(x1, y1, x2, y2) {
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  const steps = 10;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const dx = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 10;
    const dy = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 10;
    ctx.lineTo(dx, dy);
  }
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawMagneticField(x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.strokeStyle = `rgba(255, 255, 255, 0.05)`;
  ctx.lineWidth = 0.5;
  ctx.stroke();
}

function drawSkyrmion3D(s, index) {
  s.z -= 0.005;
  if (s.z <= 0.05) Object.assign(s, createSkyrmion());

  shiftX = lerp(shiftX, targetShiftX, 0.05);
  shiftY = lerp(shiftY, targetShiftY, 0.05);

  s.x += s.forceX;
  s.y += s.forceY;
  s.forceX *= 0.9;
  s.forceY *= 0.9;

  const cosA = Math.cos(rotationAngle);
  const sinA = Math.sin(rotationAngle);
  const shiftedX = s.x + shiftX;
  const shiftedY = s.y + shiftY;
  const rotatedX = shiftedX * cosA - shiftedY * sinA;
  const rotatedY = shiftedX * sinA + shiftedY * cosA;

  const scale = 1 / s.z;
  const screenX = w / 2 + rotatedX * w * 0.5 * scale;
  const screenY = h / 2 + rotatedY * h * 0.5 * scale;
  const radius = 5 * scale;

  drawMagneticField(screenX, screenY, radius * 5);

  const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, radius * 3);
  gradient.addColorStop(0, 'rgba(0, 255, 255, 0.4)');
  gradient.addColorStop(1, 'rgba(0, 0, 255, 0)');

  ctx.beginPath();
  ctx.arc(screenX, screenY, radius + Math.sin(s.pulse) * 2, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(screenX, screenY, radius * 2 + Math.sin(s.pulse * 2) * 3, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, ${Math.floor(audioLevel * 2)}, 100, 0.2)`;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  for (let a = 0; a < Math.PI * 2; a += 0.25) {
    const r = radius * 1.5 * (a / Math.PI);
    const x = screenX + Math.cos(a + s.pulse * s.spinDirection) * r;
    const y = screenY + Math.sin(a + s.pulse * s.spinDirection) * r;
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fillStyle = s.color;
    ctx.fill();
  }

  s.screenX = screenX;
  s.screenY = screenY;
}

function animate() {
  ctx.fillStyle = 'rgba(0, 0, 20, 0.1)';
  ctx.fillRect(0, 0, w, h);
  drawNebula();

  rotationAngle += 0.005;

  skyrmions.forEach((s, i) => {
    s.pulse += 0.010;
    drawSkyrmion3D(s, i);
  });

  if (audioLevel > 70 && Math.random() < 0.05) {
    const fx = Math.random() * w;
    const fy = Math.random() * h;
    for (let i = 0; i < 5; i++) {
      drawLightning(fx, fy, fx + Math.random() * 100 - 50, fy + Math.random() * 100 - 50);
    }
  }

  for (let i = 0; i < skyrmions.length; i++) {
    for (let j = i + 1; j < skyrmions.length; j++) {
      const a = skyrmions[i];
      const b = skyrmions[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 0.3) {
        a.x += dx * 0.0005;
        a.y += dy * 0.0005;
        b.x -= dx * 0.0005;
        b.y -= dy * 0.0005;
      }
    }
  }

  lightningBolts.length = 0;
  for (let i = 0; i < skyrmions.length; i++) {
    for (let j = i + 1; j < skyrmions.length; j++) {
      const a = skyrmions[i];
      const b = skyrmions[j];
      const dx = a.screenX - b.screenX;
      const dy = a.screenY - b.screenY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 30 && Math.random() < 0.02) {
        drawLightning(a.screenX, a.screenY, b.screenX, b.screenY);
      }
    }
  }

  requestAnimationFrame(animate);
}
animate();

canvas.addEventListener('click', (e) => {
  const normX = (e.clientX - w / 2) / (w * 0.5);
  const normY = (e.clientY - h / 2) / (h * 0.5);
  skyrmions.push(createSkyrmion(normX, normY));
});

const startBtn = document.getElementById('start-btn');
const audio = document.getElementById('odc-audio');

startBtn.addEventListener('click', async () => {
  try {
    await audio.play();
    startBtn.style.display = 'none';
  } catch (err) {
    console.error('Ошибка воспроизведения аудио:', err);
    alert('Не удалось воспроизвести аудио. Возможно, браузер блокирует автозапуск.');
  }
});
