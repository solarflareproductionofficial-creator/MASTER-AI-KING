// Speech recognition and microphone permission helper

export async function requestMicrophonePermission(): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return { ok: false, error: 'Tarayıcınız mikrofon erişimini desteklemiyor.' };
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop tracks immediately after granting permission
    stream.getTracks().forEach((track) => track.stop());
    return { ok: true };
  } catch (err: any) {
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      return { ok: false, error: 'Mikrofon izni reddedildi. Lütfen tarayıcı adres çubuğundaki kilit simgesinden mikrofon iznini verin.' };
    }
    if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      return { ok: false, error: 'Cihazınızda bağlı bir mikrofon bulunamadı.' };
    }
    return { ok: false, error: 'Mikrofon bağlantısı kurulamadı: ' + (err.message || err.name) };
  }
}

export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

export function createSpeechRecognizer(
  lang: string,
  onResult: (text: string, isFinal: boolean) => void,
  onError: (err: string) => void,
  onEnd: () => void
) {
  const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRec) return null;

  try {
    const recognition = new SpeechRec();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang === 'tr' ? 'tr-TR' : lang === 'de' ? 'de-DE' : lang === 'es' ? 'es-ES' : 'en-US';

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          final += item[0].transcript;
        } else {
          interim += item[0].transcript;
        }
      }
      onResult(final || interim, Boolean(final));
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        onError(event.error);
      }
    };

    recognition.onend = () => {
      onEnd();
    };

    return recognition;
  } catch (err) {
    console.error('Failed to create recognizer:', err);
    return null;
  }
}

export function speakText(text: string, lang: string, onEnd?: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();

  // Strip code blocks and markdown symbols before reading aloud
  const clean = text
    .replace(/```[\s\S]*?```/g, ' [kod bloğu] ')
    .replace(/[*_#`~|<>]/g, '')
    .slice(0, 500);

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.lang = lang === 'tr' ? 'tr-TR' : lang === 'de' ? 'de-DE' : lang === 'es' ? 'es-ES' : 'en-US';
  utterance.rate = 1.05;

  // Select suitable voice if available
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find((v) => v.lang.startsWith(utterance.lang.slice(0, 2)));
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);
}
