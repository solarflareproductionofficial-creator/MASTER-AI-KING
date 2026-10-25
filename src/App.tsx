import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Sparkles,
  Gamepad2,
  Download,
  Mic,
  MicOff,
  Headphones,
  ArrowUp,
  Square,
  Plus,
  Paperclip,
  Check,
  ChevronDown,
  Layers,
  Code2,
  Volume2,
  VolumeX,
  FileCode,
  FileText,
  FileImage,
  AlertCircle,
  X,
  RefreshCw,
  Send,
  Radio,
} from 'lucide-react';

import {
  Language,
  ModeId,
  ChatMessage,
  ChatSession,
  GameProject,
  PluginItem,
  ThemeSettings,
  AttachedFile,
} from './types';
import { TRANSLATIONS } from './data/translations';
import { INITIAL_PLUGINS } from './data/plugins';
import { GAME_TEMPLATES } from './data/templates';
import { Mascot } from './components/Mascot';
import { Sidebar } from './components/Sidebar';
import { StudioDrawer } from './components/StudioDrawer';
import { ChatMessageItem } from './components/ChatMessageItem';
import { VoiceOverlay } from './components/VoiceOverlay';
import {
  CustomizerModal,
  PluginsModal,
  ProjectsModal,
  PrivacyModal,
} from './components/Modals';

import { detectUserLanguage } from './utils/langDetect';
import { formatWithEmojiPreference } from './utils/emoji';
import {
  requestMicrophonePermission,
  isSpeechRecognitionSupported,
  createSpeechRecognizer,
  speakText,
} from './utils/speech';

const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  accentColor: '#10a37f',
  gradientColors: ['#10a37f', '#059669'],
  gradientAngle: 135,
  animatedGradient: false,
  themeMode: 'dark',
  fontSize: 15,
  chatWidth: 760,
  bubbleStyle: 'soft',
  animations: 'normal',
  showMascot: false, // Sade ve saf - minimalist by default, no cartoon mascot clutter
  bgOrbs: false,      // Sade ve saf - clean modern workspace without distracting background orbs
  allowEmojis: true,
  emojiDensity: 'normal',
};

