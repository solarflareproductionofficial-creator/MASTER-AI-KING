import React, { useState } from 'react';
import { X, MapPin, Navigation, Search, RefreshCw, ExternalLink, Compass, Star } from 'lucide-react';
import { Language } from '../types';

interface MapsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onSendToChat?: (text: string) => void;
}

export const MapsModal: React.FC<MapsModalProps> = ({ isOpen, onClose, lang, onSendToChat }) => {
  const [query, setQuery] = useState('');
  const [userLocation, setUserLocation] = useState('İstanbul, Türkiye');
  const [isSearching, setIsSearching] = useState(false);
  const [resultsText, setResultsText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const t = {
    tr: {
      title: 'Google Maps Konum & Yer Rehberi',
      subtitle: 'Gemini 3.8 Flash Maps Grounding ile gerçek mekanlar, yol tarifleri ve koordinatlar.',
      locationPlaceholder: 'Şehir veya konumunuz (örn. Kadıköy, İstanbul)…',
      queryPlaceholder: 'Ne arıyorsunuz? (örn. Yakınlardaki en iyi 3 kahveci, Taksim\'e nasıl giderim?)…',
      searchBtn: 'Haritada Ara',
      searching: 'Google Maps verileri taranıyor…',
      quickSuggestions: [
        '☕ En iyi kahveciler ve çalışma kafeleri',
        '🍽️ Popüler yöresel lezzet restoranları',
        '🏛️ Tarihi mekanlar ve gezilecek yerler',
        '⚡ En yakın elektrikli araç şarj istasyonları',
      ],
      openInGoogleMaps: 'Google Haritalar\'da Aç',
      sendToChat: 'Sohbete Aktar',
      close: 'Kapat',
    },
    en: {
      title: 'Google Maps Place & Navigation Guide',
      subtitle: 'Real-world places, directions, and coordinates grounded with Gemini 3.8 Flash Maps.',
      locationPlaceholder: 'City or current location (e.g. Manhattan, New York)…',
      queryPlaceholder: 'What are you looking for? (e.g. Best coffee shops nearby, directions to Central Park)…',
      searchBtn: 'Search Maps',
      searching: 'Querying Google Maps data…',
      quickSuggestions: [
        '☕ Best specialty coffee shops with wifi',
        '🍽️ Top-rated local dining & restaurants',
        '🏛️ Historic landmarks and must-see sights',
        '⚡ Nearest EV fast charging stations',
      ],
      openInGoogleMaps: 'Open in Google Maps',
      sendToChat: 'Send to Chat',
      close: 'Close',
    },
    de: {
      title: 'Google Maps Reiseführer',
      subtitle: 'Echte Orte und Wegbeschreibungen mit Gemini 3.8 Flash.',
      locationPlaceholder: 'Stadt oder Standort (z.B. Berlin)…',
      queryPlaceholder: 'Wonach suchen Sie? (z.B. Beste Cafés in der Nähe)…',
      searchBtn: 'In Maps suchen',
      searching: 'Google Maps Daten abfragen…',
      quickSuggestions: [
        '☕ Beste Cafés zum Arbeiten',
        '🍽️ Beliebte Restaurants in der Nähe',
        '🏛️ Sehenswürdigkeiten & Denkmäler',
      ],
      openInGoogleMaps: 'In Google Maps öffnen',
      sendToChat: 'In Chat senden',
      close: 'Schließen',
    },
    es: {
      title: 'Guía de Lugares Google Maps',
      subtitle: 'Lugares reales y direcciones con Gemini 3.8 Flash.',
      locationPlaceholder: 'Ciudad o ubicación (ej. Madrid)…',
      queryPlaceholder: '¿Qué estás buscando? (ej. Mejores cafeterías cerca)…',
      searchBtn: 'Buscar en Maps',
      searching: 'Consultando datos de Google Maps…',
      quickSuggestions: [
        '☕ Mejores cafeterías con wifi',
        '🍽️ Restaurantes locales populares',
        '🏛️ Lugares históricos y turísticos',
      ],
      openInGoogleMaps: 'Abrir en Google Maps',
      sendToChat: 'Enviar al Chat',
      close: 'Cerrar',
    },
  }[lang] || {
    title: 'Google Maps Place & Navigation Guide',
    subtitle: 'Real-world places, directions, and coordinates grounded with Gemini 3.8 Flash Maps.',
    locationPlaceholder: 'City or current location (e.g. Manhattan, New York)…',
    queryPlaceholder: 'What are you looking for? (e.g. Best coffee shops nearby, directions to Central Park)…',
    searchBtn: 'Search Maps',
    searching: 'Querying Google Maps data…',
    quickSuggestions: [
      '☕ Best specialty coffee shops with wifi',
      '🍽️ Top-rated local dining & restaurants',
      '🏛️ Historic landmarks and must-see sights',
      '⚡ Nearest EV fast charging stations',
    ],
    openInGoogleMaps: 'Open in Google Maps',
    sendToChat: 'Send to Chat',
    close: 'Close',
  };

  const handleSearch = async (targetQuery?: string) => {
    const q = targetQuery || query;
    if (!q.trim()) return;
    setIsSearching(true);
    setError(null);
    setResultsText(null);

    try {
      const res = await fetch('/api/maps/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          location: userLocation,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Maps request failed');
      }

      setResultsText(data.text);
    } catch (err: any) {
      console.error('Maps search error:', err);
      setError(err?.message || 'Maps query error occurred.');
    } finally {
      setIsSearching(false);
    }
  };

  if (!isOpen) return null;

  const mapsQueryUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    query ? `${query} ${userLocation}` : userLocation
  )}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto anim-pop">
      <div className="bg-[#0e121a] border border-white/15 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col my-auto text-white">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <MapPin className="w-5 h-5 text-white" />
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
          {/* Location row */}
          <div className="flex items-center gap-2 bg-black/40 px-3.5 py-2.5 rounded-2xl border border-white/10 text-xs">
            <Compass className="w-4 h-4 text-emerald-400 shrink-0" />
            <input
              type="text"
              value={userLocation}
              onChange={(e) => setUserLocation(e.target.value)}
              placeholder={t.locationPlaceholder}
              className="bg-transparent border-0 outline-none flex-1 text-white placeholder-white/40"
            />
          </div>

          {/* Quick Suggestions */}
          <div className="flex flex-wrap gap-1.5">
            {t.quickSuggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(s);
                  handleSearch(s);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Search Query Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
              placeholder={t.queryPlaceholder}
              className="flex-1 bg-black/40 border border-white/15 rounded-2xl px-4 py-3 text-xs md:text-sm text-white placeholder-white/40 focus:outline-none focus:border-emerald-400 transition-colors"
            />
            <button
              onClick={() => handleSearch()}
              disabled={isSearching || !query.trim()}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 disabled:opacity-40 text-black font-extrabold text-xs md:text-sm shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all shrink-0 active:scale-95"
            >
              {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>{t.searchBtn}</span>
            </button>
          </div>

          {/* Search Results Display */}
          {resultsText && (
            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3 anim-pop max-h-72 overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20 text-xs">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Google Maps Grounding Verileri</span>
                </span>
                <div className="flex gap-2">
                  {onSendToChat && (
                    <button
                      onClick={() => {
                        onSendToChat(resultsText);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-semibold text-white transition-colors"
                    >
                      {t.sendToChat}
                    </button>
                  )}
                  <a
                    href={mapsQueryUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-[11px] font-bold text-emerald-300 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>{t.openInGoogleMaps}</span>
                  </a>
                </div>
              </div>

              <div className="text-xs md:text-sm text-white/90 whitespace-pre-wrap leading-relaxed">
                {resultsText}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
