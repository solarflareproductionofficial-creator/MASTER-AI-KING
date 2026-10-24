import { GameTemplate } from '../types';

export const GAME_TEMPLATES: GameTemplate[] = [
  {
    id: 'plat',
    badge: '2D Platformer',
    title: {
      tr: 'Platform Oyunu (Retro Runner)',
      en: '2D Retro Platformer',
      de: '2D Retro-Plattformer',
      es: 'Plataformas Retro 2D',
    },
    desc: {
      tr: 'Zıpla, altınları topla, platformlarda ilerle ve düşmeden kazan.',
      en: 'Jump, collect gold coins, traverse platforms and win.',
      de: 'Springe, sammle Goldmünzen, bewege dich auf Plattformen.',
      es: 'Salta, recolecta monedas de oro y avanza sin caer.',
    },
    code: `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Retro Platformer</title>
  <style>
    body {
      margin: 0;
      background: #0d0f17;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      color: #fff;
      font-family: system-ui, sans-serif;
      overflow: hidden;
      user-select: none;
    }
    canvas {
      background: #16192a;
      border: 2px solid #8f74ff;
      border-radius: 12px;
      max-width: 96vw;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .hud {
      margin-top: 10px;
      font-size: 14px;
      color: #9a9aa3;
    }
  </style>
</head>
<body>
  <canvas id="c" width="640" height="360"></canvas>
  <div class="hud">Controls: [A][D] or [Arrows] to Move, [Space] or [W] to Jump</div>
  <script>
    const c = document.getElementById("c");
    const x = c.getContext("2d");
    const K = {};

    window.addEventListener("keydown", (e) => {
      K[e.key.toLowerCase()] = true;
      if (e.key === " " || e.key.startsWith("Arrow")) e.preventDefault();
    });
    window.addEventListener("keyup", (e) => {
      K[e.key.toLowerCase()] = false;
    });

    const P = { x: 40, y: 200, w: 24, h: 30, vx: 0, vy: 0, onGround: false };
    const plats = [
      [0, 320, 640, 40],
      [110, 260, 100, 14],
      [250, 210, 110, 14],
      [400, 250, 90, 14],
      [520, 180, 100, 14],
      [310, 120, 90, 14],
      [140, 110, 80, 14]
    ];
    let coins = [
      [145, 230], [295, 180], [435, 220], [560, 150], [345, 90], [170, 80]
    ];
    let score = 0;
    const maxCoins = coins.length;

    function loop() {
      // Horizontal input
      const left = K.arrowleft || K.a ? 1 : 0;
      const right = K.arrowright || K.d ? 1 : 0;
      P.vx = (right - left) * 3.8;
      P.x += P.vx;

      // Vertical gravity & velocity
      P.vy += 0.55;
      P.y += P.vy;
      P.onGround = false;

      // Platform collisions
      plats.forEach(p => {
        if (
          P.x + P.w > p[0] &&
          P.x < p[0] + p[2] &&
          P.y + P.h >= p[1] &&
          P.y + P.h <= p[1] + p[3] + P.vy + 2 &&
          P.vy >= 0
        ) {
          P.y = p[1] - P.h;
          P.vy = 0;
          P.onGround = true;
        }
      });

      // Jump
      if ((K[" "] || K.arrowup || K.w) && P.onGround) {
        P.vy = -11.5;
      }

      // Boundaries & falling off
      if (P.x < 0) P.x = 0;
      if (P.x > 640 - P.w) P.x = 640 - P.w;
      if (P.y > 400) {
        P.x = 40;
        P.y = 200;
        P.vy = 0;
      }

      // Collect coins
      coins = coins.filter(q => {
        const hit = Math.hypot(P.x + P.w/2 - q[0], P.y + P.h/2 - q[1]) < 22;
        if (hit) score++;
        return !hit;
      });

      // Render
      x.clearRect(0, 0, 640, 360);

      // Background grid effect
      x.strokeStyle = "rgba(143, 116, 255, 0.07)";
      x.lineWidth = 1;
      for (let i = 0; i < 640; i += 32) {
        x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 360); x.stroke();
      }
      for (let j = 0; j < 360; j += 32) {
        x.beginPath(); x.moveTo(0, j); x.lineTo(640, j); x.stroke();
      }

      // Platforms
      plats.forEach(p => {
        x.fillStyle = "#2a2f4a";
        x.fillRect(p[0], p[1], p[2], p[3]);
        x.fillStyle = "#8f74ff";
        x.fillRect(p[0], p[1], p[2], 3);
      });

      // Coins
      coins.forEach(q => {
        x.beginPath();
        x.arc(q[0], q[1], 8, 0, Math.PI * 2);
        x.fillStyle = "#ffd54a";
        x.fill();
        x.strokeStyle = "#fff";
        x.lineWidth = 2;
        x.stroke();
      });

      // Player
      x.fillStyle = "#10e0a8";
      x.fillRect(P.x, P.y, P.w, P.h);
      // Cyber visor
      x.fillStyle = "#0d0f17";
      x.fillRect(P.x + (P.vx >= 0 ? 12 : 2), P.y + 6, 9, 7);
      x.fillStyle = "#fff";
      x.fillRect(P.x + (P.vx >= 0 ? 15 : 4), P.y + 8, 4, 3);

      // HUD text
      x.fillStyle = "#fff";
      x.font = "bold 16px system-ui";
      x.fillText("COINS: " + score + " / " + maxCoins, 16, 28);

      if (score === maxCoins) {
        x.fillStyle = "#10e0a8";
        x.font = "bold 26px system-ui";
        x.textAlign = "center";
        x.fillText("STAGE CLEAR! YOU WON!", 320, 170);
        x.textAlign = "left";
      }

      requestAnimationFrame(loop);
    }
    loop();
  </script>
</body>
</html>`,
  },
  {
    id: 'shoot',
    badge: 'Space Arcade',
    title: {
      tr: 'Uzay Savaşı (Space Arcade)',
      en: 'Space Starfighter Arcade',
      de: 'Weltraum-Shooter Arkade',
      es: 'Shooter Espacial Arcade',
    },
    desc: {
      tr: 'Hareketli yıldız haritası, otomatik lazer atışları ve uzaylı düşman dalgaları.',
      en: 'Dynamic starfield, auto-blasters, asteroid waves, and high score.',
      de: 'Dynamisches Sternenfeld, automatische Blaster und feindliche Wellen.',
      es: 'Campo estelar dinámico, láseres automáticos y oleadas enemigas.',
    },
    code: `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Space Shooter</title>
  <style>
    body {
      margin: 0;
      background: #07080f;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      color: #fff;
      font-family: system-ui, sans-serif;
      overflow: hidden;
      user-select: none;
    }
    canvas {
      background: #0b0d1a;
      border: 2px solid #10e0a8;
      border-radius: 12px;
      max-height: 90vh;
      max-width: 96vw;
      touch-action: none;
      box-shadow: 0 0 25px rgba(16, 224, 168, 0.2);
    }
  </style>
</head>
<body>
  <canvas id="c" width="480" height="560"></canvas>
  <script>
    const c = document.getElementById("c");
    const x = c.getContext("2d");
    const W = 480, H = 560;
    const K = {};

    let ship, bullets, enemies, particles, ticks, score, lives, gameOver, mouseX;

    function reset() {
      ship = { x: 240, y: 490 };
      bullets = [];
      enemies = [];
      particles = [];
      ticks = 0;
      score = 0;
      lives = 3;
      gameOver = false;
      mouseX = 240;
    }
    reset();

    function setX(cx) {
      const rect = c.getBoundingClientRect();
      mouseX = (cx - rect.left) * (W / rect.width);
    }

    c.addEventListener("mousemove", e => setX(e.clientX));
    c.addEventListener("touchmove", e => {
      e.preventDefault();
      setX(e.touches[0].clientX);
    }, { passive: false });
    c.addEventListener("click", () => { if (gameOver) reset(); });
    window.addEventListener("keydown", e => {
      K[e.key.toLowerCase()] = true;
      if (gameOver && e.key === " ") reset();
    });
    window.addEventListener("keyup", e => {
      K[e.key.toLowerCase()] = false;
    });

    const stars = Array.from({ length: 70 }, () => [
      Math.random() * W,
      Math.random() * H,
      Math.random() * 2.2 + 0.5
    ]);

    function loop() {
      if (K.arrowleft || K.a) mouseX -= 8;
      if (K.arrowright || K.d) mouseX += 8;
      mouseX = Math.max(24, Math.min(W - 24, mouseX));

      x.fillStyle = "#07080f";
      x.fillRect(0, 0, W, H);

      // Starfield
      x.fillStyle = "#fff";
      stars.forEach(s => {
        s[1] += s[2];
        if (s[1] > H) s[1] = 0;
        x.fillRect(s[0], s[1], s[2], s[2]);
      });

      if (!gameOver) {
        ticks++;
        ship.x += (mouseX - ship.x) * 0.22;

        // Auto-fire bullets
        if (ticks % 7 === 0) {
          bullets.push([ship.x - 7, ship.y - 14], [ship.x + 7, ship.y - 14]);
        }

        // Spawn enemies
        if (ticks % 34 === 0) {
          enemies.push([
            Math.random() * (W - 50) + 25,
            -20,
            1.6 + Math.random() * 1.5 + score / 600
          ]);
        }

        // Update bullets
        bullets.forEach(b => b[1] -= 10);
        bullets = bullets.filter(b => b[1] > -10);

        // Update enemies
        enemies.forEach(e => e[1] += e[2]);

        // Collision bullet vs enemy
        enemies = enemies.filter(en => {
          for (let i = 0; i < bullets.length; i++) {
            if (Math.hypot(bullets[i][0] - en[0], bullets[i][1] - en[1]) < 22) {
              bullets.splice(i, 1);
              score += 15;
              // Add particles
              for (let p = 0; p < 8; p++) {
                particles.push({
                  x: en[0],
                  y: en[1],
                  vx: (Math.random() - 0.5) * 6,
                  vy: (Math.random() - 0.5) * 6,
                  life: 20
                });
              }
              return false;
            }
          }
          if (Math.hypot(ship.x - en[0], ship.y - en[1]) < 28) {
            lives--;
            return false;
          }
          if (en[1] > H + 10) {
            lives--;
            return false;
          }
          return true;
        });

        if (lives <= 0) gameOver = true;
      }

      // Render particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        x.fillStyle = "#ff5c7a";
        x.fillRect(p.x, p.y, 3, 3);
      });
      particles = particles.filter(p => p.life > 0);

      // Render Ship
      x.fillStyle = "#10e0a8";
      x.beginPath();
      x.moveTo(ship.x, ship.y - 20);
      x.lineTo(ship.x + 18, ship.y + 14);
      x.lineTo(ship.x, ship.y + 8);
      x.lineTo(ship.x - 18, ship.y + 14);
      x.closePath();
      x.fill();

      // Bullets
      x.fillStyle = "#ffd54a";
      bullets.forEach(b => {
        x.fillRect(b[0] - 2, b[1], 4, 12);
      });

      // Enemies
      x.fillStyle = "#ff5c7a";
      enemies.forEach(en => {
        x.beginPath();
        x.arc(en[0], en[1], 14, 0, Math.PI * 2);
        x.fill();
        x.fillStyle = "#fff";
        x.fillRect(en[0] - 3, en[1] - 3, 6, 6);
        x.fillStyle = "#ff5c7a";
      });

      // HUD
      x.fillStyle = "#fff";
      x.font = "bold 16px system-ui";
      x.fillText("SCORE: " + score, 16, 28);
      x.fillText("LIVES: " + "❤️".repeat(Math.max(0, lives)), W - 140, 28);

      if (gameOver) {
        x.fillStyle = "rgba(0,0,0,0.75)";
        x.fillRect(0, 0, W, H);
        x.fillStyle = "#ff5c7a";
        x.font = "bold 32px system-ui";
        x.textAlign = "center";
        x.fillText("GAME OVER", W / 2, H / 2 - 20);
        x.fillStyle = "#fff";
        x.font = "18px system-ui";
        x.fillText("Final Score: " + score, W / 2, H / 2 + 15);
        x.fillStyle = "#10e0a8";
        x.fillText("Click or Press Space to Restart", W / 2, H / 2 + 50);
        x.textAlign = "left";
      }

      requestAnimationFrame(loop);
    }
    loop();
  </script>
</body>
</html>`,
  },
  {
    id: 'hor',
    badge: '3D Raycaster',
    title: {
      tr: 'Korku Koridoru (3D Raycaster)',
      en: 'Horror Corridor (3D Raycaster)',
      de: 'Horrorkorridor (3D-Raycaster)',
      es: 'Corredor del Terror (Raycaster 3D)',
    },
    desc: {
      tr: 'Titreyen el feneri ışığı, fare kilitli bakış açısı ve labirent koridorları.',
      en: 'Atmospheric Wolfenstein-style 3D dungeon with flashlight flicker and pointer lock.',
      de: 'Atmosphärischer 3D-Dungeon im Retro-Stil mit flackerndem Licht.',
      es: 'Mazmorra 3D estilo retro con linterna parpadeante y control de ratón.',
    },
    code: `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Horror Corridor</title>
  <style>
    body {
      margin: 0;
      background: #000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      color: #888;
      font-family: system-ui, sans-serif;
      font-size: 13px;
      overflow: hidden;
      user-select: none;
    }
    canvas {
      width: min(94vw, 840px);
      image-rendering: pixelated;
      background: #000;
      border: 1px solid #333;
      border-radius: 8px;
      cursor: crosshair;
    }
    .hint {
      margin-top: 10px;
      color: #666;
    }
  </style>
</head>
<body>
  <canvas id="c" width="320" height="200"></canvas>
  <div class="hint">Click canvas to lock mouse look. [W][A][S][D] / Arrows to walk.</div>
  <script>
    const map = [
      "################",
      "#..............#",
      "#.####..####...#",
      "#.#..........#.#",
      "#.#.######.#.#.#",
      "#...#....#.#...#",
      "###.#.##.#.###.#",
      "#...#.#..#.....#",
      "#.###.#.####.#.#",
      "#.....#......#.#",
      "################"
    ];

    const c = document.getElementById("c");
    const g = c.getContext("2d");
    const W = 320, H = 200;
    const K = {};

    let px = 1.5, py = 1.5, pa = 0, flicker = 1;

    window.addEventListener("keydown", e => {
      K[e.key.toLowerCase()] = true;
      if (e.key.startsWith("Arrow")) e.preventDefault();
    });
    window.addEventListener("keyup", e => {
      K[e.key.toLowerCase()] = false;
    });

    c.addEventListener("click", () => {
      if (c.requestPointerLock) c.requestPointerLock();
    });
    document.addEventListener("mousemove", e => {
      if (document.pointerLockElement === c) {
        pa += e.movementX * 0.0035;
      }
    });

    function isWall(x, y) {
      const row = map[Math.floor(y)];
      return !row || row.charAt(Math.floor(x)) !== ".";
    }

    function frame() {
      const speed = 0.045;
      if (K.arrowleft || K.q) pa -= 0.035;
      if (K.arrowright || K.e) pa += 0.035;

      const dx = Math.cos(pa), dy = Math.sin(pa);
      let mx = 0, my = 0;

      if (K.w || K.arrowup) { mx += dx * speed; my += dy * speed; }
      if (K.s || K.arrowdown) { mx -= dx * speed; my -= dy * speed; }
      if (K.a) { mx += dy * speed; my -= dx * speed; }
      if (K.d) { mx -= dy * speed; my += dx * speed; }

      if (!isWall(px + mx * 3, py)) px += mx;
      if (!isWall(px, py + my * 3)) py += my;

      // Flashlight flicker
      flicker = Math.random() < 0.03
        ? 0.3 + Math.random() * 0.4
        : Math.min(1, flicker + 0.06);

      // Floor & Ceiling
      g.fillStyle = "#040406";
      g.fillRect(0, 0, W, H / 2);
      g.fillStyle = "#0a090b";
      g.fillRect(0, H / 2, W, H / 2);

      // Raycasting
      for (let i = 0; i < W; i++) {
        const rayAngle = pa + (i / W - 0.5) * 1.05;
        const rx = Math.cos(rayAngle), ry = Math.sin(rayAngle);
        let dist = 0, hit = false;

        while (dist < 14 && !hit) {
          dist += 0.04;
          if (isWall(px + rx * dist, py + ry * dist)) hit = true;
        }

        const hx = px + rx * dist, hy = py + ry * dist;
        const u = Math.abs(hx - Math.round(hx)) < Math.abs(hy - Math.round(hy))
          ? hy - Math.floor(hy)
          : hx - Math.floor(hx);

        dist *= Math.cos(rayAngle - pa); // fish-eye correction
        if (dist < 0.05) dist = 0.05;

        const wallHeight = Math.min(H, (H / dist) * 0.9);
        const shade = Math.max(0, 1 - dist / 8.5) * flicker;
        const col = Math.floor(140 * shade);
        const colG = Math.floor(col * 0.75);
        const colB = Math.floor(col * 0.65);

        g.fillStyle = "rgb(" + col + "," + colG + "," + colB + ")";
        g.fillRect(i, (H - wallHeight) / 2, 1, wallHeight);
      }

      // Flashlight Vignette
      const grad = g.createRadialGradient(W/2, H/2, 20, W/2, H/2, W/2);
      grad.addColorStop(0, "rgba(255,240,200," + (0.05 * flicker) + ")");
      grad.addColorStop(1, "rgba(0,0,0,0.6)");
      g.fillStyle = grad;
      g.fillRect(0, 0, W, H);

      requestAnimationFrame(frame);
    }
    frame();
  </script>
</body>
</html>`,
  },
  {
    id: 'run',
    badge: 'Endless Runner',
    title: {
      tr: 'Sonsuz Koşu (Endless Runner)',
      en: 'Cyber Runner',
      de: 'Endloser Läufer',
      es: 'Corredor Infinito',
    },
    desc: {
      tr: 'Hızlanan engellerin üzerinden zıpla ve en yüksek skoru yakala.',
      en: 'Fast-paced cyber obstacle dodging with jumping physics.',
      de: 'Schnelles Cyber-Hindernis-Ausweichen mit Sprungphysik.',
      es: 'Esquiva obstáculos y salta a gran velocidad para superar el récord.',
    },
    code: `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Cyber Runner</title>
  <style>
    body {
      margin: 0;
      background: #0d0f17;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      color: #fff;
      font-family: system-ui, sans-serif;
      overflow: hidden;
      user-select: none;
    }
    canvas {
      background: #16192a;
      border: 2px solid #f59e0b;
      border-radius: 12px;
      max-width: 96vw;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
  </style>
</head>
<body>
  <canvas id="c" width="640" height="300"></canvas>
  <div style="margin-top:10px;color:#9a9aa3;font-size:14px">Press [Space], [Up Arrow], or Click to Jump</div>
  <script>
    const c = document.getElementById("c");
    const x = c.getContext("2d");

    let y, vy, obs, sp, sc, ticks, over;

    function reset() {
      y = 246;
      vy = 0;
      obs = [];
      sp = 5.2;
      sc = 0;
      ticks = 0;
      over = false;
    }
    reset();

    function jump() {
      if (over) { reset(); return; }
      if (y >= 246) vy = -12.5;
    }

    window.addEventListener("keydown", e => {
      if (e.key === " " || e.key === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    });
    c.addEventListener("mousedown", jump);
    c.addEventListener("touchstart", e => {
      e.preventDefault();
      jump();
    }, { passive: false });

    function loop() {
      x.clearRect(0, 0, 640, 300);

      if (!over) {
        ticks++;
        sc += 0.15;
        sp = 5.2 + sc / 50;
        vy += 0.68;
        y += vy;
        if (y > 246) {
          y = 246;
          vy = 0;
        }

        // Spawn obstacles
        if (ticks % Math.max(45, 90 - Math.floor(sc / 8)) === 0) {
          obs.push([660, 18 + Math.random() * 16, 28 + Math.random() * 32]);
        }

        obs.forEach(o => o[0] -= sp);
        obs = obs.filter(o => o[0] > -60);

        // Check collision
        obs.forEach(o => {
          if (60 < o[0] + o[1] && 60 + 26 > o[0] && y + 30 > 276 - o[2]) {
            over = true;
          }
        });
      }

      // Ground
      x.fillStyle = "#2a2f4a";
      x.fillRect(0, 276, 640, 24);
      x.fillStyle = "#f59e0b";
      x.fillRect(0, 276, 640, 3);

      // Obstacles
      x.fillStyle = "#ff5c7a";
      obs.forEach(o => {
        x.fillRect(o[0], 276 - o[2], o[1], o[2]);
        x.strokeStyle = "#fff";
        x.lineWidth = 1;
        x.strokeRect(o[0], 276 - o[2], o[1], o[2]);
      });

      // Player
      x.fillStyle = "#f59e0b";
      x.fillRect(60, y, 26, 30);
      x.fillStyle = "#fff";
      x.fillRect(74, y + 8, 6, 6);

      // Score
      x.fillStyle = "#fff";
      x.font = "bold 18px system-ui";
      x.fillText("SCORE: " + Math.floor(sc), 16, 28);

      if (over) {
        x.fillStyle = "rgba(0,0,0,0.7)";
        x.fillRect(0, 0, 640, 300);
        x.fillStyle = "#ff5c7a";
        x.font = "bold 30px system-ui";
        x.textAlign = "center";
        x.fillText("GAME OVER", 320, 130);
        x.fillStyle = "#fff";
        x.font = "16px system-ui";
        x.fillText("Final Score: " + Math.floor(sc), 320, 165);
        x.fillStyle = "#10e0a8";
        x.fillText("Press Space or Click to Retry", 320, 200);
        x.textAlign = "left";
      }

      requestAnimationFrame(loop);
    }
    loop();
  </script>
</body>
</html>`,
  },
  {
    id: 'mem',
    badge: 'Puzzle & Memory',
    title: {
      tr: 'Hafıza Eşleştirme (Memory Match)',
      en: 'Memory Match Cards',
      de: 'Gedächtnis-Karten',
      es: 'Memorama de Cartas',
    },
    desc: {
      tr: 'Bütün kart çiftlerini en az hamle ile bul ve oyunu tamamla.',
      en: 'Find matching symbol pairs in the fewest moves possible.',
      de: 'Finde passende Symbolpaare in möglichst wenigen Zügen.',
      es: 'Encuentra todas las parejas en el menor número de movimientos.',
    },
    code: `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Memory Match</title>
  <style>
    body {
      margin: 0;
      background: #0d0f17;
      color: #fff;
      font-family: system-ui, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      gap: 16px;
      user-select: none;
    }
    #g {
      display: grid;
      grid-template-columns: repeat(4, 76px);
      gap: 10px;
    }
    .card {
      height: 76px;
      font-size: 28px;
      border: 0;
      border-radius: 14px;
      background: #2a2f4a;
      color: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s, background 0.2s;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    .card:hover { transform: scale(1.05); }
    .card.up { background: #8f74ff; }
    .card.ok { background: #10a37f; cursor: default; }
    #m { font-size: 18px; font-weight: 600; color: #10e0a8; }
  </style>
</head>
<body>
  <div id="m">Moves: 0</div>
  <div id="g"></div>
  <script>
    const symbols = ["🎮", "👾", "🚀", "⚡", "💎", "🔥", "🛡️", "🔮"];
    let deck = symbols.concat(symbols).sort(() => Math.random() - 0.5);
    let openCards = [];
    let matches = 0;
    let moves = 0;

    const g = document.getElementById("g");
    const m = document.getElementById("m");

    deck.forEach(symbol => {
      const b = document.createElement("button");
      b.className = "card";
      b.onclick = () => {
        if (openCards.length > 1 || b.classList.contains("up") || b.classList.contains("ok")) return;
        b.classList.add("up");
        b.textContent = symbol;
        openCards.push({ btn: b, symbol });

        if (openCards.length === 2) {
          moves++;
          m.textContent = "Moves: " + moves;
          const [a, bCard] = openCards;

          if (a.symbol === bCard.symbol) {
            a.btn.classList.add("ok");
            bCard.btn.classList.add("ok");
            openCards = [];
            matches++;
            if (matches === 8) {
              m.textContent = "🏆 Victory! Completed in " + moves + " moves!";
            }
          } else {
            setTimeout(() => {
              a.btn.classList.remove("up");
              bCard.btn.classList.remove("up");
              a.btn.textContent = "";
              bCard.btn.textContent = "";
              openCards = [];
            }, 650);
          }
        }
      };
      g.appendChild(b);
    });
  </script>
</body>
</html>`,
  },
];
