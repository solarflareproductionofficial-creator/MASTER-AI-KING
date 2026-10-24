import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Code2,
  Grid,
  Maximize2,
  Download,
  X,
  Wrench,
  Send,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { GAME_TEMPLATES } from '../data/templates';
import { formatWithEmojiPreference } from '../utils/emoji';

interface StudioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  onCodeChange: (newCode: string) => void;
  lang: Language;
  onAskAiToModify: (prompt: string, code: string, errors: string[]) => void;
  isAiModifying?: boolean;
  allowEmojis?: boolean;
}

const ERROR_CAPTURE_HOOK = `
<script>
(function() {
  function sendLog(type, msg) {
    try {
      parent.postMessage({ masterai: 1, type: type, message: String(msg).slice(0, 350) }, '*');
    } catch(e) {}
  }
  window.addEventListener('error', function(e) {
    sendLog('error', (e.message || 'Script error') + (e.lineno ? ' (Line ' + e.lineno + ')' : ''));
  });
  window.addEventListener('unhandledrejection', function(e) {
    sendLog('error', 'Unhandled Promise: ' + (e.reason && e.reason.message || e.reason));
  });
  var origErr = console.error;
  console.error = function() {
    sendLog('console', [].join.call(arguments, ' '));
    origErr.apply(console, arguments);
  };
})();
</script>
`;

function injectHook(htmlCode: string): string {
  if (/<head[^>]*>/i.test(htmlCode)) {
    return htmlCode.replace(/<head[^>]*>/i, (m) => m + ERROR_CAPTURE_HOOK);
  }
  if (/<html[^>]*>/i.test(htmlCode)) {
    return htmlCode.replace(/<html[^>]*>/i, (m) => m + '<head>' + ERROR_CAPTURE_HOOK + '</head>');
  }
  return '<!doctype html><html><head><meta charset="utf-8">' + ERROR_CAPTURE_HOOK + '</head><body>' + htmlCode + '</body></html>';
}