export default function App() {
  // Localization: Auto-detect based on browser or location heuristic
  const [lang, setLang] = useState<Language>(() => {
    return detectUserLanguage();
  });
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  // Theme Settings
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(() => {
    try {
      const saved = localStorage.getItem('masterai_theme');
      return saved ? { ...DEFAULT_THEME_SETTINGS, ...JSON.parse(saved) } : DEFAULT_THEME_SETTINGS;
    } catch {
      return DEFAULT_THEME_SETTINGS;
    }
  });

  // Chats
  const [chats, setChats] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('masterai_chats');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [currentChatId, setCurrentChatId] = useState<string | null>(() => {
    return localStorage.getItem('masterai_cur_chat') || null;
  });

  // Projects
  const [projects, setProjects] = useState<GameProject[]>(() => {
    try {
      const saved = localStorage.getItem('masterai_projects');
      return saved ? JSON.parse(saved) : [
        {
          id: 'proj_default',
          name: 'Cyber Rogue Game',
          notes: 'Mekanik: Roguelike dungeon crawler, grid tabanlı hareket, neon piksel grafikler, procedural odalar.',
          createdAt: Date.now(),
        },
      ];
    } catch {
      return [];
    }
  });
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>(() => {
    return localStorage.getItem('masterai_cur_proj') || 'proj_default';
  });

  // Plugins
  const [plugins, setPlugins] = useState<PluginItem[]>(() => {
    try {
      const saved = localStorage.getItem('masterai_plugins');
      return saved ? JSON.parse(saved) : INITIAL_PLUGINS;
    } catch {
      return INITIAL_PLUGINS;
    }
  });

  // Mode
  const [mode, setMode] = useState<ModeId>('chat');
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);

  // Studio State
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [studioCode, setStudioCode] = useState<string>(GAME_TEMPLATES[0].code);
  const [isAiModifyingGame, setIsAiModifyingGame] = useState(false);

  // Voice State
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isMicListening, setIsMicListening] = useState(false);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const [micErrorMessage, setMicErrorMessage] = useState<string | null>(null);
  const [autoSpeakReplies, setAutoSpeakReplies] = useState(false);
  const [fileAnalysisStatus, setFileAnalysisStatus] = useState<string | null>(null);
  const speechRecognizerRef = useRef<any>(null);

  // Modals
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isPluginsOpen, setIsPluginsOpen] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Chat Input & Streaming
  const [inputText, setInputText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingBuffer, setStreamingBuffer] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Mascot Tip Bubble
  const [mascotBubble, setMascotBubble] = useState<string | null>(null);
  const tipIndexRef = useRef(0);

  // Auto scroll ref
  const logEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Apply CSS custom properties dynamically
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', themeSettings.themeMode);
    root.style.setProperty('--ac', themeSettings.accentColor);
    root.style.setProperty(
      '--ac2',
      themeSettings.gradientColors[themeSettings.gradientColors.length - 1] || themeSettings.accentColor
    );
    root.style.setProperty(
      '--acg',
      `linear-gradient(${themeSettings.gradientAngle}deg, ${themeSettings.gradientColors.join(', ')})`
    );
    root.style.setProperty('--fs', `${themeSettings.fontSize}px`);
    root.style.setProperty('--mw', `${themeSettings.chatWidth}px`);

    localStorage.setItem('masterai_theme', JSON.stringify(themeSettings));
  }, [themeSettings]);

  // Persist chats, projects, plugins, language
  useEffect(() => {
    localStorage.setItem('masterai_chats', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem('masterai_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('masterai_plugins', JSON.stringify(plugins));
  }, [plugins]);

  useEffect(() => {
    localStorage.setItem('masterai_lang', lang);
  }, [lang]);

  useEffect(() => {
    if (currentChatId) {
      localStorage.setItem('masterai_cur_chat', currentChatId);
    }
  }, [currentChatId]);

  useEffect(() => {
    if (currentProjectId) {
      localStorage.setItem('masterai_cur_proj', currentProjectId);
    }
  }, [currentProjectId]);

  // Scroll to bottom on updates
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, streamingBuffer, isStreaming]);

  // Active Chat Session
  const currentChat = chats.find((c) => c.id === currentChatId);

  // Tap Mascot for advice
  const handleMascotTap = () => {
    const tips = t.mascotTips || [];
    if (tips.length === 0) return;
    const nextTip = tips[tipIndexRef.current % tips.length];
    tipIndexRef.current++;
    setMascotBubble(nextTip);
    setTimeout(() => setMascotBubble(null), 4500);
  };

  // Create new chat
  const handleNewChat = () => {
    const newId = 'chat_' + Date.now();
    const newSession: ChatSession = {
      id: newId,
      title: 'Yeni Oyun Sohbeti',
      msgs: [],
      projId: currentProjectId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setChats((prev) => [newSession, ...prev]);
    setCurrentChatId(newId);
    setIsSidebarOpen(false);
  };

  // Delete chat
  const handleDeleteChat = (id: string) => {
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (currentChatId === id) {
      setCurrentChatId(null);
    }
  };

  // Rename chat
  const handleRenameChat = (id: string, newTitle: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c))
    );
  };

  // Voice Mic Dictation with Permission Handling
  const handleToggleMic = async () => {
    if (isMicListening) {
      if (speechRecognizerRef.current) {
        try {
          speechRecognizerRef.current.stop();
        } catch {}
      }
      setIsMicListening(false);
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      setMicErrorMessage('Tarayıcınızda konuşma tanıma özelliği desteklenmiyor. Lütfen Google Chrome veya Microsoft Edge kullanın.');
      setMicPermissionDenied(true);
      return;
    }

    // Explicitly request microphone permission
    const perm = await requestMicrophonePermission();
    if (!perm.ok) {
      setMicErrorMessage(perm.error || 'Mikrofon erişim izni verilmedi.');
      setMicPermissionDenied(true);
      return;
    }

    setMicPermissionDenied(false);
    setMicErrorMessage(null);

    // Initialize recognizer
    const recognizer = createSpeechRecognizer(
      lang,
      (transcript, _isFinal) => {
        if (transcript && transcript.trim()) {
          setInputText((prev) => {
            const trimmed = prev.trim();
            if (!trimmed) return transcript;
            return trimmed + ' ' + transcript;
          });
        }
      },
      (err) => {
        console.warn('Speech error:', err);
        setIsMicListening(false);
      },
      () => {
        setIsMicListening(false);
      }
    );

    if (recognizer) {
      speechRecognizerRef.current = recognizer;
      try {
        recognizer.start();
        setIsMicListening(true);
      } catch (e) {
        console.error('Recognizer start error:', e);
        setIsMicListening(false);
      }
    }
  };

  const handleStopMic = () => {
    if (speechRecognizerRef.current) {
      try {
        speechRecognizerRef.current.stop();
      } catch {}
    }
    setIsMicListening(false);
  };

  // Send Prompt to Gemini Backend
  const handleSendMessage = async (textToSend?: string) => {
    // If mic was listening, stop it
    if (isMicListening) {
      handleStopMic();
    }

    const query = (textToSend || inputText).trim();
    if ((!query && attachedFiles.length === 0) || isStreaming) return;

    // Create session if none
    let activeId = currentChatId;
    let activeChat = currentChat;

    if (!activeChat) {
      activeId = 'chat_' + Date.now();
      const newSession: ChatSession = {
        id: activeId,
        title: query.slice(0, 32) || (attachedFiles[0]?.name ? `${attachedFiles[0].name} Analizi` : 'Sohbet'),
        msgs: [],
        projId: currentProjectId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setChats((prev) => [newSession, ...prev]);
      setCurrentChatId(activeId);
      activeChat = newSession;
    }

    const userMessage: ChatMessage = {
      id: 'usr_' + Date.now(),
      role: 'user',
      content: query || (attachedFiles.length > 0 ? 'Ekli dosyayı detaylıca incele, içeriğini açıkla ve analiz et.' : ''),
      files: [...attachedFiles],
      timestamp: Date.now(),
    };

    // Append user message immediately
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? {
              ...c,
              msgs: [...c.msgs, userMessage],
              title: c.msgs.length === 0 ? query.slice(0, 32) || c.title : c.title,
              updatedAt: Date.now(),
            }
          : c
      )
    );

    const sendingFiles = [...attachedFiles];
    // Reset input
    setInputText('');
    setAttachedFiles([]);
    setIsStreaming(true);
    setStreamingBuffer('');

    if (sendingFiles.length > 0) {
      setFileAnalysisStatus(`🔍 ${sendingFiles.map((f) => f.name).join(', ')} dosyası inceleniyor ve veriler taranıyor...`);
    } else {
      setFileAnalysisStatus(null);
    }

    // Prepare system instructions with plugins and project memory
    const activeProject = projects.find((p) => p.id === currentProjectId);
    const enabledPlugins = plugins.filter((p) => p.enabled);
    const modeConfig = t.modes[mode];

    const systemPrompt = `You are MASTER AI, a versatile, highly intelligent, safe and helpful universal AI companion and productivity workspace.
You assist users with EVERYTHING in daily life:
- Daily planning, productivity, work tasks, education, science, math, habits and practical advice.
- Creative and professional writing, essays, emails, resumes, language learning, translation, and storytelling.
- Technology, debugging, architecture, algorithms, and full working code (HTML/JS/Canvas, Python, TypeScript, etc.).
- File analysis: When files, documents, or images are attached, thoroughly read and inspect their contents. Explain what they contain, summarize key structures or themes, identify any potential bugs or insights, and answer user questions in detail.
- When the user asks for interactive tools, widgets, visual simulations, or games, write a complete self-contained file in ONE \`\`\`html block so the user can test and run it directly in Live Studio.

Always reply naturally, helpfully, and accurately in the user's language (prefer Turkish if query is Turkish).

Active Mode: ${mode.toUpperCase()} - ${modeConfig?.desc || ''}
${
  enabledPlugins.length > 0
    ? `\nActive Capabilities:\n${enabledPlugins.map((p) => `[${p.name}]: ${p.prompt}`).join('\n')}`
    : ''
}
${
  activeProject && activeProject.notes
    ? `\nProject Context & Memory ("${activeProject.name}"):\n${activeProject.notes}`
    : ''
}

Rules:
1. When generating code, provide fully runnable, working code.
2. Explain concepts and answers with clarity and logical organization.${
  !themeSettings.allowEmojis
    ? '\n3. CRITICAL REQUIREMENT: The user has strictly disabled all emojis. DO NOT use any emojis, icons, or emoticons in your response. Keep text strictly clean without emojis.'
    : ''
}`;

    // Prepare conversational history with multimodal parts
    const history = (activeChat?.msgs || []).concat(userMessage).map((m) => {
      const parts: any[] = [];
      if (m.files && m.files.length > 0) {
        m.files.forEach((f) => {
          if (f.kind === 'image' && f.data) {
            parts.push({
              inlineData: {
                mimeType: f.mt || 'image/png',
                data: f.data,
              },
            });
          } else if (f.text) {
            parts.push({
              text: `=== [EKLİ DOSYA: ${f.name} (${f.size || 0} bayt)] ===\n${f.text}\n=== [DOSYA SONU] ===`,
            });
          }
        });
      }
      if (m.content) {
        parts.push({ text: m.content });
      }
      return {
        role: m.role,
        parts: parts.length > 0 ? parts : [{ text: m.content || ' ' }],
      };
    });

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          systemInstruction: systemPrompt,
          mode,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      if (sendingFiles.length > 0) {
        setFileAnalysisStatus('⚡ MASTER AI dosya içeriğini analiz ediyor ve yanıt hazırlıyor...');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullAssistantText = '';

      if (reader) {
        let doneReading = false;
        while (!doneReading) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.text) {
                  fullAssistantText += data.text;
                  setStreamingBuffer(fullAssistantText);
                }
                if (data.done) {
                  doneReading = true;
                }
                if (data.error) {
                  throw new Error(data.error);
                }
              } catch {}
            }
          }
        }
      }

      // Commit assistant message
      const assistantMessage: ChatMessage = {
        id: 'ast_' + Date.now(),
        role: 'assistant',
        content: fullAssistantText || 'Yanıt oluşturulamadı.',
        timestamp: Date.now(),
      };

      setChats((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? {
                ...c,
                msgs: [...c.msgs, assistantMessage],
                updatedAt: Date.now(),
              }
            : c
        )
      );

      // Auto-speak response if enabled
      if (autoSpeakReplies && fullAssistantText) {
        speakText(fullAssistantText, lang);
      }

      // Automatically detect if game code was returned, ready for studio
      const match = /```html\s*\n([\s\S]*?)```/i.exec(fullAssistantText);
      if (match && match[1]) {
        setStudioCode(match[1]);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Chat API error:', err);
        const errorMessage: ChatMessage = {
          id: 'err_' + Date.now(),
          role: 'assistant',
          content: `⚠️ Bir hata oluştu: ${err.message || 'API bağlantısı kurulamadı.'}`,
          timestamp: Date.now(),
          isError: true,
        };
        setChats((prev) =>
          prev.map((c) => (c.id === activeId ? { ...c, msgs: [...c.msgs, errorMessage] } : c))
        );
      }
    } finally {
      setIsStreaming(false);
      setStreamingBuffer('');
      setFileAnalysisStatus(null);
      abortControllerRef.current = null;
    }
  };

  // Stop Generation
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // Run in Studio action from a message
  const handleRunInStudio = (code: string) => {
    setStudioCode(code);
    setIsStudioOpen(true);
  };

  // Ask AI in Studio to Modify or Fix Game
  const handleAskAiToModifyGame = async (
    instructions: string,
    currentCode: string,
    errors: string[]
  ) => {
    setIsAiModifyingGame(true);
    try {
      const response = await fetch('/api/fix-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: currentCode,
          errors,
          userInstructions: instructions,
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let result = '';

      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.text) result += data.text;
              } catch {}
            }
          }
        }
      }

      const match = /```html\s*\n([\s\S]*?)```/i.exec(result);
      if (match && match[1]) {
        setStudioCode(match[1]);
      }
    } catch (err) {
      console.error('Failed to fix game:', err);
    } finally {
      setIsAiModifyingGame(false);
    }
  };

  // File Upload Handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    files.forEach((file) => {
      const reader = new FileReader();
      const isImg = file.type.startsWith('image/');

      if (isImg) {
        reader.onload = () => {
          setAttachedFiles((prev) => [
            ...prev,
            {
              name: file.name,
              kind: 'image',
              size: file.size,
              data: (reader.result as string).split(',')[1],
              mt: file.type,
            },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = () => {
          setAttachedFiles((prev) => [
            ...prev,
            {
              name: file.name,
              kind: 'text',
              size: file.size,
              text: (reader.result as string).slice(0, 100000),
            },
          ]);
        };
        reader.readAsText(file);
      }
    });

    e.target.value = '';
  };

  // Pin message to project memory
  const handlePinToProject = (content: string) => {
    if (!currentProjectId) {
      setIsProjectsOpen(true);
      return;
    }
    const snippet = content.replace(/```[\s\S]*?```/g, ' [kod] ').slice(0, 300);
    setProjects((prev) =>
      prev.map((p) =>
        p.id === currentProjectId
          ? {
              ...p,
              notes: `${p.notes}\n- ${snippet}`,
            }
          : p
      )
    );
    setMascotBubble('Proje hafızasına kaydedildi! 📌');
    setTimeout(() => setMascotBubble(null), 3000);
  };

  // Export Chat
  const handleExportChat = () => {
    if (!currentChat || currentChat.msgs.length === 0) return;
    const text = `# ${currentChat.title}\n\n` +
      currentChat.msgs
        .map((m) => `### ${m.role === 'user' ? 'Kullanıcı' : 'MASTER AI'}:\n${m.content}`)
        .join('\n\n---\n\n');

    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentChat.title.replace(/[^\w-]/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Backup & Restore
  const handleExportBackup = () => {
    const data = {
      version: 1,
      chats,
      projects,
      plugins,
      date: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `master-ai-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (Array.isArray(data.chats)) setChats(data.chats);
        if (Array.isArray(data.projects)) setProjects(data.projects);
        if (Array.isArray(data.plugins)) setPlugins(data.plugins);
        setIsPrivacyOpen(false);
        setMascotBubble('Yedek başarıyla yüklendi! 💾');
        setTimeout(() => setMascotBubble(null), 3500);
      } catch {
        alert('Geçersiz yedek dosyası!');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[var(--bg)] text-[var(--tx)]">
      {/* SVG Gradient definitions for Master Bot */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <linearGradient id="mg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--ac)" />
            <stop offset="100%" stopColor="var(--ac2)" />
          </linearGradient>
        </defs>
      </svg>

      {/* Ambient Animated Orbs */}
      {themeSettings.bgOrbs && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div
            className="absolute -top-[10vmax] -left-[10vmax] w-[45vmax] h-[45vmax] rounded-full blur-[100px] opacity-15"
            style={{
              background: 'var(--ac)',
              animation: 'fl 24s ease-in-out infinite alternate',
            }}
          />
          <div
            className="absolute -bottom-[12vmax] -right-[10vmax] w-[45vmax] h-[45vmax] rounded-full blur-[100px] opacity-15"
            style={{
              background: 'var(--ac2)',
              animation: 'fl 28s ease-in-out infinite alternate-reverse',
            }}
          />
        </div>
      )}

      {/* Left Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={(id) => {
          setCurrentChatId(id);
          setIsSidebarOpen(false);
        }}
        onNewChat={handleNewChat}
        onRenameChat={handleRenameChat}
        onDeleteChat={handleDeleteChat}
        lang={lang}
        onLanguageChange={setLang}
        onOpenCustomizer={() => setIsCustomizerOpen(true)}
        onOpenPlugins={() => setIsPluginsOpen(true)}
        onOpenProjects={() => setIsProjectsOpen(true)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        allowEmojis={themeSettings.allowEmojis}
        onToggleEmojis={() =>
          setThemeSettings((prev) => ({ ...prev, allowEmojis: !prev.allowEmojis }))
        }
        onToggleTheme={() => {
          const next =
            themeSettings.themeMode === 'dark'
              ? 'light'
              : themeSettings.themeMode === 'light'
              ? 'amoled'
              : 'dark';
          setThemeSettings({ ...themeSettings, themeMode: next });
        }}
      />

      {/* Main Chat & Workspace */}
      <main className="relative z-10 flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header Bar */}
        <header className="flex items-center justify-between px-3 md:px-5 py-2.5 border-b border-[var(--gb)] bg-[var(--gl)] backdrop-blur-xl">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--hv)]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-bold text-sm md:text-base brand-font truncate max-w-[180px] md:max-w-xs text-[var(--tx)]">
              {formatWithEmojiPreference(currentChat?.title || t.brand, themeSettings.allowEmojis)}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Project Selector */}
            <select
              value={currentProjectId}
              onChange={(e) => setCurrentProjectId(e.target.value)}
              className="hidden sm:block text-xs py-1.5 px-2.5 rounded-xl bg-[var(--in)] border border-[var(--bd)] text-[var(--tx)] focus:outline-none cursor-pointer max-w-[150px] truncate"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {formatWithEmojiPreference(`📁 ${p.name}`, themeSettings.allowEmojis)}
                </option>
              ))}
            </select>

            {/* Auto-speech toggle */}
            <button
              type="button"
              onClick={() => setAutoSpeakReplies(!autoSpeakReplies)}
              className={`p-2 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 ${
                autoSpeakReplies
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 ring-1 ring-emerald-500/30'
                  : 'bg-[var(--in)] border-[var(--bd)] text-[var(--mu)] hover:text-[var(--tx)]'
              }`}
              title={autoSpeakReplies ? 'Otomatik Sesli Yanıt: Açık' : 'Otomatik Sesli Yanıt: Kapalı'}
            >
              {autoSpeakReplies ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">{autoSpeakReplies ? 'Ses: Açık' : 'Ses: Kapalı'}</span>
            </button>

            {/* Quick Emoji On/Off Button */}
            <button
              onClick={() =>
                setThemeSettings((prev) => ({ ...prev, allowEmojis: !prev.allowEmojis }))
              }
              className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all flex items-center gap-1 ${
                themeSettings.allowEmojis
                  ? 'bg-[var(--in)] border-[var(--bd)] text-emerald-400 hover:bg-[var(--hv)]'
                  : 'bg-red-950/40 border-red-500/40 text-red-300 ring-1 ring-red-500/30'
              }`}
              title={themeSettings.allowEmojis ? 'Emojileri Kapat' : 'Emojileri Aç'}
            >
              {themeSettings.allowEmojis ? '🙂 EMOJİ: AÇIK' : '🚫 EMOJİ: KAPALI'}
            </button>

            {/* Live Studio Toggle Button with Clear Exit State */}
            <button
              onClick={() => setIsStudioOpen(!isStudioOpen)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                isStudioOpen
                  ? 'bg-red-600 hover:bg-red-700 text-white ring-2 ring-red-400/50 shadow-red-900/40'
                  : 'bg-[var(--in)] border border-[var(--bd)] text-[var(--tx)] hover:bg-[var(--hv)]'
              }`}
              title={isStudioOpen ? 'Stüdyodan Çık (Esc)' : 'Canlı Uygulama & Kod Stüdyosu'}
            >
              <Code2 className={`w-4 h-4 ${isStudioOpen ? 'text-white' : 'text-emerald-400'}`} />
              <span>
                {isStudioOpen
                  ? '✕ Stüdyodan Çık'
                  : formatWithEmojiPreference('Canlı Stüdyo', themeSettings.allowEmojis)}
              </span>
            </button>

            {/* Export Chat */}
            <button
              onClick={handleExportChat}
              className="p-2 rounded-xl bg-[var(--in)] border border-[var(--bd)] text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--hv)] transition-colors"
              title="Sohbeti Markdown olarak indir"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Chat Stream / Hero Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-[var(--mw)] mx-auto flex flex-col gap-4">
            {/* When Empty: Hero Screen (Clean and Pure by default) */}
            {(!currentChat || currentChat.msgs.length === 0) && (
              <div className="my-auto py-12 flex flex-col items-center text-center anim-pop">
                {themeSettings.showMascot ? (
                  <Mascot
                    size="hero"
                    interactive={true}
                    onTap={handleMascotTap}
                    bubbleText={mascotBubble}
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[var(--ac)] to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-3">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                )}
                <h2 className="mt-3 text-2xl md:text-3xl font-extrabold brand-font bg-gradient-to-r from-[var(--tx)] via-[var(--ac)] to-emerald-400 bg-clip-text text-transparent">
                  {t.heroTitle}
                </h2>
                <p className="mt-2 text-xs md:text-sm text-[var(--mu)] max-w-md">
                  {t.heroSubtitle}
                </p>

                {/* Starter Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-8 w-full max-w-xl">
                  {t.starterCards.map((card: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(card.prompt)}
                      className="p-3.5 rounded-2xl bg-[var(--gl)] border border-[var(--bd)] hover:border-[var(--ac)] text-left transition-all hover:-translate-y-0.5 hover:shadow-lg group"
                    >
                      <div className="font-semibold text-xs md:text-sm text-[var(--tx)] group-hover:text-[var(--ac)] transition-colors">
                        {formatWithEmojiPreference(card.label, themeSettings.allowEmojis)}
                      </div>
                      <div className="text-[11px] text-[var(--mu)] mt-1 line-clamp-2">
                        {formatWithEmojiPreference(card.prompt, themeSettings.allowEmojis)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Render Chat Messages */}
            {currentChat?.msgs.map((msg, index) => (
              <ChatMessageItem
                key={msg.id}
                message={msg}
                lang={lang}
                onRunInStudio={handleRunInStudio}
                onPinToProject={handlePinToProject}
                onRegenerate={() => {
                  if (isStreaming) return;
                  const lastUser = [...currentChat.msgs].reverse().find((m) => m.role === 'user');
                  if (lastUser) handleSendMessage(lastUser.content);
                }}
                onEditUserMessage={(newContent) => {
                  setInputText(newContent);
                }}
                onVote={(vote, comment) => {
                  setChats((prev) =>
                    prev.map((c) =>
                      c.id === currentChat.id
                        ? {
                            ...c,
                            msgs: c.msgs.map((m) =>
                              m.id === msg.id ? { ...m, vote, voteComment: comment } : m
                            ),
                          }
                        : c
                    )
                  );
                }}
                isLastAssistant={
                  index === currentChat.msgs.length - 1 && msg.role === 'assistant'
                }
              />
            ))}

            {/* Live Streaming Assistant Message */}
            {isStreaming && (
              <div className="flex flex-col items-start anim-pop">
                <div className="max-w-[88%] md:max-w-[80%] rounded-2xl p-4 bg-[var(--gl)] text-[var(--tx)] border border-[var(--gb)] backdrop-blur-md shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-xs text-[var(--ac)] font-semibold">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>{fileAnalysisStatus || 'MASTER AI yanıt üretiyor…'}</span>
                  </div>
                  <div className="text-sm md:text-[15px] whitespace-pre-wrap leading-relaxed">
                    {streamingBuffer || (fileAnalysisStatus ? 'Dosya içeriği taranıyor ve analiz ediliyor…' : 'Düşünülüyor…')}
                  </div>
                </div>
              </div>
            )}

            <div ref={logEndRef} />
          </div>
        </div>

        {/* Floating Mascot Button in Bottom Right */}
        {themeSettings.showMascot && !isStudioOpen && (
          <div className="fixed right-5 bottom-24 z-30 hidden sm:block">
            <Mascot
              size="md"
              isBusy={isStreaming}
              interactive={true}
              onTap={handleMascotTap}
              bubbleText={mascotBubble}
            />
          </div>
        )}

        {/* Input Bar Form */}
        <div className="p-3 md:p-4 bg-[var(--gl)]/80 backdrop-blur-2xl border-t border-[var(--gb)]">
          <div className="max-w-[var(--mw)] mx-auto flex flex-col gap-2">
            {/* Mic Permission Warning Banner */}
            {micPermissionDenied && (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs anim-pop">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{micErrorMessage || 'Sesle konuşabilmek için mikrofon izni gereklidir. Lütfen tarayıcınızın adres çubuğundaki kilit simgesinden mikrofon erişimine izin verin.'}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={handleToggleMic}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold transition-colors"
                  >
                    Tekrar Dene
                  </button>
                  <button
                    type="button"
                    onClick={() => setMicPermissionDenied(false)}
                    className="p-1 text-amber-400/70 hover:text-amber-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Active Voice Dictation Banner */}
            {isMicListening && (
              <div className="flex items-center justify-between px-3.5 py-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs anim-pop">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="font-semibold">🎙️ Dinleniyor... Konuşun (sesiniz metne dökülüyor)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleStopMic();
                      if (inputText.trim()) {
                        handleSendMessage();
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500 text-black font-bold text-[11px] hover:bg-emerald-400 transition-colors flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>Gönder</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleStopMic}
                    className="p-1 text-emerald-400/80 hover:text-white"
                    title="Dinlemeyi Durdur"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* File Analysis Status Feedback */}
            {fileAnalysisStatus && (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs anim-pop">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-blue-400 shrink-0" />
                <span className="font-medium">{fileAnalysisStatus}</span>
              </div>
            )}

            {/* Mode & Attached Files Pills Bar */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Mode Selector Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsModeMenuOpen(!isModeMenuOpen)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--in)] border border-[var(--bd)] text-[var(--tx)] hover:bg-[var(--hv)] transition-colors"
                >
                  <Layers className="w-3 h-3 text-[var(--ac)]" />
                  <span>{formatWithEmojiPreference(t.modes[mode]?.name || mode, themeSettings.allowEmojis)}</span>
                  <ChevronDown className="w-3 h-3 text-[var(--mu)]" />
                </button>

                {isModeMenuOpen && (
                  <div className="absolute bottom-[calc(100%+6px)] left-0 z-30 w-60 p-1.5 rounded-2xl bg-[var(--sb)] border border-[var(--bd)] shadow-2xl space-y-1 anim-pop">
                    {(Object.keys(t.modes) as ModeId[]).map((mId) => (
                      <button
                        key={mId}
                        type="button"
                        onClick={() => {
                          setMode(mId);
                          setIsModeMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-xl text-xs flex flex-col transition-colors ${
                          mode === mId
                            ? 'bg-[var(--acg)] text-white'
                            : 'text-[var(--tx)] hover:bg-[var(--hv)]'
                        }`}
                      >
                        <span className="font-semibold">
                          {formatWithEmojiPreference(t.modes[mId]?.name, themeSettings.allowEmojis)}
                        </span>
                        <span className="text-[10px] opacity-75">
                          {formatWithEmojiPreference(t.modes[mId]?.desc, themeSettings.allowEmojis)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Attached files previews */}
              {attachedFiles.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-[var(--in)] border border-[var(--bd)] text-[var(--tx)]"
                >
                  {file.kind === 'image' ? (
                    <FileImage className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <FileText className="w-3 h-3 text-emerald-400" />
                  )}
                  <span className="max-w-[120px] truncate">{file.name}</span>
                  {file.size && (
                    <span className="text-[10px] text-[var(--mu)]">
                      {(file.size / 1024).toFixed(0)}KB
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setAttachedFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-[var(--mu)] hover:text-red-400 ml-0.5"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Input Box */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-end gap-2 p-2 rounded-2xl bg-[var(--in)] border border-[var(--bd)] focus-within:border-[var(--ac)] transition-colors shadow-inner"
            >
              {/* Attachment Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--hv)] rounded-xl transition-colors shrink-0"
                title="Dosya veya Görsel Ekle (analiz için)"
              >
                <Plus className="w-5 h-5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,text/*,.js,.ts,.tsx,.jsx,.html,.css,.json,.py,.cs,.gd,.md,.svg,.txt,.csv,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Textarea */}
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={1}
                placeholder={isMicListening ? 'Konuşmanız algılanıyor…' : t.inputPlaceholder}
                className="flex-1 bg-transparent border-0 outline-none resize-none text-xs md:text-sm py-2 px-1 text-[var(--tx)] placeholder-[var(--mu)] max-h-36 overflow-y-auto leading-relaxed"
              />

              {/* Voice Dictation (Mic) Button */}
              <button
                type="button"
                onClick={handleToggleMic}
                className={`p-2 rounded-xl transition-all shrink-0 ${
                  isMicListening
                    ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30'
                    : 'text-[var(--mu)] hover:text-emerald-400 hover:bg-[var(--hv)]'
                }`}
                title={isMicListening ? 'Dinlemeyi Durdur' : 'Sesle Konuş / Yazdır'}
              >
                {isMicListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Full Voice Chat Overlay Launcher */}
              <button
                type="button"
                onClick={() => setIsVoiceOpen(true)}
                className="p-2 text-[var(--mu)] hover:text-[var(--ac)] hover:bg-[var(--hv)] rounded-xl transition-colors shrink-0"
                title="Canlı Karşılıklı Sesli Sohbet"
              >
                <Headphones className="w-5 h-5" />
              </button>

              {/* Send or Stop Button */}
              {isStreaming ? (
                <button
                  type="button"
                  onClick={handleStopStreaming}
                  className="p-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white shadow transition-all shrink-0"
                  title="Durdur"
                >
                  <Square className="w-4 h-4 fill-white" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!inputText.trim() && attachedFiles.length === 0}
                  className="p-2.5 rounded-xl bg-[var(--acg)] text-white shadow disabled:opacity-40 hover:opacity-90 transition-all shrink-0"
                  title="Gönder"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              )}
            </form>

            <div className="text-center text-[10px] text-[var(--mu)]">
              {t.disclaimer}
            </div>
          </div>
        </div>
      </main>

      {/* Live Game Studio Panel */}
      <StudioDrawer
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        code={studioCode}
        onCodeChange={setStudioCode}
        lang={lang}
        onAskAiToModify={handleAskAiToModifyGame}
        isAiModifying={isAiModifyingGame}
        allowEmojis={themeSettings.allowEmojis}
      />

      {/* Voice Assistant Overlay */}
      <VoiceOverlay
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        lang={lang}
        onSendTranscript={(msg) => handleSendMessage(msg)}
        isAiBusy={isStreaming}
        lastAssistantText={currentChat?.msgs[currentChat.msgs.length - 1]?.content}
      />

      {/* Modals */}
      <CustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        settings={themeSettings}
        onUpdateSettings={setThemeSettings}
        onResetSettings={() => setThemeSettings(DEFAULT_THEME_SETTINGS)}
      />

      <PluginsModal
        isOpen={isPluginsOpen}
        onClose={() => setIsPluginsOpen(false)}
        plugins={plugins}
        lang={lang}
        onTogglePlugin={(id) =>
          setPlugins((prev) =>
            prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
          )
        }
        onAddCustomPlugin={(pName, pPrompt) => {
          const newPlugin: PluginItem = {
            id: 'c_' + Date.now(),
            name: `🧩 ${pName}`,
            desc: { tr: pPrompt, en: pPrompt, de: pPrompt, es: pPrompt },
            prompt: pPrompt,
            isCustom: true,
            enabled: true,
          };
          setPlugins((prev) => [...prev, newPlugin]);
        }}
        onDeleteCustomPlugin={(id) => {
          setPlugins((prev) => prev.filter((p) => p.id !== id));
        }}
      />

      <ProjectsModal
        isOpen={isProjectsOpen}
        onClose={() => setIsProjectsOpen(false)}
        projects={projects}
        currentProjectId={currentProjectId}
        onSelectProject={(id) => setCurrentProjectId(id)}
        onAddProject={(pName, pNotes) => {
          const newProj: GameProject = {
            id: 'p_' + Date.now(),
            name: pName,
            notes: pNotes,
            createdAt: Date.now(),
          };
          setProjects((prev) => [...prev, newProj]);
          setCurrentProjectId(newProj.id);
        }}
        onUpdateProject={(id, pNotes) => {
          setProjects((prev) =>
            prev.map((p) => (p.id === id ? { ...p, notes: pNotes } : p))
          );
        }}
        onDeleteProject={(id) => {
          setProjects((prev) => prev.filter((p) => p.id !== id));
          if (currentProjectId === id) {
            setCurrentProjectId(projects[0]?.id);
          }
        }}
      />

      <PrivacyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
      />
    </div>
  );
}
