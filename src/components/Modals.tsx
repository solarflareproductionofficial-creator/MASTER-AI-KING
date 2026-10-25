import React, { useState } from 'react';
import {
  X,
  Palette,
  Sliders,
  Puzzle,
  FolderKanban,
  ShieldCheck,
  Plus,
  Trash2,
  Check,
  Download,
  Upload,
} from 'lucide-react';
import {
  ThemeSettings,
  PluginItem,
  GameProject,
  Language,
} from '../types';
import { TRANSLATIONS } from '../data/translations';

interface CustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ThemeSettings;
  onUpdateSettings: (newSettings: ThemeSettings) => void;
  onResetSettings: () => void;
  lang: Language;
}

const GRADIENT_PRESETS: { name: string; colors: string[] }[] = [
  { name: 'Aurora', colors: ['#10e0a8', '#8f74ff'] },
  { name: 'Ocean', colors: ['#00c6ff', '#0072ff'] },
  { name: 'Sunset', colors: ['#ff9966', '#ff5e62'] },
  { name: 'Fire', colors: ['#f12711', '#f5af19'] },
  { name: 'Neon', colors: ['#f72585', '#7209b7', '#4cc9f0'] },
  { name: 'Emerald', colors: ['#11998e', '#38ef7d'] },
  { name: 'Violet', colors: ['#8e2de2', '#4a00e0'] },
  { name: 'Rose', colors: ['#ff6a88', '#ff99ac'] },
  { name: 'Gold', colors: ['#f9d976', '#b8860b'] },
  { name: 'Rainbow', colors: ['#ff0000', '#ff9800', '#ffeb3b', '#00c853', '#00b0ff', '#7c4dff'] },
];