export const StudioDrawer: React.FC<StudioDrawerProps> = ({
  isOpen,
  onClose,
  code,
  onCodeChange,
  lang,
  onAskAiToModify,
  isAiModifying = false,
  allowEmojis = true,
}) => {
  const t = TRANSLATIONS[lang]?.studio || TRANSLATIONS.en.studio;
  const [tab, setTab] = useState<'preview' | 'code' | 'templates'>('preview');
  const [errors, setErrors] = useState<string[]>([]);
  const [promptInput, setPromptInput] = useState('');
  const [iframeSrcDoc, setIframeSrcDoc] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Run the current code inside the sandboxed iframe
  const runGame = () => {
    setErrors([]);
    setIframeSrcDoc(injectHook(code));
  };

  useEffect(() => {
    if (isOpen && code) {
      runGame();
    }
  }, [isOpen, code]);

  // Press ESC to close studio
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Listen to errors from child iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || event.data.masterai !== 1) return;
      const msg = event.data.message;
      if (msg) {
        setErrors((prev) => {
          if (prev.includes(msg) || prev.length >= 10) return prev;
          return [...prev, msg];
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'game.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFullscreen = () => {
    if (!iframeRef.current) return;
    if (iframeRef.current.requestFullscreen) {
      iframeRef.current.requestFullscreen();
    }
  };

  const handleFixWithAi = () => {
    onAskAiToModify(
      'Fix all runtime errors in this game and ensure smooth gameplay and controls.',
      code,
      errors
    );
  };

  const handleCustomPromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;
    onAskAiToModify(promptInput.trim(), code, errors);
    setPromptInput('');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Click-outside backdrop to close */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
        title="Kapatmak için dışarıya tıklayın (Esc)"
      />

      <section
        className={`fixed inset-y-0 right-0 z-50 flex flex-col bg-[var(--gl)] backdrop-blur-2xl border-l border-[var(--gb)] shadow-2xl transition-all duration-300 w-full md:w-[680px] lg:w-[760px]`}
      >
        {/* Studio Header */}
        <div className="flex items-center justify-between px-3 md:px-4 py-2.5 border-b border-[var(--gb)] bg-[var(--sb)]/80">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <h2 className="font-bold text-sm tracking-wide flex items-center gap-1.5 brand-font text-[var(--tx)] truncate">
              <Sparkles className="w-4 h-4 text-[var(--ac)] shrink-0" />
              <span>{formatWithEmojiPreference(t.title, allowEmojis)}</span>
            </h2>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Tab buttons */}
            <div className="flex bg-[var(--in)] p-0.5 rounded-lg border border-[var(--bd)]">
              <button
                onClick={() => setTab('preview')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md flex items-center gap-1 transition-colors ${
                  tab === 'preview'
                    ? 'bg-[var(--acg)] text-white shadow-sm'
                    : 'text-[var(--mu)] hover:text-[var(--tx)]'
                }`}
                title={t.preview}
              >
                <Play className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.preview}</span>
              </button>
              <button
                onClick={() => setTab('code')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md flex items-center gap-1 transition-colors ${
                  tab === 'code'
                    ? 'bg-[var(--acg)] text-white shadow-sm'
                    : 'text-[var(--mu)] hover:text-[var(--tx)]'
                }`}
                title={t.codeView}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.codeView}</span>
              </button>
              <button
                onClick={() => setTab('templates')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md flex items-center gap-1 transition-colors ${
                  tab === 'templates'
                    ? 'bg-[var(--acg)] text-white shadow-sm'
                    : 'text-[var(--mu)] hover:text-[var(--tx)]'
                }`}
                title={t.templates}
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.templates}</span>
              </button>
            </div>

            {/* Quick reload */}
            <button
              onClick={runGame}
              className="p-1.5 text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--hv)] rounded-lg transition-colors"
              title={t.run}
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={handleFullscreen}
              className="p-1.5 text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--hv)] rounded-lg transition-colors"
              title={t.fullscreen}
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Download */}
            <button
              onClick={handleDownload}
              className="p-1.5 text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--hv)] rounded-lg transition-colors"
              title={t.download}
            >
              <Download className="w-4 h-4" />
            </button>

            {/* HIGH-VISIBILITY CLOSE BUTTON */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:scale-95 rounded-xl transition-all shadow-md ml-1 cursor-pointer shrink-0 ring-1 ring-red-400/40"
              title={`${t.close} (Esc)`}
            >
              <X className="w-4 h-4 stroke-[3]" />
              <span>{t.close}</span>
            </button>
          </div>
        </div>

        {/* Main Studio Body */}
        <div className="relative flex-1 bg-[var(--cd)] overflow-hidden flex flex-col">
          {/* TAB 1: Preview Iframe */}
          <div className={`w-full h-full relative ${tab === 'preview' ? 'block' : 'hidden'}`}>
            <iframe
              ref={iframeRef}
              srcDoc={iframeSrcDoc}
              className="w-full h-full border-0 bg-black"
              sandbox="allow-scripts allow-pointer-lock allow-modals allow-forms allow-popups"
              title="Master AI Game Player"
            />
          </div>

          {/* TAB 2: Code Editor */}
          {tab === 'code' && (
            <div className="w-full h-full flex flex-col">
              <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--sb)] text-xs text-[var(--mu)] border-b border-[var(--gb)]">
                <span>game.html ({code.length} chars)</span>
                <button
                  onClick={() => {
                    runGame();
                    setTab('preview');
                  }}
                  className="px-2.5 py-0.5 rounded bg-[var(--acg)] text-white font-medium hover:opacity-90 flex items-center gap-1"
                >
                  <Play className="w-3 h-3" />
                  {t.run}
                </button>
              </div>
              <textarea
                value={code}
                onChange={(e) => onCodeChange(e.target.value)}
                spellCheck={false}
                className="flex-1 w-full p-4 bg-[#08080c] text-emerald-300 font-mono text-xs md:text-sm leading-relaxed resize-none focus:outline-none"
              />
            </div>
          )}

          {/* TAB 3: Templates Gallery */}
          {tab === 'templates' && (
            <div className="w-full h-full overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[var(--bg)]/90">
              {GAME_TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => {
                    onCodeChange(tmpl.code);
                    setTab('preview');
                  }}
                  className="p-3.5 rounded-xl border border-[var(--bd)] bg-[var(--gl)] hover:border-[var(--ac)] transition-all cursor-pointer group hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--ac)]/15 text-[var(--ac)] border border-[var(--ac)]/30">
                      {tmpl.badge}
                    </span>
                    <Play className="w-3.5 h-3.5 text-[var(--mu)] group-hover:text-[var(--ac)] transition-colors" />
                  </div>
                  <h3 className="font-semibold text-sm text-[var(--tx)] mb-1">
                    {formatWithEmojiPreference(tmpl.title[lang] || tmpl.title.en, allowEmojis)}
                  </h3>
                  <p className="text-xs text-[var(--mu)] leading-relaxed line-clamp-2">
                    {formatWithEmojiPreference(tmpl.desc[lang] || tmpl.desc.en, allowEmojis)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Runtime Errors Inspector Bar */}
        <div className="border-t border-[var(--gb)] bg-[var(--sb)]/80 px-3 py-2 text-xs">
          {errors.length > 0 ? (
            <div className="space-y-1 max-h-24 overflow-y-auto">
              <div className="flex items-center justify-between text-red-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {errors.length} {t.errorsFound}
                </span>
                <button
                  onClick={() => setErrors([])}
                  className="text-[10px] text-[var(--mu)] hover:text-[var(--tx)] underline"
                >
                  Temizle
                </button>
              </div>
              {errors.map((err, i) => (
                <div
                  key={i}
                  className="font-mono text-[11px] text-red-300 bg-red-950/40 p-1.5 rounded border border-red-500/20 truncate"
                  title={err}
                >
                  {err}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.noErrors}</span>
            </div>
          )}
        </div>

        {/* In-Studio Prompt & Quick Fix Bar */}
        <form
          onSubmit={handleCustomPromptSubmit}
          className="flex items-center gap-2 p-3 border-t border-[var(--gb)] bg-[var(--gl)]"
        >
          <button
            type="button"
            onClick={handleFixWithAi}
            disabled={isAiModifying}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md disabled:opacity-50 transition-all shrink-0"
            title="Detect errors and ask Gemini to fix the code"
          >
            <Wrench className={`w-3.5 h-3.5 ${isAiModifying ? 'animate-spin' : ''}`} />
            <span>{formatWithEmojiPreference(t.fixWithAi, allowEmojis)}</span>
          </button>

          <input
            type="text"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder={t.promptPlaceholder}
            disabled={isAiModifying}
            className="flex-1 min-w-0 px-3 py-2 bg-[var(--in)] border border-[var(--bd)] rounded-xl text-xs text-[var(--tx)] placeholder-[var(--mu)] focus:outline-none focus:border-[var(--ac)] transition-colors"
          />

          <button
            type="submit"
            disabled={!promptInput.trim() || isAiModifying}
            className="p-2 rounded-xl bg-[var(--acg)] text-white hover:opacity-90 disabled:opacity-40 transition-all shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </section>
    </>
  );
};
