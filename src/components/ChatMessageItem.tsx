import React, { useState } from 'react';
import {
  Copy,
  Check,
  Play,
  Volume2,
  BookmarkPlus,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Edit2,
  Download,
  Eye,
  EyeOff,
  FileCode,
  FileImage,
  FileText,
} from 'lucide-react';
import { ChatMessage, Language } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface ChatMessageItemProps {
  message: ChatMessage;
  lang: Language;
  onRunInStudio: (code: string) => void;
  onPinToProject: (text: string) => void;
  onRegenerate: () => void;
  onEditUserMessage: (content: string) => void;
  onVote: (vote: 1 | -1, comment?: string) => void;
  isLastAssistant?: boolean;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  lang,
  onRunInStudio,
  onPinToProject,
  onRegenerate,
  onEditUserMessage,
  onVote,
  isLastAssistant = false,
}) => {
  const common = (TRANSLATIONS[lang] || TRANSLATIONS.en).common;
  const isUser = message.role === 'user';
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showSvgCode, setShowSvgCode] = useState<Record<number, boolean>>({});
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleCopy = async (code: string, index: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSpeak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const cleanText = text
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/[*_`#|]/g, '')
      .slice(0, 800);

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = { tr: 'tr-TR', en: 'en-US', de: 'de-DE', es: 'es-ES' }[lang] || 'en-US';
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    speechSynthesis.speak(utterance);
  };

  const handleDownloadSvg = (svgCode: string) => {
    const blob = new Blob([svgCode], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pixel-art.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Render markdown and interactive code/SVG blocks
  const renderContent = (rawText: string) => {
    const parts = rawText.split(/```/);

    return parts.map((part, index) => {
      // Normal text outside code fences
      if (index % 2 === 0) {
        if (!part.trim()) return null;
        return (
          <div key={index} className="text-sm md:text-[15px] leading-relaxed whitespace-pre-wrap space-y-2">
            {part.split('\n\n').map((paragraph, pIdx) => {
              // Parse simple headers
              if (paragraph.startsWith('### ')) {
                return (
                  <h4 key={pIdx} className="text-base font-bold text-[var(--ac)] mt-3 mb-1">
                    {paragraph.replace('### ', '')}
                  </h4>
                );
              }
              if (paragraph.startsWith('## ')) {
                return (
                  <h3 key={pIdx} className="text-lg font-bold text-[var(--tx)] mt-4 mb-1">
                    {paragraph.replace('## ', '')}
                  </h3>
                );
              }
              if (paragraph.startsWith('# ')) {
                return (
                  <h2 key={pIdx} className="text-xl font-extrabold text-[var(--tx)] mt-4 mb-2 brand-font">
                    {paragraph.replace('# ', '')}
                  </h2>
                );
              }
              return (
                <p key={pIdx} className="leading-relaxed">
                  {paragraph}
                </p>
              );
            })}
          </div>
        );
      }

      // Fenced Code Block
      const newlineIndex = part.indexOf('\n');
      const language = (newlineIndex < 0 ? part : part.slice(0, newlineIndex)).trim().toLowerCase();
      const code = newlineIndex < 0 ? '' : part.slice(newlineIndex + 1).replace(/\n$/, '');

      const isSvg = language === 'svg' || (code.trim().startsWith('<svg') && code.trim().endsWith('</svg>'));
      const isPlayableHtml = language === 'html' || /<!doctype html|<canvas|function loop\(/i.test(code);

      // Special Renderer for SVG Pixel Art
      if (isSvg) {
        const isCodeVisible = showSvgCode[index] || false;
        return (
          <div key={index} className="my-3 p-3 rounded-2xl bg-[var(--cd)] border border-[var(--bd)] shadow-lg">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-[var(--bd)]">
              <span className="text-xs font-semibold text-[var(--ac)] flex items-center gap-1.5">
                <FileImage className="w-3.5 h-3.5" />
                Pixel Art SVG Sprite
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowSvgCode((prev) => ({ ...prev, [index]: !isCodeVisible }))}
                  className="px-2 py-1 text-xs text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--hv)] rounded-lg transition-colors flex items-center gap-1"
                >
                  {isCodeVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{isCodeVisible ? 'Kodu Gizle' : 'Kodu Gör'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadSvg(code)}
                  className="px-2.5 py-1 text-xs font-medium text-white bg-[var(--acg)] rounded-lg hover:opacity-90 flex items-center gap-1 transition-all"
                >
                  <Download className="w-3 h-3" />
                  <span>SVG İndir</span>
                </button>
              </div>
            </div>

            {/* Crisp SVG Render Container */}
            <div className="p-4 bg-black/60 rounded-xl flex items-center justify-center overflow-hidden border border-white/5">
              <div
                className="max-w-[260px] max-h-[260px] drop-shadow-[0_4px_16px_rgba(16,163,127,0.3)]"
                dangerouslySetInnerHTML={{ __html: code }}
              />
            </div>

            {/* Optional SVG Code View */}
            {isCodeVisible && (
              <pre className="mt-2 p-3 rounded-xl bg-black/80 text-emerald-400 font-mono text-xs overflow-x-auto max-h-48 border border-white/10">
                {code}
              </pre>
            )}
          </div>
        );
      }

      // Standard Code Block
      return (
        <div key={index} className="my-3 rounded-xl overflow-hidden border border-[var(--bd)] bg-[#090a10] shadow-md">
          {/* Code Header */}
          <div className="flex items-center justify-between px-3.5 py-1.5 bg-[var(--sb)]/70 text-xs text-[var(--mu)] border-b border-[var(--bd)]">
            <span className="font-mono uppercase font-semibold text-[11px] text-[var(--ac)] flex items-center gap-1">
              <FileCode className="w-3.5 h-3.5" />
              {language || 'code'}
            </span>
            <div className="flex items-center gap-1.5">
              {/* Run in studio button for HTML/Game code */}
              {isPlayableHtml && (
                <button
                  type="button"
                  onClick={() => onRunInStudio(code)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-sm flex items-center gap-1 transition-all"
                  title={common.runInStudioTitle}
                >
                  <Play className="w-3 h-3" />
                  <span>{common.runInStudio}</span>
                </button>
              )}

              {/* Copy code button */}
              <button
                type="button"
                onClick={() => handleCopy(code, index)}
                className="px-2 py-1 rounded-md text-xs hover:bg-[var(--hv)] hover:text-[var(--tx)] transition-colors flex items-center gap-1"
                title={common.copy}
              >
                {copiedIndex === index ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">{common.copied}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{common.copy}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Code Text */}
          <pre className="p-4 font-mono text-xs md:text-sm text-gray-200 overflow-x-auto leading-relaxed">
            <code>{code}</code>
          </pre>
        </div>
      );
    });
  };

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} anim-pop group`}>
      {/* Attached Files for User */}
      {isUser && message.files && message.files.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 justify-end max-w-[85%]">
          {message.files.map((file, fIdx) => (
            <div
              key={fIdx}
              className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl bg-[var(--in)] border border-[var(--bd)] text-[var(--tx)] shadow-xs"
            >
              {file.kind === 'image' && file.data ? (
                <div className="flex items-center gap-2">
                  <img
                    src={`data:${file.mt || 'image/png'};base64,${file.data}`}
                    alt={file.name}
                    className="w-7 h-7 rounded-lg object-cover border border-[var(--bd)]"
                  />
                  <div className="flex flex-col text-left">
                    <span className="font-medium max-w-[140px] truncate">{file.name}</span>
                    <span className="text-[10px] text-[var(--mu)]">
                      {file.size ? `${(file.size / 1024).toFixed(1)} KB` : ''} • {common.imageAnalyzed}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {file.name.match(/\.(js|ts|tsx|jsx|html|css|json|py|cs|cpp|php)$/i) ? (
                    <FileCode className="w-4 h-4 text-[var(--ac)]" />
                  ) : (
                    <FileText className="w-4 h-4 text-[var(--ac)]" />
                  )}
                  <div className="flex flex-col text-left">
                    <span className="font-medium max-w-[140px] truncate">{file.name}</span>
                    <span className="text-[10px] text-[var(--mu)]">
                      {file.size ? `${(file.size / 1024).toFixed(1)} KB` : ''} • {common.docAnalyzed}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Message Bubble */}
      <div
        className={`relative max-w-[88%] md:max-w-[80%] rounded-2xl p-4 shadow-sm ${
          isUser
            ? 'bg-[var(--acg)] text-white shadow-emerald-950/20 rounded-tr-sm'
            : 'bg-[var(--gl)] text-[var(--tx)] border border-[var(--gb)] backdrop-blur-md rounded-tl-sm'
        }`}
      >
        {/* User edit button */}
        {isUser && (
          <button
            type="button"
            onClick={() => onEditUserMessage(message.content)}
            className="absolute -left-8 top-3 p-1.5 text-[var(--mu)] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
            title={common.editMessage}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Message Content */}
        {renderContent(message.content)}

        {/* Assistant Action Bar */}
        {!isUser && (
          <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-[var(--bd)] text-xs text-[var(--mu)]">
            {/* Feedback Thumbs */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onVote(1)}
                className={`p-1 rounded-md hover:bg-[var(--hv)] hover:text-emerald-400 transition-colors ${
                  message.vote === 1 ? 'text-emerald-400 bg-emerald-500/10' : ''
                }`}
                title={common.helpful}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const reason = prompt(common.improvePrompt);
                  onVote(-1, reason || undefined);
                }}
                className={`p-1 rounded-md hover:bg-[var(--hv)] hover:text-red-400 transition-colors ${
                  message.vote === -1 ? 'text-red-400 bg-red-500/10' : ''
                }`}
                title={common.improve}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>

            <span className="w-px h-3.5 bg-[var(--bd)] mx-0.5" />

            {/* Read aloud */}
            <button
              type="button"
              onClick={() => handleSpeak(message.content)}
              className={`p-1 rounded-md hover:bg-[var(--hv)] hover:text-[var(--tx)] transition-colors flex items-center gap-1 ${
                isSpeaking ? 'text-[var(--ac)] animate-pulse' : ''
              }`}
              title={common.readAloud}
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>

            {/* Pin to Project */}
            <button
              type="button"
              onClick={() => onPinToProject(message.content)}
              className="p-1 rounded-md hover:bg-[var(--hv)] hover:text-[var(--tx)] transition-colors flex items-center gap-1"
              title={common.pinToProject}
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
            </button>

            {/* Regenerate if last */}
            {isLastAssistant && (
              <button
                type="button"
                onClick={onRegenerate}
                className="p-1 rounded-md hover:bg-[var(--hv)] hover:text-[var(--tx)] transition-colors flex items-center gap-1"
                title={common.regenerate}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
