import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { X, Eye, Maximize2, Minimize2, RotateCcw, Sparkles, ChevronDown, ChevronUp, Layers, Box } from 'lucide-react';
import { Language } from '../types';

interface ThreeStudioProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

type ModelType = 'mech' | 'rover' | 'crystal';
type FinishType = 'titanium' | 'rosegold' | 'cyberpunk' | 'obsidian';
type LightingType = 'studio' | 'neon' | 'sunset' | 'void';

export const ThreeStudio: React.FC<ThreeStudioProps> = ({ isOpen, onClose, lang }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [modelType, setModelType] = useState<ModelType>('mech');
  const [finish, setFinish] = useState<FinishType>('titanium');
  const [lighting, setLighting] = useState<LightingType>('studio');
  const [exploded, setExploded] = useState<number>(0);
  const [wireframe, setWireframe] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Mutable refs for Three.js scene objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const partsRef = useRef<{ mesh: THREE.Mesh; basePos: THREE.Vector3; explodeDir: THREE.Vector3 }[]>([]);
  const targetExplodeRef = useRef<number>(0);
  const curExplodeRef = useRef<number>(0);
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
  const rimLightRef = useRef<THREE.PointLight | null>(null);

  // Sync state to ref
  targetExplodeRef.current = exploded;

  const t = {
    tr: {
      title: '3D Prosedürel Sahne Stüdyosu',
      badge: 'THREE.JS PBR MOTORU',
      models: {
        mech: 'Kuantum Mech Çekirdeği',
        rover: 'Hyperion Mars Gezgini',
        crystal: 'Biyolüminesans Kule',
      },
      finishes: {
        titanium: 'Fırçalanmış Titanyum',
        rosegold: 'Gül Altını',
        cyberpunk: 'Siber Zümrüt',
        obsidian: 'Obsidyen Karbon',
      },
      lighting: {
        studio: 'PBR Stüdyo',
        neon: 'Siberpunk Neon',
        sunset: 'Altın Saat',
        void: 'Derin Uzay',
      },
      explodedLabel: 'Parçalara Ayırma (Exploded View)',
      wireframe: 'Tel Çerçeve',
      autoOrbit: 'Otomatik Dönüş',
      resetCamera: 'Kamerayı Sıfırla',
      hideControls: 'Paneli Gizle',
      showControls: 'Paneli Göster',
      close: 'Kapat (Esc)',
    },
    en: {
      title: '3D Procedural Scene Studio',
      badge: 'THREE.JS PBR ENGINE',
      models: {
        mech: 'Quantum Mech Core',
        rover: 'Hyperion Mars Rover',
        crystal: 'Bioluminescent Spire',
      },
      finishes: {
        titanium: 'Brushed Titanium',
        rosegold: 'Rose Gold',
        cyberpunk: 'Cyber Emerald',
        obsidian: 'Obsidian Carbon',
      },
      lighting: {
        studio: 'PBR Studio',
        neon: 'Cyberpunk Neon',
        sunset: 'Golden Hour',
        void: 'Deep Space',
      },
      explodedLabel: 'Exploded View Separation',
      wireframe: 'Wireframe',
      autoOrbit: 'Auto Orbit',
      resetCamera: 'Reset Camera',
      hideControls: 'Hide Controls',
      showControls: 'Show Controls',
      close: 'Close (Esc)',
    },
    de: {
      title: '3D Prozedurales Szenen-Studio',
      badge: 'THREE.JS PBR MOTOR',
      models: {
        mech: 'Quanten-Mech-Kern',
        rover: 'Hyperion Mars Rover',
        crystal: 'Biolumineszenter Turm',
      },
      finishes: {
        titanium: 'Gebürstetes Titan',
        rosegold: 'Roségold',
        cyberpunk: 'Cyber-Smaragd',
        obsidian: 'Obsidian-Carbon',
      },
      lighting: {
        studio: 'PBR Studio',
        neon: 'Cyberpunk Neon',
        sunset: 'Goldene Stunde',
        void: 'Tiefer Raum',
      },
      explodedLabel: 'Explosionsansicht',
      wireframe: 'Drahtgitter',
      autoOrbit: 'Automatische Drehung',
      resetCamera: 'Kamera zurücksetzen',
      hideControls: 'Steuerung ausblenden',
      showControls: 'Steuerung einblenden',
      close: 'Schließen (Esc)',
    },
    es: {
      title: 'Estudio de Escena 3D Procedural',
      badge: 'MOTOR THREE.JS PBR',
      models: {
        mech: 'Núcleo Mech Cuántico',
        rover: 'Rover Hyperion Marte',
        crystal: 'Aguja Bioluminiscente',
      },
      finishes: {
        titanium: 'Titanio Cepillado',
        rosegold: 'Oro Rosa',
        cyberpunk: 'Esmeralda Cyber',
        obsidian: 'Carbón Obsidiana',
      },
      lighting: {
        studio: 'Estudio PBR',
        neon: 'Cyberpunk Neón',
        sunset: 'Hora Dorada',
        void: 'Espacio Profundo',
      },
      explodedLabel: 'Vista Explosionada',
      wireframe: 'Malla Alambre',
      autoOrbit: 'Giro Automático',
      resetCamera: 'Restablecer Cámara',
      hideControls: 'Ocultar Controles',
      showControls: 'Mostrar Controles',
      close: 'Cerrar (Esc)',
    },
  }[lang] || {
    title: '3D Procedural Scene Studio',
    badge: 'THREE.JS PBR ENGINE',
    models: {
      mech: 'Quantum Mech Core',
      rover: 'Hyperion Mars Rover',
      crystal: 'Bioluminescent Spire',
    },
    finishes: {
      titanium: 'Brushed Titanium',
      rosegold: 'Rose Gold',
      cyberpunk: 'Cyber Emerald',
      obsidian: 'Obsidian Carbon',
    },
    lighting: {
      studio: 'PBR Studio',
      neon: 'Cyberpunk Neon',
      sunset: 'Golden Hour',
      void: 'Deep Space',
    },
    explodedLabel: 'Exploded View Separation',
    wireframe: 'Wireframe',
    autoOrbit: 'Auto Orbit',
    resetCamera: 'Reset Camera',
    hideControls: 'Hide Controls',
    showControls: 'Show Controls',
    close: 'Close (Esc)',
  };

  // Keyboard shortcut: H for HUD, Esc for close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key.toLowerCase() === 'h') setIsDockCollapsed((prev) => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Main Three.js Lifecycle
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const mount = containerRef.current;
    const width = mount.clientWidth || window.innerWidth;
    const height = mount.clientHeight || window.innerHeight;

    // 1. Detect software WebGL
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    // 2. Renderer setup with PBR and SRGB Color Space
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    mount.appendChild(renderer.domElement);

    // 3. Scene and Environment
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0c12);
    scene.fog = new THREE.FogExp2(0x0a0c12, 0.035);
    sceneRef.current = scene;

    // Procedural Studio Environment map using RoomEnvironment & PMREMGenerator
    try {
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
    } catch (e) {
      console.warn('RoomEnvironment generation notice:', e);
    }

    // 4. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 3.2, 7.5);
    camera.lookAt(0, 1.2, 0);
    cameraRef.current = camera;

    // 5. Lighting Rig (3-point warm/cool balance)
    const keyLight = new THREE.DirectionalLight(0xfff3e0, 2.5);
    keyLight.position.set(5, 8, 4);
    keyLight.castShadow = !isSoftwareGl;
    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 25;
      keyLight.shadow.camera.left = -5;
      keyLight.shadow.camera.right = 5;
      keyLight.shadow.camera.top = 5;
      keyLight.shadow.camera.bottom = -5;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);
    keyLightRef.current = keyLight;

    const hemiLight = new THREE.HemisphereLight(0x7ec8e3, 0x1a243b, 1.2);
    hemiLight.position.set(0, 10, 0);
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    const rimLight = new THREE.PointLight(0x40e0d0, 3, 15);
    rimLight.position.set(-4, 3, -4);
    scene.add(rimLight);
    rimLightRef.current = rimLight;

    // Contact shadow plane (soft radial ground shadow)
    const groundGeo = new THREE.PlaneGeometry(12, 12);
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(128, 128, 20, 128, 128, 120);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
      grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
    }
    const shadowTex = new THREE.CanvasTexture(canvas);
    shadowTex.colorSpace = THREE.SRGBColorSpace;

    const groundMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.8,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    scene.add(ground);

    // Grid Floor
    const gridHelper = new THREE.GridHelper(16, 32, 0x10a37f, 0x1f293d);
    gridHelper.position.y = -0.02;
    scene.add(gridHelper);

    // Pointer Drag / Orbit state
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let orbitAzimuth = 0.4;
    let orbitPolar = 1.2;
    let orbitDistance = 7.5;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouseX;
      const dy = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      orbitAzimuth -= dx * 0.007;
      orbitPolar = Math.max(0.2, Math.min(Math.PI / 2 - 0.05, orbitPolar + dy * 0.007));
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      orbitDistance = Math.max(3.5, Math.min(14, orbitDistance + e.deltaY * 0.005));
    };

    mount.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    mount.addEventListener('wheel', onWheel, { passive: true });

    // Resize observer
    const onResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Animation Loop
    let animationFrameId = 0;
    const clock = new THREE.Clock();

    const tick = () => {
      const delta = Math.min(clock.getDelta(), 0.1);

      // Smooth camera position damping
      if (autoRotate && !isDragging) {
        orbitAzimuth += delta * 0.35;
      }

      const targetX = Math.sin(orbitAzimuth) * Math.cos(orbitPolar) * orbitDistance;
      const targetY = Math.sin(orbitPolar) * orbitDistance;
      const targetZ = Math.cos(orbitAzimuth) * Math.cos(orbitPolar) * orbitDistance;

      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetX, 8, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, Math.max(1.0, targetY), 8, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, 8, delta);
      camera.lookAt(0, 1.2, 0);

      // Exploded-view smooth spring damping
      curExplodeRef.current = THREE.MathUtils.damp(curExplodeRef.current, targetExplodeRef.current, 6, delta);
      const ex = curExplodeRef.current;

      for (const part of partsRef.current) {
        part.mesh.position.x = part.basePos.x + part.explodeDir.x * ex;
        part.mesh.position.y = part.basePos.y + part.explodeDir.y * ex;
        part.mesh.position.z = part.basePos.z + part.explodeDir.z * ex;
      }

      // Rotate sub-parts (like reactor core or gyro ring)
      if (modelGroupRef.current) {
        const coreRing = modelGroupRef.current.getObjectByName('animated_core');
        if (coreRing) {
          coreRing.rotation.y += delta * 1.5;
          coreRing.rotation.x += delta * 0.8;
        }
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', onResize);
      mount.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      mount.removeEventListener('wheel', onWheel);

      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [isOpen]);

  // Build Procedural 3D Models
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // Remove existing model group
    if (modelGroupRef.current) {
      scene.remove(modelGroupRef.current);
      modelGroupRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const m = child as THREE.Mesh;
          m.geometry?.dispose();
          if (Array.isArray(m.material)) m.material.forEach((mat) => mat.dispose());
          else m.material?.dispose();
        }
      });
    }

    const group = new THREE.Group();
    partsRef.current = [];

    // Helper to get finish material settings
    const getFinishMaterial = (accent = false, glass = false) => {
      if (glass) {
        return new THREE.MeshPhysicalMaterial({
          color: 0x88ccff,
          metalness: 0.1,
          roughness: 0.1,
          transparent: true,
          opacity: 0.55,
          transmission: 0.6,
          ior: 1.5,
          wireframe,
        });
      }

      let color = 0x8a9ba8;
      let metalness = 0.9;
      let roughness = 0.2;
      let emissive = 0x000000;

      if (finish === 'titanium') {
        color = accent ? 0x10a37f : 0x717983;
        metalness = 0.85;
        roughness = accent ? 0.25 : 0.35;
      } else if (finish === 'rosegold') {
        color = accent ? 0xffb7b2 : 0xb76e79;
        metalness = 0.92;
        roughness = 0.18;
      } else if (finish === 'cyberpunk') {
        color = accent ? 0x00ffcc : 0x1a2130;
        metalness = 0.75;
        roughness = 0.3;
        emissive = accent ? 0x003322 : 0x000000;
      } else if (finish === 'obsidian') {
        color = accent ? 0x38bdf8 : 0x111318;
        metalness = 0.95;
        roughness = 0.12;
      }

      return new THREE.MeshStandardMaterial({
        color,
        metalness,
        roughness,
        emissive,
        wireframe,
      });
    };

    const registerPart = (mesh: THREE.Mesh, explodeDir: THREE.Vector3) => {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
      partsRef.current.push({
        mesh,
        basePos: mesh.position.clone(),
        explodeDir,
      });
    };

    if (modelType === 'mech') {
      // 1. Quantum Mech Core (8 parts)
      // Part 1: Central Core Torus / Reactor
      const coreGeo = new THREE.TorusGeometry(0.55, 0.16, 24, 48);
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0x00f5d4,
        emissive: 0x00a896,
        roughness: 0.15,
        metalness: 0.9,
        wireframe,
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      coreMesh.name = 'animated_core';
      coreMesh.position.set(0, 1.4, 0);
      registerPart(coreMesh, new THREE.Vector3(0, 0, 0));

      // Part 2: Inner Quantum Orb
      const orbGeo = new THREE.SphereGeometry(0.32, 24, 24);
      const orbMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0x10a37f,
        emissiveIntensity: 1.5,
        wireframe,
      });
      const orbMesh = new THREE.Mesh(orbGeo, orbMat);
      orbMesh.position.set(0, 1.4, 0);
      registerPart(orbMesh, new THREE.Vector3(0, 0, 0));

      // Part 3: Main Upper Chassis Housing
      const chassisGeo = new THREE.CylinderGeometry(0.85, 0.65, 0.7, 8);
      const chassisMat = getFinishMaterial(false);
      const chassisMesh = new THREE.Mesh(chassisGeo, chassisMat);
      chassisMesh.position.set(0, 2.15, 0);
      registerPart(chassisMesh, new THREE.Vector3(0, 1.2, 0));

      // Part 4: Cyber Sensor Visor
      const visorGeo = new THREE.BoxGeometry(0.7, 0.22, 0.45);
      const visorMat = new THREE.MeshStandardMaterial({
        color: 0x00e5ff,
        emissive: 0x0099bb,
        roughness: 0.1,
        metalness: 0.8,
        wireframe,
      });
      const visorMesh = new THREE.Mesh(visorGeo, visorMat);
      visorMesh.position.set(0, 2.15, 0.42);
      registerPart(visorMesh, new THREE.Vector3(0, 1.3, 0.8));

      // Part 5: Left Thruster Nacelle
      const thrusterGeo = new THREE.CylinderGeometry(0.22, 0.3, 1.1, 16);
      const thrusterMat = getFinishMaterial(true);
      const leftThruster = new THREE.Mesh(thrusterGeo, thrusterMat);
      leftThruster.position.set(-1.1, 1.4, -0.2);
      leftThruster.rotation.z = 0.2;
      registerPart(leftThruster, new THREE.Vector3(-1.4, 0.3, 0));

      // Part 6: Right Thruster Nacelle
      const rightThruster = new THREE.Mesh(thrusterGeo, thrusterMat);
      rightThruster.position.set(1.1, 1.4, -0.2);
      rightThruster.rotation.z = -0.2;
      registerPart(rightThruster, new THREE.Vector3(1.4, 0.3, 0));

      // Part 7: Lower Intake Manifold
      const manifoldGeo = new THREE.ConeGeometry(0.75, 0.8, 6);
      const manifoldMat = getFinishMaterial(false);
      const manifoldMesh = new THREE.Mesh(manifoldGeo, manifoldMat);
      manifoldMesh.position.set(0, 0.65, 0);
      manifoldMesh.rotation.x = Math.PI;
      registerPart(manifoldMesh, new THREE.Vector3(0, -1.0, 0));

      // Part 8: Stabilizer Antenna Arrays
      const antGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.9, 8);
      const antMat = getFinishMaterial(true);
      const leftAnt = new THREE.Mesh(antGeo, antMat);
      leftAnt.position.set(-0.5, 2.7, -0.2);
      leftAnt.rotation.z = 0.35;
      registerPart(leftAnt, new THREE.Vector3(-0.6, 1.5, -0.4));

      const rightAnt = new THREE.Mesh(antGeo, antMat);
      rightAnt.position.set(0.5, 2.7, -0.2);
      rightAnt.rotation.z = -0.35;
      registerPart(rightAnt, new THREE.Vector3(0.6, 1.5, -0.4));
    } else if (modelType === 'rover') {
      // 2. Hyperion Mars Rover (9 parts)
      // Part 1: Main Armored Chassis
      const chassisGeo = new THREE.BoxGeometry(1.6, 0.5, 2.4);
      const chassisMesh = new THREE.Mesh(chassisGeo, getFinishMaterial(false));
      chassisMesh.position.set(0, 0.8, 0);
      registerPart(chassisMesh, new THREE.Vector3(0, 0.2, 0));

      // Part 2: Observation Canopy (PBR glass)
      const canopyGeo = new THREE.CylinderGeometry(0.45, 0.65, 0.55, 6);
      const canopyMesh = new THREE.Mesh(canopyGeo, getFinishMaterial(false, true));
      canopyMesh.position.set(0, 1.25, 0.35);
      registerPart(canopyMesh, new THREE.Vector3(0, 1.1, 0.4));

      // Part 3-6: High-traction Heavy Terrain Wheels
      const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.32, 24);
      const wheelMat = new THREE.MeshStandardMaterial({
        color: 0x1f242d,
        roughness: 0.85,
        metalness: 0.2,
        wireframe,
      });

      const wFL = new THREE.Mesh(wheelGeo, wheelMat);
      wFL.rotation.z = Math.PI / 2;
      wFL.position.set(-1.1, 0.45, 0.9);
      registerPart(wFL, new THREE.Vector3(-1.0, 0, 0.8));

      const wFR = new THREE.Mesh(wheelGeo, wheelMat);
      wFR.rotation.z = Math.PI / 2;
      wFR.position.set(1.1, 0.45, 0.9);
      registerPart(wFR, new THREE.Vector3(1.0, 0, 0.8));

      const wRL = new THREE.Mesh(wheelGeo, wheelMat);
      wRL.rotation.z = Math.PI / 2;
      wRL.position.set(-1.1, 0.45, -0.9);
      registerPart(wRL, new THREE.Vector3(-1.0, 0, -0.8));

      const wRR = new THREE.Mesh(wheelGeo, wheelMat);
      wRR.rotation.z = Math.PI / 2;
      wRR.position.set(1.1, 0.45, -0.9);
      registerPart(wRR, new THREE.Vector3(1.0, 0, -0.8));

      // Part 7: Radar Sensor Dish Mast
      const mastGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8);
      const mastMesh = new THREE.Mesh(mastGeo, getFinishMaterial(true));
      mastMesh.position.set(0.5, 1.4, -0.6);
      registerPart(mastMesh, new THREE.Vector3(0.6, 1.2, -0.6));

      const dishGeo = new THREE.SphereGeometry(0.28, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.5);
      const dishMesh = new THREE.Mesh(dishGeo, getFinishMaterial(true));
      dishMesh.position.set(0.5, 1.85, -0.6);
      dishMesh.rotation.x = -0.5;
      registerPart(dishMesh, new THREE.Vector3(0.6, 1.8, -0.6));

      // Part 8: Dual Rear Thruster / Battery Bank
      const battGeo = new THREE.BoxGeometry(0.9, 0.35, 0.5);
      const battMesh = new THREE.Mesh(battGeo, getFinishMaterial(true));
      battMesh.position.set(0, 1.05, -0.85);
      registerPart(battMesh, new THREE.Vector3(0, 0.5, -1.2));
    } else if (modelType === 'crystal') {
      // 3. Bioluminescent Crystal Spire (6 parts)
      // Part 1: Main Faceted Spire Crystal
      const spireGeo = new THREE.ConeGeometry(0.6, 2.8, 6);
      const spireMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.4,
        roughness: 0.1,
        metalness: 0.2,
        transparent: true,
        opacity: 0.85,
        wireframe,
      });
      const spireMesh = new THREE.Mesh(spireGeo, spireMat);
      spireMesh.position.set(0, 1.7, 0);
      registerPart(spireMesh, new THREE.Vector3(0, 0.8, 0));

      // Part 2: Levitation Gyro Ring
      const ringGeo = new THREE.TorusGeometry(1.0, 0.08, 16, 48);
      const ringMat = getFinishMaterial(true);
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.name = 'animated_core';
      ringMesh.position.set(0, 1.7, 0);
      registerPart(ringMesh, new THREE.Vector3(0, 0, 0));

      // Part 3: Octagonal Altar Pedestal
      const baseGeo = new THREE.CylinderGeometry(1.3, 1.6, 0.4, 8);
      const baseMesh = new THREE.Mesh(baseGeo, getFinishMaterial(false));
      baseMesh.position.set(0, 0.2, 0);
      registerPart(baseMesh, new THREE.Vector3(0, -0.4, 0));

      // Part 4-6: Floating Satellite Shards
      const shardGeo = new THREE.OctahedronGeometry(0.25, 0);
      const shardMat = getFinishMaterial(true);

      for (let i = 0; i < 3; i++) {
        const ang = (i / 3) * Math.PI * 2;
        const shard = new THREE.Mesh(shardGeo, shardMat);
        shard.position.set(Math.cos(ang) * 1.5, 1.8 + Math.sin(ang) * 0.3, Math.sin(ang) * 1.5);
        registerPart(shard, new THREE.Vector3(Math.cos(ang) * 1.2, 0.5, Math.sin(ang) * 1.2));
      }
    }

    scene.add(group);
    modelGroupRef.current = group;
  }, [modelType, finish, wireframe]);

  // Update lighting preset
  useEffect(() => {
    if (!keyLightRef.current || !hemiLightRef.current || !rimLightRef.current) return;
    const key = keyLightRef.current;
    const hemi = hemiLightRef.current;
    const rim = rimLightRef.current;

    if (lighting === 'studio') {
      key.color.setHex(0xfff3e0);
      key.intensity = 2.5;
      hemi.color.setHex(0x7ec8e3);
      hemi.groundColor.setHex(0x1a243b);
      rim.color.setHex(0x40e0d0);
    } else if (lighting === 'neon') {
      key.color.setHex(0xff007f);
      key.intensity = 3.0;
      hemi.color.setHex(0x00f5d4);
      hemi.groundColor.setHex(0x120024);
      rim.color.setHex(0x7928ca);
    } else if (lighting === 'sunset') {
      key.color.setHex(0xff7a00);
      key.intensity = 3.2;
      hemi.color.setHex(0xffb703);
      hemi.groundColor.setHex(0x3d0000);
      rim.color.setHex(0x023047);
    } else if (lighting === 'void') {
      key.color.setHex(0xd0e0ff);
      key.intensity = 1.6;
      hemi.color.setHex(0x0a1128);
      hemi.groundColor.setHex(0x000411);
      rim.color.setHex(0x38bdf8);
    }
  }, [lighting]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#0a0c12] text-white overflow-hidden select-none flex flex-col ${
        isFullscreen ? 'p-0' : ''
      }`}
    >
      {/* 3D Scene Viewport (100% Unobstructed Center) */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Header Overlay: Minimalist Spec Badge & Window Actions */}
      <div className="relative z-20 flex items-center justify-between p-4 pointer-events-none">
        <div className="flex items-center gap-2.5 pointer-events-auto">
          <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs font-bold text-emerald-400 flex items-center gap-1.5 shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.badge}</span>
          </div>
          <span className="text-sm font-semibold text-white/90 hidden sm:inline-block">
            {t.models[modelType]}
          </span>
        </div>

        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold backdrop-blur-md transition-colors ${
              autoRotate ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-black/40 border-white/10 text-white/70'
            }`}
            title={t.autoOrbit}
          >
            <RotateCcw className={`w-3.5 h-3.5 inline mr-1 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
            <span className="hidden sm:inline">{t.autoOrbit}</span>
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl bg-black/50 hover:bg-black/80 border border-white/10 text-white/80 hover:text-white transition-colors backdrop-blur-md"
            title="Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 text-red-200 transition-colors backdrop-blur-md ml-1"
            title={t.close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Collapsible Unified Bottom Control Dock (Zero Viewport Occlusion) */}
      <div
        className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-[94vw] max-w-4xl transition-all duration-300 ease-out pointer-events-auto ${
          isDockCollapsed ? 'translate-y-[calc(100%-36px)]' : 'translate-y-0'
        }`}
      >
        {/* Collapse / Expand Tab Handle */}
        <div className="flex justify-center mb-1">
          <button
            onClick={() => setIsDockCollapsed(!isDockCollapsed)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-t-lg bg-black/80 hover:bg-black border-t border-x border-white/15 text-xs text-white/80 hover:text-white backdrop-blur-md transition-all shadow-md"
          >
            {isDockCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.showControls} (H)</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-white/60" />
                <span>{t.hideControls} (H)</span>
              </>
            )}
          </button>
        </div>

        {/* Dock Controls Container */}
        <div className="p-3.5 rounded-2xl bg-neutral-900/85 border border-white/15 shadow-2xl backdrop-blur-xl flex flex-col gap-3">
          {/* Row 1: Model Selection & Exploded View Slider */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Model Selector Pills */}
            <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
              {(['mech', 'rover', 'crystal'] as ModelType[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setModelType(m)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    modelType === m ? 'bg-emerald-500 text-black shadow-md font-bold' : 'text-white/70 hover:text-white'
                  }`}
                >
                  {t.models[m]}
                </button>
              ))}
            </div>

            {/* Exploded Separation Slider */}
            <div className="flex items-center gap-2.5 flex-1 min-w-[220px] max-w-sm bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">
              <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-[11px] text-white/80 whitespace-nowrap">{t.explodedLabel}:</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={exploded}
                onChange={(e) => setExploded(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <span className="text-xs font-mono font-bold text-emerald-400 w-8 text-right">
                {Math.round(exploded * 100)}%
              </span>
            </div>

            {/* Wireframe toggle */}
            <button
              onClick={() => setWireframe(!wireframe)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                wireframe ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' : 'bg-black/40 border-white/10 text-white/70'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>{t.wireframe}</span>
            </button>
          </div>

          {/* Row 2: Finishes & Lighting Swatches */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10 text-xs">
            {/* Finishes */}
            <div className="flex items-center gap-2">
              <span className="text-white/60 text-[11px]">Malzeme / Finish:</span>
              <div className="flex items-center gap-1.5">
                {(['titanium', 'rosegold', 'cyberpunk', 'obsidian'] as FinishType[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFinish(f)}
                    className={`px-2.5 py-1 rounded-lg border transition-all text-[11px] font-medium ${
                      finish === f
                        ? 'bg-white/20 border-emerald-400 text-white shadow-sm'
                        : 'bg-black/30 border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    {t.finishes[f]}
                  </button>
                ))}
              </div>
            </div>

            {/* Lighting Rig */}
            <div className="flex items-center gap-2">
              <span className="text-white/60 text-[11px]">Işık / Light:</span>
              <div className="flex items-center gap-1.5">
                {(['studio', 'neon', 'sunset', 'void'] as LightingType[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLighting(l)}
                    className={`px-2.5 py-1 rounded-lg border transition-all text-[11px] font-medium ${
                      lighting === l
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                        : 'bg-black/30 border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    {t.lighting[l]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
