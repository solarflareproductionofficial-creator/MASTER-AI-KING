export type Language = 'tr' | 'en' | 'de' | 'es';

export type ModeId =
  | 'chat'
  | 'deep'
  | 'think'
  | 'idea'
  | 'code'
  | 'quick'
  | 'gdd'
  | 'bug'
  | 'sfx';

export interface AttachedFile {
  name: string;
  kind: 'text' | 'image' | 'pdf' | 'load';
  size?: number;
  text?: string;
  data?: string; // base64
  mt?: string; // mimeType
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  files?: AttachedFile[];
  sources?: { title: string; url: string }[];
  vote?: 1 | -1;
  voteComment?: string;
  timestamp: number;
  isError?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  msgs: ChatMessage[];
  projId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface GameProject {
  id: string;
  name: string;
  notes: string;
  createdAt: number;
}

export interface PluginItem {
  id: string;
  name: string;
  desc: Record<Language, string>;
  prompt: string;
  isCustom?: boolean;
  enabled: boolean;
}

export interface GameTemplate {
  id: string;
  title: Record<Language, string>;
  desc: Record<Language, string>;
  badge?: string;
  code: string;
}

export interface ThemeSettings {
  accentColor: string;
  gradientColors: string[];
  gradientAngle: number;
  animatedGradient: boolean;
  themeMode: 'auto' | 'dark' | 'light' | 'amoled';
  fontSize: 14 | 15 | 17;
  chatWidth: 680 | 760 | 920;
  bubbleStyle: 'soft' | 'accent' | 'outline';
  animations: 'off' | 'normal' | 'max';
  showMascot: boolean;
  bgOrbs: boolean;
  allowEmojis: boolean;
  emojiDensity: 'none' | 'few' | 'normal' | 'lots';
}

export interface StudioState {
  isOpen: boolean;
  code: string;
  activeTab: 'preview' | 'code' | 'templates';
  errors: string[];
  isRunning: boolean;
  isFixing: boolean;
  isFullscreen: boolean;
}
