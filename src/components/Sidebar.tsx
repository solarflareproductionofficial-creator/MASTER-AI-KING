import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Puzzle,
  FolderKanban,
  Settings,
  Shield,
  Search,
  X,
  MessageSquare,
  Edit2,
  Trash2,
  Globe,
  SunMoon,
  ChevronLeft,
  Smile,
  Ban,
} from 'lucide-react';
import { ChatSession, Language } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { formatWithEmojiPreference } from '../utils/emoji';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  chats: ChatSession[];
  currentChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onDeleteChat: (id: string) => void;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenCustomizer: () => void;
  onOpenPlugins: () => void;
  onOpenProjects: () => void;
  onOpenPrivacy: () => void;
  onToggleTheme: () => void;
  allowEmojis?: boolean;
  onToggleEmojis?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  chats,
  currentChatId,
  onSelectChat,
  onNewChat,
  onRenameChat,
  onDeleteChat,
  lang,
  onLanguageChange,
  onOpenCustomizer,
  onOpenPlugins,
  onOpenProjects,
  onOpenPrivacy,
  onToggleTheme,
  allowEmojis = true,
  onToggleEmojis,
}) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const [searchQuery, setSearchQuery] = useState('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global Ctrl+K / Cmd+K to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const trimmedQuery = searchQuery.trim().toLowerCase();

  const filteredChats = chats.filter((c) => {
    if (!trimmedQuery) return true;
    return (
      c.title.toLowerCase().includes(trimmedQuery) ||
      c.msgs.some((m) => m.content.toLowerCase().includes(trimmedQuery))
    );
  });

  const startRename = (id: string, currentTitle: string) => {
    setEditingChatId(id);
    setEditTitle(currentTitle);
  };

  const finishRename = (id: string) => {
    if (editTitle.trim()) {
      onRenameChat(id, editTitle.trim());
    }
    setEditingChatId(null);
  };

  const clearSearch = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 flex flex-col bg-[var(--gl)] backdrop-blur-xl border-r border-[var(--gb)] p-3 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2 pt-1 pb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-wider brand-font text-[var(--tx)]">
                MASTER <span className="text-[var(--ac)]">AI</span>
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--ac)]/20 text-[var(--ac)] uppercase tracking-wider">
                PRO
              </span>
            </div>
            <div className="text-[10px] font-bold tracking-widest text-[var(--mu)] uppercase">
              {t.studioTag}
            </div>
          </div>

          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--hv)]"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Action Buttons */}
        <div className="space-y-1.5 my-3">
          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[var(--acg)] text-white text-xs font-semibold shadow hover:opacity-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{formatWithEmojiPreference(t.newChat, allowEmojis)}</span>
          </button>

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              onClick={onOpenPlugins}
              className="flex items-center gap-1.5 py-2 px-2.5 rounded-lg bg-[var(--in)] hover:bg-[var(--hv)] text-xs text-[var(--tx)] border border-[var(--bd)] transition-colors"
            >
              <Puzzle className="w-3.5 h-3.5 text-[var(--ac)]" />
              <span className="truncate">{formatWithEmojiPreference(t.plugins, allowEmojis)}</span>
            </button>
            <button
              onClick={onOpenProjects}
              className="flex items-center gap-1.5 py-2 px-2.5 rounded-lg bg-[var(--in)] hover:bg-[var(--hv)] text-xs text-[var(--tx)] border border-[var(--bd)] transition-colors"
            >
              <FolderKanban className="w-3.5 h-3.5 text-[var(--ac2)]" />
              <span className="truncate">{formatWithEmojiPreference(t.projects, allowEmojis)}</span>
            </button>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="relative my-2">
          <Search className="w-3.5 h-3.5 text-[var(--mu)] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={t.searchChats}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-16 py-1.5 text-xs rounded-xl bg-[var(--in)] border border-[var(--bd)] text-[var(--tx)] placeholder-[var(--mu)] focus:outline-none focus:border-[var(--ac)] transition-all"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchQuery ? (
              <>
                <span className="text-[10px] font-medium text-[var(--ac)] px-1 rounded bg-[var(--ac)]/10">
                  {filteredChats.length}
                </span>
                <button
                  type="button"
                  onClick={clearSearch}
                  className="p-0.5 rounded text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--hv)] transition-colors"
                  title="Temizle"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <span className="hidden sm:inline-block text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-[var(--bd)]/50 text-[var(--mu)] pointer-events-none">
                ⌘K
              </span>
            )}
          </div>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto space-y-1 py-1 pr-1">
          {chats.length === 0 ? (
            <div className="text-center py-8 text-xs text-[var(--mu)] space-y-2">
              <p>Henüz sohbet yok</p>
              <button
                onClick={onNewChat}
                className="inline-flex items-center gap-1 text-[11px] text-[var(--ac)] hover:underline"
              >
                <Plus className="w-3 h-3" /> Yeni sohbet başlat
              </button>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-8 px-2 text-xs text-[var(--mu)] space-y-2">
              <p>"{searchQuery}" ile eşleşen sohbet bulunamadı</p>
              <button
                onClick={clearSearch}
                className="inline-flex items-center gap-1 text-[11px] text-[var(--ac)] font-medium px-2.5 py-1 rounded-lg bg-[var(--ac)]/10 hover:bg-[var(--ac)]/20 transition-colors"
              >
                <X className="w-3 h-3" /> Aramayı Temizle
              </button>
            </div>
          ) : (
            filteredChats.map((c) => {
              const isActive = c.id === currentChatId;
              const isEditing = editingChatId === c.id;
              const matchedMsg = trimmedQuery
                ? c.msgs.find((m) => m.content.toLowerCase().includes(trimmedQuery))
                : null;

              return (
                <div
                  key={c.id}
                  className={`group relative flex items-center justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[var(--hv)] text-[var(--tx)] font-medium border-l-2 border-[var(--ac)] shadow-sm'
                      : 'text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--hv)]'
                  }`}
                  onClick={() => onSelectChat(c.id)}
                >
                  <div className="flex items-start gap-2 flex-1 min-w-0 mr-1">
                    <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[var(--ac)]" />
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editTitle}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') finishRename(c.id);
                            if (e.key === 'Escape') setEditingChatId(null);
                          }}
                          onBlur={() => finishRename(c.id)}
                          className="w-full bg-[var(--in)] border border-[var(--ac)] rounded px-1.5 py-0.5 text-xs text-[var(--tx)] focus:outline-none"
                        />
                      ) : (
                        <>
                          <div className="truncate font-medium text-[var(--tx)]">
                            {formatWithEmojiPreference(c.title, allowEmojis)}
                          </div>
                          {matchedMsg && trimmedQuery && (
                            <div className="text-[10px] text-[var(--mu)] truncate mt-0.5 opacity-80">
                              💬 {matchedMsg.content.slice(0, 40)}…
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {!isEditing && (
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startRename(c.id, c.title);
                        }}
                        className="p-1 text-[var(--mu)] hover:text-[var(--tx)]"
                        title="Yeniden adlandır"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChat(c.id);
                        }}
                        className="p-1 text-[var(--mu)] hover:text-red-400"
                        title="Sil"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Settings Bar */}
        <div className="pt-2 border-t border-[var(--bd)] space-y-1.5 text-xs">
          {/* Language Selector */}
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[var(--mu)] flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              {t.language}
            </span>
            <select
              value={lang}
              onChange={(e) => onLanguageChange(e.target.value as Language)}
              className="bg-[var(--in)] border border-[var(--bd)] text-[var(--tx)] text-xs rounded-lg px-2 py-1 focus:outline-none cursor-pointer font-medium"
            >
              <option value="tr">Türkçe (TR)</option>
              <option value="en">English (EN)</option>
              <option value="de">Deutsch (DE)</option>
              <option value="es">Español (ES)</option>
            </select>
          </div>

          <div className="grid grid-cols-4 gap-1 pt-1">
            <button
              onClick={onOpenCustomizer}
              className="p-2 rounded-lg bg-[var(--in)] hover:bg-[var(--hv)] text-[var(--tx)] flex items-center justify-center gap-1 border border-[var(--bd)] transition-colors"
              title={t.customize}
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-lg bg-[var(--in)] hover:bg-[var(--hv)] text-[var(--tx)] flex items-center justify-center gap-1 border border-[var(--bd)] transition-colors"
              title={t.theme}
            >
              <SunMoon className="w-3.5 h-3.5" />
            </button>
            {/* Quick Emoji Toggle Button */}
            <button
              onClick={onToggleEmojis}
              className={`p-2 rounded-lg flex items-center justify-center gap-1 border border-[var(--bd)] transition-colors ${
                allowEmojis
                  ? 'bg-[var(--in)] text-emerald-400 hover:bg-[var(--hv)]'
                  : 'bg-red-950/40 text-red-400 border-red-500/30'
              }`}
              title={allowEmojis ? 'Emojileri Kapat' : 'Emojileri Aç'}
            >
              {allowEmojis ? <Smile className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onOpenPrivacy}
              className="p-2 rounded-lg bg-[var(--in)] hover:bg-[var(--hv)] text-[var(--tx)] flex items-center justify-center gap-1 border border-[var(--bd)] transition-colors"
              title={t.privacy}
            >
              <Shield className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
