import React, { useState, useRef, useEffect } from 'react';
import { X, Music, Play, Pause, Download, Sparkles, RefreshCw, Volume2, AlertCircle, Image as ImageIcon, Disc } from 'lucide-react';
import { Language } from '../types';

interface MusicStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const MusicStudioModal: React.FC<MusicStudioModalProps> = ({ isOpen, onClose, lang }) => {
  const [model, setModel] = useState<'lyria-3-clip-preview' | 'lyria-3-pro-preview'>('lyria-3-clip-preview');
  const [prompt, setPrompt] = useState('');
  const [genre, setGenre] = useState('synthwave');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = {
    tr: {
      title: 'Müzik Üretim Stüdyosu (Lyria 3)',
      subtitle: 'Google Lyria modelleriyle metin veya görselden özgün müzik üretin.',
      clipModel: 'Lyria 3 Clip (30s Kısa Klip)',
      proModel: 'Lyria 3 Pro (Tam Parça)',
      promptPlaceholder: 'Müziğin tarzını, enstrümanlarını, ritmini ve hissini tarif edin…',
      generateBtn: 'Müziği Üret',
      generating: 'Lyria müzik akışı oluşturuyor…',
      addInspirationImage: 'İlham Görseli Ekle',
      lyricsLabel: 'Üretilen Şarkı Sözleri / Yapı:',
      downloadWav: 'WAV İndir',
      genres: [
        { id: 'synthwave', label: 'Synthwave 80s', prompt: '80s retro synthwave, analog synthesizers, driving electro beat, neon night drive vibe.' },
        { id: 'orchestral', label: 'Sinematik Orkestra', prompt: 'Epic cinematic orchestral composition, brass crescendos, sweeping violins, heroic climax.' },
        { id: 'lofi', label: 'Lo-Fi Chill Hop', prompt: 'Cozy lo-fi hip hop, mellow electric piano, vinyl crackle, relaxed downtempo rhythm.' },
        { id: 'cyberpunk', label: 'Siberpunk EDM', prompt: 'Dark energetic cyberpunk electronic, heavy distorted sub-bass, fast futuristic synthesizers.' },
        { id: 'acoustic', label: 'Akustik Melodi', prompt: 'Warm acoustic fingerstyle guitar, gentle melodic phrasing, calming ambient atmosphere.' },
      ],
      notice: 'Lyria 3 müzik modelleri ücretli API anahtarı veya kota gerektirebilir.',
      close: 'Kapat',
    },
    en: {
      title: 'Music Generation Studio (Lyria 3)',
      subtitle: 'Compose original music from text or images with Google Lyria models.',
      clipModel: 'Lyria 3 Clip (30s Short Clip)',
      proModel: 'Lyria 3 Pro (Full Track)',
      promptPlaceholder: 'Describe the musical genre, instruments, rhythm, and mood…',
      generateBtn: 'Generate Music',
      generating: 'Lyria is composing audio stream…',
      addInspirationImage: 'Add Inspiration Image',
      lyricsLabel: 'Generated Lyrics / Structure:',
      downloadWav: 'Download WAV',
      genres: [
        { id: 'synthwave', label: 'Synthwave 80s', prompt: '80s retro synthwave, analog synthesizers, driving electro beat, neon night drive vibe.' },
        { id: 'orchestral', label: 'Cinematic Orchestral', prompt: 'Epic cinematic orchestral composition, brass crescendos, sweeping violins, heroic climax.' },
        { id: 'lofi', label: 'Lo-Fi Chill Hop', prompt: 'Cozy lo-fi hip hop, mellow electric piano, vinyl crackle, relaxed downtempo rhythm.' },
        { id: 'cyberpunk', label: 'Cyberpunk EDM', prompt: 'Dark energetic cyberpunk electronic, heavy distorted sub-bass, fast futuristic synthesizers.' },
        { id: 'acoustic', label: 'Acoustic Melody', prompt: 'Warm acoustic fingerstyle guitar, gentle melodic phrasing, calming ambient atmosphere.' },
      ],
      notice: 'Lyria 3 models may require a billing-enabled project / paid API key.',
      close: 'Close',
    },
    de: {
      title: 'Musik-Studio (Lyria 3)',
      subtitle: 'Komponieren Sie Musik mit Google Lyria Modellen.',
      clipModel: 'Lyria 3 Clip (30s Clip)',
      proModel: 'Lyria 3 Pro (Ganzer Track)',
      promptPlaceholder: 'Beschreiben Sie Musikstil, Instrumente und Rhythmus…',
      generateBtn: 'Musik generieren',
      generating: 'Lyria komponiert Audio…',
      addInspirationImage: 'Bild hinzufügen',
      lyricsLabel: 'Songtext / Struktur:',
      downloadWav: 'WAV herunterladen',
      genres: [
        { id: 'synthwave', label: 'Synthwave 80s', prompt: '80s retro synthwave, analog synthesizers, driving electro beat.' },
        { id: 'orchestral', label: 'Orchester', prompt: 'Epic orchestral composition, sweeping violins.' },
        { id: 'lofi', label: 'Lo-Fi Chill', prompt: 'Cozy lo-fi hip hop, mellow piano.' },
        { id: 'cyberpunk', label: 'Cyberpunk EDM', prompt: 'Energetic cyberpunk electronic, heavy bass.' },
        { id: 'acoustic', label: 'Akustik', prompt: 'Warm acoustic guitar melody.' },
      ],
      notice: 'Lyria 3 benötigt möglicherweise ein kostenpflichtiges Gemini-Projekt.',
      close: 'Schließen',
    },
    es: {
      title: 'Estudio de Música (Lyria 3)',
      subtitle: 'Compón música original a partir de texto o imágenes con Lyria.',
      clipModel: 'Lyria 3 Clip (30s Clip Corto)',
      proModel: 'Lyria 3 Pro (Pista Completa)',
      promptPlaceholder: 'Describe el género, instrumentos, ritmo y ambiente…',
      generateBtn: 'Generar Música',
      generating: 'Lyria está componiendo el audio…',
      addInspirationImage: 'Añadir Imagen',
      lyricsLabel: 'Letra / Estructura Generada:',
      downloadWav: 'Descargar WAV',
      genres: [
        { id: 'synthwave', label: 'Synthwave 80s', prompt: '80s retro synthwave, analog synthesizers, driving electro beat.' },
        { id: 'orchestral', label: 'Orquesta Cinemática', prompt: 'Epic orchestral composition, sweeping violins.' },
        { id: 'lofi', label: 'Lo-Fi Chill', prompt: 'Cozy lo-fi hip hop, mellow piano.' },
        { id: 'cyberpunk', label: 'Cyberpunk EDM', prompt: 'Energetic cyberpunk electronic, heavy bass.' },
        { id: 'acoustic', label: 'Acústico', prompt: 'Warm acoustic guitar melody.' },
      ],
      notice: 'Los modelos Lyria 3 pueden requerir una clave de API de pago.',
      close: 'Cerrar',
    },
  }[lang] || {
    title: 'Music Generation Studio (Lyria 3)',
    subtitle: 'Compose original music from text or images with Google Lyria models.',
    clipModel: 'Lyria 3 Clip (30s Short Clip)',
    proModel: 'Lyria 3 Pro (Full Track)',
    promptPlaceholder: 'Describe the musical genre, instruments, rhythm, and mood…',
    generateBtn: 'Generate Music',
    generating: 'Lyria is composing audio stream…',
    addInspirationImage: 'Add Inspiration Image',
    lyricsLabel: 'Generated Lyrics / Structure:',
    downloadWav: 'Download WAV',
    genres: [
      { id: 'synthwave', label: 'Synthwave 80s', prompt: '80s retro synthwave, analog synthesizers, driving electro beat, neon night drive vibe.' },
      { id: 'orchestral', label: 'Cinematic Orchestral', prompt: 'Epic cinematic orchestral composition, brass crescendos, sweeping violins, heroic climax.' },
      { id: 'lofi', label: 'Lo-Fi Chill Hop', prompt: 'Cozy lo-fi hip hop, mellow electric piano, vinyl crackle, relaxed downtempo rhythm.' },
      { id: 'cyberpunk', label: 'Cyberpunk EDM', prompt: 'Dark energetic cyberpunk electronic, heavy distorted sub-bass, fast futuristic synthesizers.' },
      { id: 'acoustic', label: 'Acoustic Melody', prompt: 'Warm acoustic fingerstyle guitar, gentle melodic phrasing, calming ambient atmosphere.' },
    ],
    notice: 'Lyria 3 models may require a billing-enabled project / paid API key.',
    close: 'Close',
  };

