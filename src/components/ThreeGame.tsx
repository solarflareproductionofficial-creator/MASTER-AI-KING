import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { X, Play, RotateCcw, Volume2, VolumeX, Shield, Zap, Trophy, Flame, ChevronRight, Crosshair } from 'lucide-react';
import { Language } from '../types';

interface ThreeGameProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

type GameState = 'title' | 'playing' | 'paused' | 'gameover' | 'victory';

export const ThreeGame: React.FC<ThreeGameProps> = ({ isOpen, onClose, lang }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<GameState>('title');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('masterai_game_highscore') || '0', 10);
    } catch {
      return 0;
    }
  });
  const [shield, setShield] = useState<number>(100);
  const [speed, setSpeed] = useState<number>(1);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Audio Context ref for procedural sound effects
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Mutable Game Loop State
  const gameRef = useRef({
    playerX: 0,
    targetX: 0,
    playerSpeed: 0,
    lasers: [] as { mesh: THREE.Mesh; z: number }[],
    hazards: [] as { mesh: THREE.Mesh; x: number; y: number; z: number; rotSpeed: number; active: boolean }[],
    pickups: [] as { mesh: THREE.Mesh; x: number; y: number; z: number; active: boolean }[],
    score: 0,
    shield: 100,
    state: 'title' as GameState,
    keys: { left: false, right: false, fire: false, boost: false },
    lastShotTime: 0,
    tunnelSegments: [] as THREE.LineSegments[],
  });

  const t = {
    tr: {
      title: 'CYBER HYPERDRIVE 3D',
      sub: 'Kuantum Işık Hızı Koşucusu',
      startBtn: 'OYUNA BAŞLA',
      restartBtn: 'YENİDEN DENE',
      resumeBtn: 'DEVAM ET',
      score: 'SKOR',
      highScore: 'EN YÜKSEK',
      shield: 'KALKAN',
      speed: 'HIZ',
      controlsHint: 'A / D veya Ok Tuşları: Yönlendir | BOŞLUK: Lazer Ateşle',
      gameOver: 'GÖREV BAŞARISIZ',
      victory: 'KUANTUM ÇIKIŞINA ULAŞILDI!',
      exit: 'Oyundan Çık (Esc)',
    },
    en: {
      title: 'CYBER HYPERDRIVE 3D',
      sub: 'Quantum Warp Speed Runner',
      startBtn: 'START MISSION',
      restartBtn: 'RETRY RUN',
      resumeBtn: 'RESUME',
      score: 'SCORE',
      highScore: 'BEST',
      shield: 'SHIELD',
      speed: 'SPEED',
      controlsHint: 'A / D or Arrow Keys: Steer | SPACE: Fire Lasers',
      gameOver: 'MISSION TERMINATED',
      victory: 'QUANTUM GATE REACHED!',
      exit: 'Exit Game (Esc)',
    },
    de: {
      title: 'CYBER HYPERDRIVE 3D',
      sub: 'Quanten-Lichtgeschwindigkeits-Läufer',
      startBtn: 'MISSION STARTEN',
      restartBtn: 'ERNEUT VERSUCHEN',
      resumeBtn: 'FORTSETZEN',
      score: 'PUNKTE',
      highScore: 'BESTE',
      shield: 'SCHILD',
      speed: 'TEMPO',
      controlsHint: 'A / D oder Pfeiltasten: Steuern | LEERTASTE: Laser feuern',
      gameOver: 'MISSION ABGEBROCHEN',
      victory: 'QUANTENTOR ERREICHT!',
      exit: 'Beenden (Esc)',
    },
    es: {
      title: 'CYBER HYPERDRIVE 3D',
      sub: 'Corredor Hiperimpulso Cuántico',
      startBtn: 'INICIAR MISIÓN',
      restartBtn: 'REINTENTAR',
      resumeBtn: 'CONTINUAR',
      score: 'PUNTOS',
      highScore: 'RÉCORD',
      shield: 'ESCUDO',
      speed: 'VELOCIDAD',
      controlsHint: 'A / D o Flechas: Dirigir | ESPACIO: Disparar Láser',
      gameOver: 'MISIÓN FALLIDA',
      victory: '¡PORTAL CUÁNTICO ALCANZADO!',
      exit: 'Salir (Esc)',
    },
  }[lang] || {
    title: 'CYBER HYPERDRIVE 3D',
    sub: 'Quantum Warp Speed Runner',
    startBtn: 'START MISSION',
    restartBtn: 'RETRY RUN',
    resumeBtn: 'RESUME',
    score: 'SCORE',
    highScore: 'BEST',
    shield: 'SHIELD',
    speed: 'SPEED',
    controlsHint: 'A / D or Arrow Keys: Steer | SPACE: Fire Lasers',
    gameOver: 'MISSION TERMINATED',
    victory: 'QUANTUM GATE REACHED!',
    exit: 'Exit Game (Esc)',
  };

  // Sound Engine (Web Audio API Synthesizer - Zero 404 dependencies)
  const playSynthSound = (type: 'laser' | 'hit' | 'pickup' | 'gameover') => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;

      if (type === 'laser') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.13);
      } else if (type === 'pickup') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.29);
      } else if (type === 'hit') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.21);
      } else if (type === 'gameover') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.6);
        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.61);
      }
    } catch {
      // Audio autoplay policy catch
    }
  };

  // Keyboard controls listener
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') gameRef.current.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') gameRef.current.keys.right = true;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') gameRef.current.keys.boost = true;
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        gameRef.current.keys.fire = true;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') gameRef.current.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') gameRef.current.keys.right = false;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') gameRef.current.keys.boost = false;
      if (e.key === ' ' || e.code === 'Space') gameRef.current.keys.fire = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [isOpen, onClose]);

  // Start new run
  const handleStartGame = () => {
    gameRef.current.score = 0;
    gameRef.current.shield = 100;
    gameRef.current.playerX = 0;
    gameRef.current.targetX = 0;
    gameRef.current.state = 'playing';
    setScore(0);
    setShield(100);
    setSpeed(1);
    setGameState('playing');
  };

  // Three.js Game Engine Initialization
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const mount = containerRef.current;
    const width = mount.clientWidth || window.innerWidth;
    const height = mount.clientHeight || window.innerHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    mount.appendChild(renderer.domElement);

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06070d);
    scene.fog = new THREE.FogExp2(0x06070d, 0.025);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 150);
    camera.position.set(0, 3.2, 6.8);
    camera.lookAt(0, 1.2, -10);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x223344, 1.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00f5d4, 2.5);
    dirLight.position.set(0, 10, -5);
    scene.add(dirLight);

    // Build Composite Hero Spaceship (6 distinct procedural parts)
    const ship = new THREE.Group();

    // 1. Fuselage
    const fuseGeo = new THREE.ConeGeometry(0.55, 2.2, 5);
    const fuseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.2 });
    const fuselage = new THREE.Mesh(fuseGeo, fuseMat);
    fuselage.rotation.x = Math.PI / 2;
    ship.add(fuselage);

    // 2. Cockpit Canopy (Glowing cyan visor)
    const canopyGeo = new THREE.SphereGeometry(0.24, 16, 16);
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      metalness: 0.2,
      roughness: 0.1,
    });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.set(0, 0.22, -0.2);
    canopy.scale.set(1, 0.6, 2.2);
    ship.add(canopy);

    // 3. Left Delta Wing
    const wingGeo = new THREE.BoxGeometry(1.6, 0.05, 1.1);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.3 });
    const leftWing = new THREE.Mesh(wingGeo, wingMat);
    leftWing.position.set(-0.95, -0.05, 0.3);
    leftWing.rotation.y = -0.3;
    leftWing.rotation.z = -0.08;
    ship.add(leftWing);

    // 4. Right Delta Wing
    const rightWing = new THREE.Mesh(wingGeo, wingMat);
    rightWing.position.set(0.95, -0.05, 0.3);
    rightWing.rotation.y = 0.3;
    rightWing.rotation.z = 0.08;
    ship.add(rightWing);

    // 5. Left Plasma Thruster Engine
    const engineGeo = new THREE.CylinderGeometry(0.14, 0.18, 0.8, 12);
    const engineMat = new THREE.MeshStandardMaterial({
      color: 0x00f5d4,
      emissive: 0x00f5d4,
      emissiveIntensity: 2.0,
    });
    const leftEngine = new THREE.Mesh(engineGeo, engineMat);
    leftEngine.rotation.x = Math.PI / 2;
    leftEngine.position.set(-0.4, 0, 1.0);
    ship.add(leftEngine);

    // 6. Right Plasma Thruster Engine
    const rightEngine = new THREE.Mesh(engineGeo, engineMat);
    rightEngine.rotation.x = Math.PI / 2;
    rightEngine.position.set(0.4, 0, 1.0);
    ship.add(rightEngine);

    ship.position.set(0, 0.8, 0);
    scene.add(ship);

    // Infinite Hyper Tunnel / Grid Rings
    const tunnelGroup = new THREE.Group();
    for (let i = 0; i < 35; i++) {
      const ringGeo = new THREE.RingGeometry(4.2, 4.3, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x10a37f : 0x1e293b,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.45,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.z = -i * 3.5;
      tunnelGroup.add(ring);
    }
    scene.add(tunnelGroup);

    // Speed particles (Starfield effect)
    const starCount = 350;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 24;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 16 + 2;
      starPositions[i * 3 + 2] = -Math.random() * 80;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.15, transparent: true, opacity: 0.7 });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // Hazards (Obstacles)
    const hazardGroup = new THREE.Group();
    scene.add(hazardGroup);

    const hazards: { mesh: THREE.Mesh; x: number; y: number; z: number; rotSpeed: number; active: boolean }[] = [];
    for (let i = 0; i < 12; i++) {
      const hGeo = new THREE.DodecahedronGeometry(0.75, 0);
      const hMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0x991b1b,
        roughness: 0.4,
        metalness: 0.8,
      });
      const hMesh = new THREE.Mesh(hGeo, hMat);
      const z = -20 - i * 14;
      const x = (Math.random() - 0.5) * 6;
      hMesh.position.set(x, 0.8, z);
      hazardGroup.add(hMesh);
      hazards.push({ mesh: hMesh, x, y: 0.8, z, rotSpeed: (Math.random() - 0.5) * 3, active: true });
    }
    gameRef.current.hazards = hazards;

    // Pickups (Energy Cores)
    const pickupGroup = new THREE.Group();
    scene.add(pickupGroup);

    const pickups: { mesh: THREE.Mesh; x: number; y: number; z: number; active: boolean }[] = [];
    for (let i = 0; i < 10; i++) {
      const pGeo = new THREE.OctahedronGeometry(0.45, 0);
      const pMat = new THREE.MeshStandardMaterial({
        color: 0x00f5d4,
        emissive: 0x00f5d4,
        emissiveIntensity: 1.5,
        wireframe: false,
      });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      const z = -15 - i * 16;
      const x = (Math.random() - 0.5) * 5.5;
      pMesh.position.set(x, 0.8, z);
      pickupGroup.add(pMesh);
      pickups.push({ mesh: pMesh, x, y: 0.8, z, active: true });
    }
    gameRef.current.pickups = pickups;

    // Lasers Group
    const laserGroup = new THREE.Group();
    scene.add(laserGroup);

    // Main 60fps Animation Loop
    let animationFrameId = 0;
    const clock = new THREE.Clock();

    const tick = () => {
      const delta = Math.min(clock.getDelta(), 0.08);
      const g = gameRef.current;

      // Handle Inputs
      if (g.state === 'playing') {
        const moveSpeed = 8.5;
        if (g.keys.left) g.targetX = Math.max(-3.5, g.targetX - moveSpeed * delta);
        if (g.keys.right) g.targetX = Math.min(3.5, g.targetX + moveSpeed * delta);

        // Fire Laser Blasters
        if (g.keys.fire && clock.getElapsedTime() - g.lastShotTime > 0.22) {
          g.lastShotTime = clock.getElapsedTime();
          playSynthSound('laser');

          // Dual lasers from wing tips
          for (const sign of [-1, 1]) {
            const lGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.9, 8);
            const lMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
            const laser = new THREE.Mesh(lGeo, lMat);
            laser.rotation.x = Math.PI / 2;
            laser.position.set(ship.position.x + sign * 0.95, 0.75, ship.position.z - 0.8);
            laserGroup.add(laser);
            g.lasers.push({ mesh: laser, z: laser.position.z });
          }
        }
      }

      // Smooth ship kinematics
      g.playerX = THREE.MathUtils.damp(g.playerX, g.targetX, 9, delta);
      ship.position.x = g.playerX;
      // Banking roll angle
      const rollTarget = -(g.targetX - g.playerX) * 0.45;
      ship.rotation.z = THREE.MathUtils.damp(ship.rotation.z, rollTarget, 8, delta);

      // Camera follow with subtle lag
      camera.position.x = THREE.MathUtils.damp(camera.position.x, g.playerX * 0.4, 5, delta);

      // Advance warp speed when playing
      const currentSpeed = g.state === 'playing' ? 24 + g.score * 0.015 : 6;
      setSpeed(Math.round(currentSpeed));

      // Move Tunnel Rings
      for (const ring of tunnelGroup.children) {
        ring.position.z += currentSpeed * delta;
        if (ring.position.z > 5) ring.position.z -= 35 * 3.5;
      }

      // Move Starfield
      const posAttr = starGeo.attributes.position as THREE.BufferAttribute;
      const positions = posAttr.array as Float32Array;
      for (let i = 0; i < starCount; i++) {
        positions[i * 3 + 2] += currentSpeed * 1.5 * delta;
        if (positions[i * 3 + 2] > 5) positions[i * 3 + 2] = -80;
      }
      posAttr.needsUpdate = true;

      // Update Lasers
      for (let i = g.lasers.length - 1; i >= 0; i--) {
        const l = g.lasers[i];
        l.mesh.position.z -= 45 * delta;
        l.z = l.mesh.position.z;

        // Check laser collision with hazards
        for (const h of g.hazards) {
          if (h.active && Math.abs(h.mesh.position.z - l.z) < 1.0 && Math.abs(h.mesh.position.x - l.mesh.position.x) < 0.9) {
            h.active = false;
            h.mesh.visible = false;
            playSynthSound('hit');
            g.score += 50;
            setScore(g.score);
            break;
          }
        }

        if (l.z < -65) {
          laserGroup.remove(l.mesh);
          l.mesh.geometry.dispose();
          g.lasers.splice(i, 1);
        }
      }

      // Move Hazards
      for (const h of g.hazards) {
        h.mesh.position.z += currentSpeed * delta;
        h.mesh.rotation.x += h.rotSpeed * delta;
        h.mesh.rotation.y += h.rotSpeed * delta;

        // Player Collision Detection
        if (g.state === 'playing' && h.active && Math.abs(h.mesh.position.z - ship.position.z) < 1.1) {
          if (Math.abs(h.mesh.position.x - ship.position.x) < 1.1) {
            h.active = false;
            h.mesh.visible = false;
            g.shield -= 25;
            setShield(Math.max(0, g.shield));
            playSynthSound('hit');

            if (g.shield <= 0) {
              g.state = 'gameover';
              setGameState('gameover');
              playSynthSound('gameover');
              // Record High Score
              if (g.score > highScore) {
                setHighScore(g.score);
                try {
                  localStorage.setItem('masterai_game_highscore', g.score.toString());
                } catch {}
              }
            }
          }
        }

        // Recycle hazard
        if (h.mesh.position.z > 5) {
          h.mesh.position.z = -140 - Math.random() * 20;
          h.mesh.position.x = (Math.random() - 0.5) * 6;
          h.active = true;
          h.mesh.visible = true;
        }
      }

      // Move Collectible Quantum Cores
      for (const p of g.pickups) {
        p.mesh.position.z += currentSpeed * delta;
        p.mesh.rotation.y += 3.5 * delta;

        // Player Core Pickup
        if (g.state === 'playing' && p.active && Math.abs(p.mesh.position.z - ship.position.z) < 1.2) {
          if (Math.abs(p.mesh.position.x - ship.position.x) < 1.2) {
            p.active = false;
            p.mesh.visible = false;
            g.score += 100;
            g.shield = Math.min(100, g.shield + 10);
            setScore(g.score);
            setShield(g.shield);
            playSynthSound('pickup');
          }
        }

        // Recycle pickup
        if (p.mesh.position.z > 5) {
          p.mesh.position.z = -130 - Math.random() * 25;
          p.mesh.position.x = (Math.random() - 0.5) * 5.5;
          p.active = true;
          p.mesh.visible = true;
        }
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    const onResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#06070d] text-white overflow-hidden select-none flex flex-col font-sans">
      {/* 3D Game Playfield (Unobstructed Viewport >= 85%) */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* Top HUD: Unobstructed edge-docked scores & status */}
      <div className="relative z-20 flex items-center justify-between p-4 pointer-events-none">
        {/* Left: Shield Health & Speed */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 shadow-lg">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] text-white/60 font-bold">{t.shield}</span>
              <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden mt-0.5">
                <div
                  className={`h-full transition-all duration-200 ${
                    shield > 50 ? 'bg-emerald-400' : shield > 25 ? 'bg-amber-400' : 'bg-red-500 animate-pulse'
                  }`}
                  style={{ width: `${shield}%` }}
                />
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-white/90 ml-1">{shield}%</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 shadow-lg">
            <Flame className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] text-white/60 font-bold">{t.speed}</span>
              <span className="text-xs font-mono font-bold text-cyan-300">{speed} LY/s</span>
            </div>
          </div>
        </div>

        {/* Center: Live Score Display */}
        <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md px-5 py-2 rounded-2xl border border-emerald-500/30 shadow-xl shadow-emerald-950/30 pointer-events-auto">
          <Trophy className="w-4 h-4 text-emerald-400" />
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-emerald-300 font-bold tracking-widest">{t.score}</span>
            <span className="text-base font-mono font-extrabold text-white tracking-wider">{score}</span>
          </div>
        </div>

        {/* Right: Sound toggle & Exit */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2.5 rounded-xl bg-black/60 hover:bg-black/90 border border-white/10 text-white/80 transition-colors backdrop-blur-md"
            title="Toggle Sound"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-white/40" />}
          </button>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 text-red-200 transition-colors backdrop-blur-md"
            title={t.exit}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Touch Controls (Pedals & Fire Button) */}
      <div className="absolute bottom-5 inset-x-5 z-20 flex justify-between items-end pointer-events-none sm:hidden">
        {/* Left/Right Steer Pedals */}
        <div className="flex gap-2 pointer-events-auto">
          <button
            onPointerDown={() => (gameRef.current.keys.left = true)}
            onPointerUp={() => (gameRef.current.keys.left = false)}
            onPointerLeave={() => (gameRef.current.keys.left = false)}
            className="w-16 h-16 rounded-2xl bg-black/70 active:bg-emerald-500/40 border border-white/20 text-white flex items-center justify-center font-bold text-xl active:scale-95 shadow-xl backdrop-blur-md"
          >
            ◀
          </button>
          <button
            onPointerDown={() => (gameRef.current.keys.right = true)}
            onPointerUp={() => (gameRef.current.keys.right = false)}
            onPointerLeave={() => (gameRef.current.keys.right = false)}
            className="w-16 h-16 rounded-2xl bg-black/70 active:bg-emerald-500/40 border border-white/20 text-white flex items-center justify-center font-bold text-xl active:scale-95 shadow-xl backdrop-blur-md"
          >
            ▶
          </button>
        </div>

        {/* Laser Fire Trigger */}
        <button
          onPointerDown={() => {
            gameRef.current.keys.fire = true;
            setTimeout(() => (gameRef.current.keys.fire = false), 150);
          }}
          className="w-20 h-20 rounded-2xl bg-cyan-500/30 active:bg-cyan-400 border border-cyan-400/50 text-cyan-200 active:text-black flex flex-col items-center justify-center font-extrabold shadow-2xl active:scale-95 pointer-events-auto backdrop-blur-md"
        >
          <Crosshair className="w-7 h-7 mb-0.5" />
          <span className="text-[10px] tracking-widest">FIRE</span>
        </button>
      </div>

      {/* Game Over Screen */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-lg flex items-center justify-center p-4 anim-pop">
          <div className="max-w-md w-full bg-neutral-900/90 border border-red-500/40 rounded-3xl p-6 text-center shadow-2xl shadow-red-950/50">
            <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black tracking-wider text-red-400 mb-1">{t.gameOver}</h2>
            <p className="text-xs text-white/60 mb-6">Gemi kalkanı tükendi. Kuantum çekirdekleri parçalandı.</p>

            <div className="grid grid-cols-2 gap-3 bg-black/40 p-4 rounded-2xl border border-white/10 mb-6">
              <div>
                <span className="text-[10px] text-white/60 font-bold block">{t.score}</span>
                <span className="text-xl font-mono font-bold text-white">{score}</span>
              </div>
              <div>
                <span className="text-[10px] text-white/60 font-bold block">{t.highScore}</span>
                <span className="text-xl font-mono font-bold text-emerald-400">{highScore}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleStartGame}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:opacity-90 text-black font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t.restartBtn}</span>
              </button>
              <button
                onClick={onClose}
                className="py-3 px-5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-all"
              >
                {t.exit}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Title Screen Overlay */}
      {gameState === 'title' && (
        <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-neutral-900/90 border border-white/15 rounded-3xl p-7 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-400 text-black flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/20">
              <Zap className="w-8 h-8" />
            </div>

            <h1 className="text-3xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-300 to-cyan-400 mb-1">
              {t.title}
            </h1>
            <p className="text-xs text-white/60 mb-6">{t.sub}</p>

            <div className="bg-black/50 p-4 rounded-2xl border border-white/10 text-xs text-white/80 mb-6 text-left space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Kırmızı asteroit ve engellerden kaçın veya lazerle yok et (+50).</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>Yeşil kuantum çekirdeklerini topla (+100 ve kalkan yenileme).</span>
              </div>
              <div className="flex items-center gap-2 text-white/60 pt-1 text-[11px]">
                <Crosshair className="w-3.5 h-3.5 text-white/40" />
                <span>{t.controlsHint}</span>
              </div>
            </div>

            <button
              onClick={handleStartGame}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 hover:opacity-90 text-black font-extrabold text-sm tracking-wide shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>{t.startBtn}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
