import { PluginItem } from '../types';

export const INITIAL_PLUGINS: PluginItem[] = [
  {
    id: 'pix',
    name: '🎨 Pixel Artist',
    desc: {
      tr: 'Piksel sanat ve sprite çizimlerini SVG olarak üretir',
      en: 'Draws crisp pixel art and game sprites as SVG',
      de: 'Erstellt gestochen scharfe Pixel-Art und Sprites als SVG',
      es: 'Genera pixel art y sprites nítidos en formato SVG',
    },
    prompt:
      'When game art, characters, icons or sprites are requested, draw crisp pixel-art SVG with shape-rendering="crispEdges", clear viewBox, and an authentic retro palette inside a fenced ```svg code block.',
    enabled: true,
  },
  {
    id: 'lvl',
    name: '🗺️ Level Designer',
    desc: {
      tr: 'Bölüm tasarımı, oda yerleşimleri, bulmaca ve tempo dengesi',
      en: 'Rooms, layout pacing, puzzles, and progression curves',
      de: 'Leveldesign, Raumaufteilung, Rätsel und Fortschrittskurven',
      es: 'Diseño de niveles, distribución de salas, puzles y ritmo',
    },
    prompt:
      'For level and world requests, provide room-by-room or zone-by-zone blueprints, enemy placements, difficulty spikes, reward placement, and player orientation signs.',
    enabled: false,
  },
  {
    id: 'rev',
    name: '🔍 Code Reviewer',
    desc: {
      tr: 'Oyun kodlarındaki hataları, bellek sızıntılarını ve FPS düşüşlerini tespit eder',
      en: 'Finds bugs, memory leaks, and performance drops',
      de: 'Findet Fehler, Speicherlecks und Leistungseinbrüche',
      es: 'Detecta bugs, fugas de memoria y caídas de FPS',
    },
    prompt:
      'When code is shown or debugged, systematically audit it: identify memory leaks (e.g. uncleared intervals, canvas redraw waste), race conditions, input lags, and propose verified drop-in fixes.',
    enabled: false,
  },
  {
    id: '3js',
    name: '🧊 Three.js Expert',
    desc: {
      tr: 'Tek dosyalık 3D Three.js oyunları ve WebGL sahneleri yazar',
      en: 'Produces single-file 3D Three.js browser games',
      de: 'Erstellt 3D-Browsergames in einer Datei mit Three.js',
      es: 'Crea juegos 3D en un solo archivo con Three.js',
    },
    prompt:
      'When 3D games are requested, write self-contained single-file HTML using Three.js (r128 from cdnjs), pointer-lock controls, smooth lighting, low-poly procedural meshes, and collision bounding boxes.',
    enabled: false,
  },
  {
    id: 'sty',
    name: '📖 Story & Lore Writer',
    desc: {
      tr: 'Atmosferik oyun hikayeleri, dallanan diyaloglar ve karakter geçmişleri',
      en: 'Atmospheric game lore, branching dialogues, and NPC backstories',
      de: 'Atmosphärische Spielelore, verzweigte Dialoge und NPC-Hintergründe',
      es: 'Historias envolventes, árboles de diálogo y trasfondo de personajes',
    },
    prompt:
      'For narrative requests, craft deep original lore, atmospheric world rules, distinct character voices, and branching dialogue nodes with player choices and consequences.',
    enabled: false,
  },
  {
    id: 'pub',
    name: '🚀 Publisher & Launch',
    desc: {
      tr: 'Game Jolt, itch.io ve Steam için yayınlama ve pazarlama rehberi',
      en: 'Game Jolt, itch.io, and Steam release preparation & store copy',
      de: 'Veröffentlichungs- und Marketingleitfaden für itch.io und Steam',
      es: 'Guía de lanzamiento y marketing para itch.io, Game Jolt y Steam',
    },
    prompt:
      'For release questions, provide launch checklists, compelling store description copy, catchy game hooks, tags, screenshot framing tips, and build export guidelines.',
    enabled: false,
  },
];
