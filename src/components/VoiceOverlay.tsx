import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, SkipForward, X, Settings2, Volume2 } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { Mascot } from './Mascot';

interface VoiceOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onSendTranscript: (text: string) => void;
  isAiBusy: boolean;
  lastAssistantText?: string;
}

export const VoiceOverlay: React.FC<VoiceOverlayProps> = ({
  isOpen,
  onClose,
  lang,
  onSendTranscript,
  isAiBusy,
  lastAssistantText,
}) => {
  const t = TRANSLATIONS[lang]?.voice || TRANSLATIONS.en.voice;
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechRate, setSpeechRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (!isOpen) return;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = { tr: 'tr-TR', en: 'en-US', de: 'de-DE', es: 'es-ES' }[lang] || 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => {
        setIsListening(false);
        // Restart if still open and not muted
        if (isOpen && !isMuted) {
          try {
            recognition.start();
          } catch {}
        }
      };

      recognition.onresult = (event: any) => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentText += event.results[i][0].transcript;
        }
        setTranscript(currentText);

        // Commit speech if final
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal && currentText.trim()) {
          onSendTranscript(currentText.trim());
          setTranscript('');
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Speech recognition start failed:', err);
    }

    return () => {
      try {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      } catch {}
    };
  }, [isOpen, lang, isMuted]);

  // Read aloud assistant reply
  useEffect(() => {
    if (!isOpen || !lastAssistantText || !('speechSynthesis' in window)) return;

    speechSynthesis.cancel();
    const clean = lastAssistantText
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/[*_#`|]/g, '')
      .slice(0, 400);

    const u = new SpeechSynthesisUtterance(clean);
    u.lang = { tr: 'tr-TR', en: 'en-US', de: 'de-DE', es: 'es-ES' }[lang] || 'en-US';
    u.rate = speechRate;
    speechSynthesis.speak(u);
  }, [lastAssistantText, isOpen]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
  };

  const skipSpeaking = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 bg-black/85 backdrop-blur-2xl anim-pop">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between max-w-md">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          title="Voice Settings"
        >
          <Settings2 className="w-5 h-5" />
        </button>
        <span className="font-bold text-sm tracking-widest text-[var(--mu)] uppercase">
          {t.voiceChat}
        </span>
        <button
          onClick={() => {
            skipSpeaking();
            onClose();
          }}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          title={t.close}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Settings Dropdown */}
      {showSettings && (
        <div className="p-4 rounded-2xl bg-[var(--in)] border border-[var(--bd)] text-xs text-[var(--tx)] w-full max-w-xs space-y-3 anim-pop shadow-2xl">
          <div>
            <label className="block mb-1 text-[var(--mu)]">{t.rate}: {speechRate}x</label>
            <input
              type="range"
              min="0.75"
              max="1.5"
              step="0.05"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="w-full accent-[var(--ac)]"
            />
          </div>
        </div>
      )}

      {/* Pulsing Visualizer Center */}
      <div className="flex flex-col items-center justify-center text-center my-auto">
        <div className="relative flex items-center justify-center w-52 h-52">
          {/* Animated Glow Rings */}
          <div
            className={`absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-500/30 to-purple-500/30 blur-2xl transition-all duration-700 ${
              isAiBusy ? 'scale-125 animate-pulse' : isListening ? 'scale-110' : 'scale-90'
            }`}
          />
          <div className="relative z-10 p-6 rounded-full bg-black/40 border border-white/10 shadow-2xl">
            <Mascot size="hero" isBusy={isAiBusy} interactive={false} />
          </div>
        </div>

        {/* Status text */}
        <div className="mt-8">
          <h3 className="text-xl font-bold brand-font text-white mb-2">
            {isAiBusy
              ? t.thinking
              : isMuted
              ? 'Mikrofon Kapalı'
              : transcript
              ? transcript
              : t.listening}
          </h3>
          <p className="text-xs text-[var(--mu)] max-w-xs mx-auto">
            Konuşarak oyun fikri sorabilir veya kodları tartışabilirsiniz.
          </p>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleMute}
          className={`p-4 rounded-full transition-all shadow-lg ${
            isMuted
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'bg-[var(--acg)] text-white hover:scale-105'
          }`}
          title={isMuted ? t.unmute : t.mute}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        <button
          onClick={skipSpeaking}
          className="p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all shadow-lg hover:scale-105"
          title={t.skip}
        >
          <SkipForward className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