  const handleSelectGenre = (g: any) => {
    setGenre(g.id);
    setPrompt(g.prompt);
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
    setLyrics(null);

    try {
      const res = await fetch('/api/music/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt || 'Generate a melodious musical track.',
          model,
          imageBase64,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Music generation request failed.');
      }

      if (data.audio) {
        // Convert base64 into Blob URL
        const binary = atob(data.audio);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: data.mimeType || 'audio/wav' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setLyrics(data.lyrics || null);
      }
    } catch (err: any) {
      console.error('Music generation error:', err);
      setError(err?.message || 'Music generation error occurred.');
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto anim-pop">
      <div className="bg-[#10121a] border border-white/15 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col my-auto text-white">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Music className="w-5 h-5 text-white" />
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
          {/* Model Selector */}
          <div className="flex gap-2 p-1 bg-black/40 rounded-2xl border border-white/10">
            <button
              onClick={() => setModel('lyria-3-clip-preview')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                model === 'lyria-3-clip-preview'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Disc className="w-3.5 h-3.5" />
              <span>{t.clipModel}</span>
            </button>
            <button
              onClick={() => setModel('lyria-3-pro-preview')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                model === 'lyria-3-pro-preview'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.proModel}</span>
            </button>
          </div>

          {/* Quick Genre Presets */}
          <div>
            <label className="text-[11px] font-bold text-white/60 mb-1.5 block uppercase tracking-wider">
              Hazır Müzik Türleri / Presets:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {t.genres.map((g) => (
                <button
                  key={g.id}
                  onClick={() => handleSelectGenre(g)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    genre === g.id
                      ? 'bg-purple-500/20 border-purple-400 text-purple-200'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {g.label}
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
              className="w-full bg-black/40 border border-white/15 rounded-2xl p-3.5 text-xs md:text-sm text-white placeholder-white/40 focus:outline-none focus:border-purple-400 transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* Optional Image Upload for visual-to-audio inspiration */}
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
              <ImageIcon className="w-4 h-4 text-purple-400" />
              <span>{t.addInspirationImage}</span>
            </button>

            {imagePreview && (
              <div className="relative flex items-center gap-2 bg-black/40 px-2 py-1 rounded-xl border border-white/10">
                <img src={imagePreview} alt="Inspiration" className="w-6 h-6 object-cover rounded-lg" />
                <span className="text-[11px] text-white/70">Görsel eklendi</span>
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

          {/* Generated Audio Player */}
          {audioUrl && (
            <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-3 anim-pop">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={togglePlay}
                    className="w-10 h-10 rounded-2xl bg-purple-500 hover:bg-purple-400 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
                  </button>
                  <div>
                    <span className="text-xs font-bold text-white block">Lyria 3 Audio Stream</span>
                    <span className="text-[10px] text-purple-300">WAV • Yüksek Kalite PBR Synth</span>
                  </div>
                </div>

                <a
                  href={audioUrl}
                  download={`lyria_${Date.now()}.wav`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t.downloadWav}</span>
                </a>
              </div>

              <audio
                ref={audioRef}
                src={audioUrl}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                className="w-full h-8"
                controls
              />

              {lyrics && (
                <div className="pt-2 border-t border-purple-500/20 text-xs text-purple-200/90 whitespace-pre-wrap leading-relaxed">
                  <span className="font-bold block mb-1 text-purple-300">{t.lyricsLabel}</span>
                  {lyrics}
                </div>
              )}
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || (!prompt.trim() && !imageBase64)}
            className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:opacity-90 disabled:opacity-40 text-white font-extrabold text-sm shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{t.generating}</span>
              </>
            ) : (
              <>
                <Music className="w-4 h-4" />
                <span>{t.generateBtn}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