export const CustomizerModal: React.FC<CustomizerModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetSettings,
  lang,
}) => {
  if (!isOpen) return null;
  const t = (TRANSLATIONS[lang] || TRANSLATIONS.en).modals.customizer;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm anim-pop">
      <div className="relative w-full max-w-lg bg-[var(--gl)] border border-[var(--gb)] rounded-2xl p-6 shadow-2xl backdrop-blur-xl max-h-[88vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--bd)] mb-4">
          <h2 className="text-lg font-bold brand-font flex items-center gap-2 text-[var(--tx)]">
            <Palette className="w-5 h-5 text-[var(--ac)]" />
            {t.title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--hv)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5 text-sm">
          {/* Gradient Palettes */}
          <div>
            <label className="block text-xs font-semibold text-[var(--mu)] uppercase tracking-wider mb-2">
              {t.gradientPresets}
            </label>
            <div className="grid grid-cols-5 gap-2">
              {GRADIENT_PRESETS.map((p) => {
                const isSelected = JSON.stringify(settings.gradientColors) === JSON.stringify(p.colors);
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() =>
                      onUpdateSettings({
                        ...settings,
                        gradientColors: p.colors,
                        accentColor: p.colors[0],
                      })
                    }
                    className={`h-9 rounded-xl border flex items-center justify-center transition-all ${
                      isSelected ? 'ring-2 ring-[var(--tx)] scale-105 border-white' : 'border-transparent hover:scale-105'
                    }`}
                    style={{
                      background: `linear-gradient(135deg, ${p.colors.join(', ')})`,
                    }}
                    title={p.name}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white drop-shadow" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Theme Mode */}
          <div>
            <label className="block text-xs font-semibold text-[var(--mu)] uppercase tracking-wider mb-2">
              {t.themeMode}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'dark', label: t.modes.dark },
                { id: 'light', label: t.modes.light },
                { id: 'amoled', label: t.modes.amoled },
                { id: 'auto', label: t.modes.auto },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => onUpdateSettings({ ...settings, themeMode: m.id as any })}
                  className={`py-2 rounded-xl text-xs font-medium border transition-colors ${
                    settings.themeMode === m.id
                      ? 'bg-[var(--acg)] text-white border-transparent'
                      : 'bg-[var(--in)] border-[var(--bd)] text-[var(--tx)] hover:bg-[var(--hv)]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div>
            <label className="block text-xs font-semibold text-[var(--mu)] uppercase tracking-wider mb-2">
              {t.fontSize}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 14, label: t.sizes.small },
                { val: 15, label: t.sizes.normal },
                { val: 17, label: t.sizes.large },
              ].map((s) => (
                <button
                  key={s.val}
                  onClick={() => onUpdateSettings({ ...settings, fontSize: s.val as any })}
                  className={`py-2 rounded-xl text-xs font-medium border transition-colors ${
                    settings.fontSize === s.val
                      ? 'bg-[var(--acg)] text-white border-transparent'
                      : 'bg-[var(--in)] border-[var(--bd)] text-[var(--tx)] hover:bg-[var(--hv)]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Width */}
          <div>
            <label className="block text-xs font-semibold text-[var(--mu)] uppercase tracking-wider mb-2">
              {t.chatWidth}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 680, label: t.widths.narrow },
                { val: 760, label: t.widths.medium },
                { val: 920, label: t.widths.wide },
              ].map((w) => (
                <button
                  key={w.val}
                  onClick={() => onUpdateSettings({ ...settings, chatWidth: w.val as any })}
                  className={`py-2 rounded-xl text-xs font-medium border transition-colors ${
                    settings.chatWidth === w.val
                      ? 'bg-[var(--acg)] text-white border-transparent'
                      : 'bg-[var(--in)] border-[var(--bd)] text-[var(--tx)] hover:bg-[var(--hv)]'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-2 border-t border-[var(--bd)]">
            {/* Emoji Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--in)] border border-[var(--bd)]">
              <div>
                <span className="font-semibold text-sm text-[var(--tx)]">
                  {settings.allowEmojis ? `🙂 ${t.emojiTitle}: ON` : `${t.emojiTitle}: OFF`}
                </span>
                <p className="text-xs text-[var(--mu)]">
                  {settings.allowEmojis ? t.emojiSubOn : t.emojiSubOff}
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.allowEmojis}
                onChange={(e) => onUpdateSettings({ ...settings, allowEmojis: e.target.checked })}
                className="w-5 h-5 accent-[var(--ac)] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-[var(--tx)]">{t.mascotTitle}</span>
                <p className="text-xs text-[var(--mu)]">{t.mascotDesc}</p>
              </div>
              <input
                type="checkbox"
                checked={settings.showMascot}
                onChange={(e) => onUpdateSettings({ ...settings, showMascot: e.target.checked })}
                className="w-5 h-5 accent-[var(--ac)] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-[var(--tx)]">{t.bgOrbsTitle}</span>
                <p className="text-xs text-[var(--mu)]">{t.bgOrbsDesc}</p>
              </div>
              <input
                type="checkbox"
                checked={settings.bgOrbs}
                onChange={(e) => onUpdateSettings({ ...settings, bgOrbs: e.target.checked })}
                className="w-5 h-5 accent-[var(--ac)] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--bd)]">
          <button
            onClick={onResetSettings}
            className="px-3 py-1.5 text-xs text-[var(--mu)] hover:text-[var(--tx)] hover:underline"
          >
            {t.resetDefault}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--acg)] text-white hover:opacity-95 shadow"
          >
            {t.done}
          </button>
        </div>
      </div>
    </div>
  );
};

/* PLUGINS MODAL */
interface PluginsModalProps {
  isOpen: boolean;
  onClose: () => void;
  plugins: PluginItem[];
  lang: Language;
  onTogglePlugin: (id: string) => void;
  onAddCustomPlugin: (name: string, prompt: string) => void;
  onDeleteCustomPlugin: (id: string) => void;
}

export const PluginsModal: React.FC<PluginsModalProps> = ({
  isOpen,
  onClose,
  plugins,
  lang,
  onTogglePlugin,
  onAddCustomPlugin,
  onDeleteCustomPlugin,
}) => {
  const [newName, setNewName] = useState('');
  const [newPrompt, setNewPrompt] = useState('');

  if (!isOpen) return null;
  const t = (TRANSLATIONS[lang] || TRANSLATIONS.en).modals.plugins;
  const common = (TRANSLATIONS[lang] || TRANSLATIONS.en).common;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPrompt.trim()) return;
    onAddCustomPlugin(newName.trim(), newPrompt.trim());
    setNewName('');
    setNewPrompt('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm anim-pop">
      <div className="relative w-full max-w-lg bg-[var(--gl)] border border-[var(--gb)] rounded-2xl p-6 shadow-2xl backdrop-blur-xl max-h-[88vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--bd)] mb-4">
          <h2 className="text-lg font-bold brand-font flex items-center gap-2 text-[var(--tx)]">
            <Puzzle className="w-5 h-5 text-[var(--ac)]" />
            {t.title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--hv)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[var(--mu)] mb-4">
          {t.desc}
        </p>

        {/* Plugins List */}
        <div className="space-y-3 mb-6">
          {plugins.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-3 rounded-xl bg-[var(--in)] border border-[var(--bd)]"
            >
              <div className="flex-1 mr-3">
                <div className="font-semibold text-sm text-[var(--tx)] flex items-center gap-1.5">
                  {p.name}
                </div>
                <div className="text-xs text-[var(--mu)] mt-0.5">
                  {p.desc[lang] || p.desc.en || p.prompt.slice(0, 70) + '...'}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {p.isCustom && (
                  <button
                    onClick={() => onDeleteCustomPlugin(p.id)}
                    className="p-1.5 text-[var(--mu)] hover:text-red-400"
                    title={common.delete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <input
                  type="checkbox"
                  checked={p.enabled}
                  onChange={() => onTogglePlugin(p.id)}
                  className="w-5 h-5 accent-[var(--ac)] cursor-pointer"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Add Custom Plugin */}
        <form onSubmit={handleAdd} className="p-3.5 rounded-xl border border-[var(--bd)] bg-[var(--sb)]/60">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ac)] mb-2 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" />
            {t.customTitle}
          </h4>
          <input
            type="text"
            placeholder={t.namePlaceholder}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--in)] border border-[var(--bd)] rounded-lg text-xs text-[var(--tx)] mb-2 focus:outline-none focus:border-[var(--ac)]"
          />
          <textarea
            rows={2}
            placeholder={t.promptPlaceholder}
            value={newPrompt}
            onChange={(e) => setNewPrompt(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--in)] border border-[var(--bd)] rounded-lg text-xs text-[var(--tx)] mb-2 focus:outline-none focus:border-[var(--ac)] resize-none"
          />
          <button
            type="submit"
            disabled={!newName.trim() || !newPrompt.trim()}
            className="w-full py-2 rounded-lg text-xs font-semibold bg-[var(--acg)] text-white disabled:opacity-50 transition-opacity"
          >
            {t.addBtn}
          </button>
        </form>
      </div>
    </div>
  );
};

/* PROJECTS MODAL */
interface ProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: GameProject[];
  currentProjectId?: string;
  onSelectProject: (id: string) => void;
  onAddProject: (name: string, notes: string) => void;
  onUpdateProject: (id: string, notes: string) => void;
  onDeleteProject: (id: string) => void;
  lang: Language;
}

export const ProjectsModal: React.FC<ProjectsModalProps> = ({
  isOpen,
  onClose,
  projects,
  currentProjectId,
  onSelectProject,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  lang,
}) => {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;
  const t = (TRANSLATIONS[lang] || TRANSLATIONS.en).modals.projects;
  const common = (TRANSLATIONS[lang] || TRANSLATIONS.en).common;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddProject(name.trim(), notes.trim());
    setName('');
    setNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm anim-pop">
      <div className="relative w-full max-w-lg bg-[var(--gl)] border border-[var(--gb)] rounded-2xl p-6 shadow-2xl backdrop-blur-xl max-h-[88vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--bd)] mb-4">
          <h2 className="text-lg font-bold brand-font flex items-center gap-2 text-[var(--tx)]">
            <FolderKanban className="w-5 h-5 text-[var(--ac)]" />
            {t.title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--hv)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[var(--mu)] mb-4">
          {t.desc}
        </p>

        {/* Existing Projects */}
        <div className="space-y-4 mb-6">
          {projects.map((p) => {
            const isSelected = p.id === currentProjectId;
            return (
              <div
                key={p.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isSelected ? 'border-[var(--ac)] bg-[var(--in)] shadow-sm' : 'border-[var(--bd)] bg-[var(--sb)]/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[var(--tx)]">📁 {p.name}</span>
                    {isSelected && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                        {t.activeBadge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {!isSelected && (
                      <button
                        onClick={() => onSelectProject(p.id)}
                        className="px-2.5 py-1 text-xs rounded-lg bg-[var(--in)] hover:bg-[var(--hv)] text-[var(--tx)]"
                      >
                        {t.selectBtn}
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteProject(p.id)}
                      className="p-1.5 text-[var(--mu)] hover:text-red-400"
                      title={common.delete}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <textarea
                  defaultValue={p.notes}
                  onBlur={(e) => onUpdateProject(p.id, e.target.value)}
                  placeholder={t.notesPlaceholder}
                  rows={3}
                  className="w-full p-2.5 bg-[#090a10] border border-[var(--bd)] rounded-lg text-xs text-[var(--tx)] resize-none focus:outline-none focus:border-[var(--ac)] font-mono"
                />
              </div>
            );
          })}
        </div>

        {/* Create Project */}
        <form onSubmit={handleAdd} className="p-3.5 rounded-xl border border-[var(--bd)] bg-[var(--sb)]/60">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ac)] mb-2 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" />
            {t.newProject}
          </h4>
          <input
            type="text"
            placeholder={t.namePlaceholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--in)] border border-[var(--bd)] rounded-lg text-xs text-[var(--tx)] mb-2 focus:outline-none focus:border-[var(--ac)]"
          />
          <textarea
            rows={2}
            placeholder={t.notesPlaceholder}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--in)] border border-[var(--bd)] rounded-lg text-xs text-[var(--tx)] mb-2 focus:outline-none focus:border-[var(--ac)] resize-none"
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-2 rounded-lg text-xs font-semibold bg-[var(--acg)] text-white disabled:opacity-50 transition-opacity"
          >
            {t.createBtn}
          </button>
        </form>
      </div>
    </div>
  );
};

/* PRIVACY MODAL */
interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  lang: Language;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({
  isOpen,
  onClose,
  onExportBackup,
  onImportBackup,
  lang,
}) => {
  if (!isOpen) return null;
  const t = (TRANSLATIONS[lang] || TRANSLATIONS.en).modals.privacy;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm anim-pop">
      <div className="relative w-full max-w-lg bg-[var(--gl)] border border-[var(--gb)] rounded-2xl p-6 shadow-2xl backdrop-blur-xl max-h-[88vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--bd)] mb-4">
          <h2 className="text-lg font-bold brand-font flex items-center gap-2 text-[var(--tx)]">
            <ShieldCheck className="w-5 h-5 text-[var(--ac)]" />
            {t.title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--hv)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs text-[var(--tx)] leading-relaxed">
          <div className="p-3.5 rounded-xl bg-[var(--in)] border border-[var(--bd)]">
            <div className="font-semibold text-sm mb-1 text-[var(--ac)]">{t.policyTitle}</div>
            <p className="text-[var(--mu)]">
              {t.policyDesc}
            </p>
          </div>

          {/* Backup & Restore */}
          <div className="p-3.5 rounded-xl bg-[var(--in)] border border-[var(--bd)] space-y-2.5">
            <div className="font-semibold text-sm text-[var(--tx)] flex items-center gap-1.5">
              <Download className="w-4 h-4 text-[var(--ac)]" />
              {t.backupTitle}
            </div>
            <p className="text-[var(--mu)]">
              {t.backupDesc}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={onExportBackup}
                className="flex-1 py-2 px-3 rounded-lg bg-[var(--acg)] text-white font-medium flex items-center justify-center gap-1.5 hover:opacity-90"
              >
                <Download className="w-3.5 h-3.5" />
                {t.exportBtn}
              </button>
              <label className="flex-1 py-2 px-3 rounded-lg border border-[var(--bd)] bg-[var(--sb)] text-[var(--tx)] font-medium flex items-center justify-center gap-1.5 hover:bg-[var(--hv)] cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                {t.importBtn}
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      onImportBackup(e.target.files[0]);
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[var(--bd)] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--acg)] text-white hover:opacity-95"
          >
            {t.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
