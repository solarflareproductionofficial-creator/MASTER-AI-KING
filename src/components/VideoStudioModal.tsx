import React, { useState, useRef } from 'react';
import { X, Video, Film, Download, Sparkles, RefreshCw, AlertCircle, Image as ImageIcon, Play, Smartphone, Monitor } from 'lucide-react';
import { Language } from '../types';

interface VideoStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const VideoStudioModal: React.FC<VideoStudioModalProps> = ({ isOpen, onClose, lang }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [duration, setDuration] = useState<'5s' | '10s'>('5s');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = {
    tr: {
      title: 'Video Üretim Stüdyosu (Omni Flash)',
      subtitle: 'Gemini Omni Flash 1.1 ile metin veya görselden yüksek kaliteli video üretin.',
      aspectLandscape: '16:9 Yatay (Geniş Ekran)',
      aspectPortrait: '9:16 Dikey (Shorts / Reels)',
      duration5: '5 Saniye',
      duration10: '10 Saniye',
      promptPlaceholder: 'Oluşturmak istediğiniz sahneyi, hareketi ve sinematik kamera açısını tarif edin…',
      generateBtn: 'Videoyu Üret',
      generating: 'Omni Flash video oluşturuyor (bu işlem 1-2 dakika sürebilir)…',
      addStartingFrame: 'Başlangıç Görseli Ekle (Görseli Canlandır)',
      downloadMp4: 'MP4 İndir',
      presets: [
        { label: '🚀 Kuantum Uzay Gemisi', prompt: 'Cinematic wide shot of a futuristic sleek spaceship cruising through an alien nebula with pulsing neon thrusters, photorealistic 8k.' },
        { label: '🌸 Kiraz Çiçekleri & Göl', prompt: 'Gentle cherry blossom petals falling over a reflective tranquil Japanese garden pond in morning golden hour mist.' },
        { label: '🤖 Siber Robot & Yağmur', prompt: 'A friendly glowing android robot holding an umbrella walking through a rainy neon cyberpunk city street at night.' },
        { label: '🌊 Okyanus Dalgaları', prompt: 'Epic crystal clear turquoise ocean wave rolling in slow motion during a vibrant tropical sunset.' },
      ],
      notice: 'Gemini Omni Flash modelleri ücretli API anahtarı veya kota gerektirebilir.',
      close: 'Kapat',
    },
    en: {
      title: 'Video Generation Studio (Omni Flash)',
      subtitle: 'Create cinematic videos from text or images using Gemini Omni Flash 1.1.',
      aspectLandscape: '16:9 Landscape (Widescreen)',
      aspectPortrait: '9:16 Portrait (Shorts / Reels)',
      duration5: '5 Seconds',
      duration10: '10 Seconds',
      promptPlaceholder: 'Describe the scene, motion, lighting, and cinematic camera angle…',
      generateBtn: 'Generate Video',
      generating: 'Omni Flash is rendering video (may take 1-2 minutes)…',
      addStartingFrame: 'Add Starting Frame (Animate Image)',
      downloadMp4: 'Download MP4',
      presets: [
        { label: '🚀 Quantum Starship', prompt: 'Cinematic wide shot of a futuristic sleek spaceship cruising through an alien nebula with pulsing neon thrusters, photorealistic 8k.' },
        { label: '🌸 Cherry Blossom Pond', prompt: 'Gentle cherry blossom petals falling over a reflective tranquil Japanese garden pond in morning golden hour mist.' },
        { label: '🤖 Cyber Android in Rain', prompt: 'A friendly glowing android robot holding an umbrella walking through a rainy neon cyberpunk city street at night.' },
        { label: '🌊 Ocean Wave Sunset', prompt: 'Epic crystal clear turquoise ocean wave rolling in slow motion during a vibrant tropical sunset.' },
      ],
      notice: 'Gemini Omni Flash requires a billing-enabled project or paid API quota.',
      close: 'Close',
    },
    de: {
      title: 'Video-Studio (Omni Flash)',
      subtitle: 'Erstellen Sie Videos mit Gemini Omni Flash 1.1.',
      aspectLandscape: '16:9 Breitbild',
      aspectPortrait: '9:16 Hochformat',
      duration5: '5 Sekunden',
      duration10: '10 Sekunden',
      promptPlaceholder: 'Beschreiben Sie die Szene, Bewegung und Beleuchtung…',
      generateBtn: 'Video generieren',
      generating: 'Omni Flash rendert Video…',
      addStartingFrame: 'Startbild hinzufügen',
      downloadMp4: 'MP4 herunterladen',
      presets: [
        { label: '🚀 Raumschiff', prompt: 'Futuristic sleek spaceship cruising through a colorful nebula.' },
        { label: '🌸 Kirschblüten', prompt: 'Cherry blossom petals falling over a pond in golden hour.' },
      ],
      notice: 'Gemini Omni Flash erfordert ein bezahltes API-Konto.',
      close: 'Schließen',
    },
    es: {
      title: 'Estudio de Video (Omni Flash)',
      subtitle: 'Crea videos cinemáticos con Gemini Omni Flash 1.1.',
      aspectLandscape: '16:9 Panorámico',
      aspectPortrait: '9:16 Vertical (Shorts)',
      duration5: '5 Segundos',
      duration10: '10 Segundos',
      promptPlaceholder: 'Describe la escena, movimiento y ángulo de cámara…',
      generateBtn: 'Generar Video',
      generating: 'Omni Flash está renderizando el video…',
      addStartingFrame: 'Añadir Fotograma Inicial',
      downloadMp4: 'Descargar MP4',
      presets: [
        { label: '🚀 Nave Espacial', prompt: 'Futuristic spaceship cruising through a colorful nebula.' },
        { label: '🌸 Flores de Cerezo', prompt: 'Cherry blossom petals falling over a tranquil pond.' },
      ],
      notice: 'Gemini Omni Flash requiere un proyecto con facturación habilitada.',
      close: 'Cerrar',
    },
  }[lang] || {
    title: 'Video Generation Studio (Omni Flash)',
    subtitle: 'Create cinematic videos from text or images using Gemini Omni Flash 1.1.',
    aspectLandscape: '16:9 Landscape (Widescreen)',
    aspectPortrait: '9:16 Portrait (Shorts / Reels)',
    duration5: '5 Seconds',
    duration10: '10 Seconds',
    promptPlaceholder: 'Describe the scene, motion, lighting, and cinematic camera angle…',
    generateBtn: 'Generate Video',
    generating: 'Omni Flash is rendering video (may take 1-2 minutes)…',
    addStartingFrame: 'Add Starting Frame (Animate Image)',
    downloadMp4: 'Download MP4',
    presets: [
      { label: '🚀 Quantum Starship', prompt: 'Cinematic wide shot of a futuristic sleek spaceship cruising through an alien nebula with pulsing neon thrusters, photorealistic 8k.' },
      { label: '🌸 Cherry Blossom Pond', prompt: 'Gentle cherry blossom petals falling over a reflective tranquil Japanese garden pond in morning golden hour mist.' },
      { label: '🤖 Cyber Android in Rain', prompt: 'A friendly glowing android robot holding an umbrella walking through a rainy neon cyberpunk city street at night.' },
      { label: '🌊 Ocean Wave Sunset', prompt: 'Epic crystal clear turquoise ocean wave rolling in slow motion during a vibrant tropical sunset.' },
    ],
    notice: 'Gemini Omni Flash requires a billing-enabled project or paid API quota.',
    close: 'Close',
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);
      const base64 = dataUrl.split(',')[1];
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !imageBase64) return;
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt || 'Animate this scene cinematographically.',
          aspectRatio,
          duration,
          resolution: '720p',
          imageBase64,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Video generation request failed.');
      }

      if (data.video) {
        const binary = atob(data.video);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: data.mimeType || 'video/mp4' });
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
      }
    } catch (err: any) {
      console.error('Video generation error:', err);
      setError(err?.message || 'Video generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto anim-pop">
      <div className="bg-[#0f1118] border border-white/15 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col my-auto text-white">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-base md:text-lg text-white">{t.title}</h2>
              <p className="text-xs text-white/60">{t.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 md:p-6 space-y-4">
          {/* Aspect Ratio & Duration Selection */}
          <div className="grid grid-cols-2 gap-2">
            {/* Aspect Ratio */}
            <div className="flex gap-1.5 p-1 bg-black/40 rounded-2xl border border-white/10">
              <button
                onClick={() => setAspectRatio('16:9')}
                className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  aspectRatio === '16:9'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>16:9 Yatay</span>
              </button>
              <button
                onClick={() => setAspectRatio('9:16')}
                className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  aspectRatio === '9:16'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>9:16 Dikey</span>
              </button>
            </div>

            {/* Duration */}
            <div className="flex gap-1.5 p-1 bg-black/40 rounded-2xl border border-white/10">
              <button
                onClick={() => setDuration('5s')}
                className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all ${
                  duration === '5s' ? 'bg-white/20 text-white shadow' : 'text-white/60 hover:text-white'
                }`}
              >
                {t.duration5}
              </button>
              <button
                onClick={() => setDuration('10s')}
                className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all ${
                  duration === '10s' ? 'bg-white/20 text-white shadow' : 'text-white/60 hover:text-white'
                }`}
              >
                {t.duration10}
              </button>
            </div>
          </div>

          {/* Quick Prompt Presets */}
          <div>
            <label className="text-[11px] font-bold text-white/60 mb-1.5 block uppercase tracking-wider">
              Hazır Sinematik Fikirler / Presets:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {t.presets.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(p.prompt)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Textarea */}
          <div>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t.promptPlaceholder}
              className="w-full bg-black/40 border border-white/15 rounded-2xl p-3.5 text-xs md:text-sm text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* Starting frame upload */}
          <div className="flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/80 transition-colors"
            >
              <ImageIcon className="w-4 h-4 text-cyan-400" />
              <span>{t.addStartingFrame}</span>
            </button>

            {imagePreview && (
              <div className="relative flex items-center gap-2 bg-black/40 px-2 py-1 rounded-xl border border-white/10">
                <img src={imagePreview} alt="Starting Frame" className="w-6 h-6 object-cover rounded-lg" />
                <span className="text-[11px] text-white/70">Başlangıç karesi seçildi</span>
                <button
                  onClick={() => {
                    setImagePreview(null);
                    setImageBase64(null);
                  }}
                  className="p-0.5 text-white/50 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Error Notice */}
          {error && (
            <div className="p-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-start gap-2 anim-pop">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block">Üretim Hatası:</span>
                <span>{error}</span>
                <p className="mt-1 text-[11px] text-red-300/80">{t.notice}</p>
              </div>
            </div>
          )}

          {/* Generated Video Player */}
          {videoUrl && (
            <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 space-y-3 anim-pop">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-cyan-400" />
                  <span>Omni Flash 1.1 MP4 Video</span>
                </span>

                <a
                  href={videoUrl}
                  download={`omni_${Date.now()}.mp4`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t.downloadMp4}</span>
                </a>
              </div>

              <div className="rounded-xl overflow-hidden bg-black flex justify-center">
                <video
                  src={videoUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className={`max-h-72 object-contain ${aspectRatio === '9:16' ? 'w-auto h-72' : 'w-full'}`}
                />
              </div>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || (!prompt.trim() && !imageBase64)}
            className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:opacity-90 disabled:opacity-40 text-white font-extrabold text-sm shadow-xl shadow-cyan-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{t.generating}</span>
              </>
            ) : (
              <>
                <Video className="w-4 h-4" />
                <span>{t.generateBtn}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
