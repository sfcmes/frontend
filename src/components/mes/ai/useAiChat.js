// [MES] useAiChat — chat state, sessionStorage persistence, send loop
import { useCallback, useEffect, useRef, useState } from 'react';
import { sendAiChat } from 'src/utils/api';

const STORAGE_KEY = 'mes-ai-chat-v1';
const MAX_STORED = 30;
const ERROR_FALLBACK = 'ขออภัย เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่';

function loadStored() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (parsed && parsed.v === 1 && Array.isArray(parsed.messages)) return parsed.messages;
    return [];
  } catch {
    return [];
  }
}

// Trim persisted history: keep the 30 most recent messages and drop `datasets`
// from every message older than the latest assistant reply (bloat control —
// only the newest answer's raw rows are likely to be re-rendered).
function toStored(messages) {
  const recent = messages.slice(-MAX_STORED);
  let lastAssistant = -1;
  for (let i = recent.length - 1; i >= 0; i -= 1) {
    if (recent[i].role === 'assistant') { lastAssistant = i; break; }
  }
  return recent.map((m, i) => (i < lastAssistant ? { ...m, datasets: undefined } : m));
}

export function useAiChat() {
  const [messages, setMessages] = useState(loadStored);
  const [pending, setPending] = useState(false);

  // Refs keep `send` stable while always reading fresh state.
  const messagesRef = useRef(messages);
  const pendingRef = useRef(pending);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { pendingRef.current = pending; }, [pending]);

  // Persist on every change.
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, messages: toStored(messages) }));
    } catch {
      /* storage full / unavailable — non-fatal */
    }
  }, [messages]);

  const send = useCallback(async (text) => {
    const content = (text || '').trim();
    if (!content || pendingRef.current) return;

    const userMsg = { id: crypto.randomUUID(), role: 'user', content, ts: Date.now() };
    const next = [...messagesRef.current, userMsg];
    setMessages(next);
    setPending(true);

    try {
      const payload = next.slice(-10).map((m) => ({ role: m.role, content: m.content }));
      const { data } = await sendAiChat(payload);
      setMessages((cur) => [...cur, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.reply,
        links: data.links,
        charts: data.charts,
        datasets: data.datasets,
        ts: Date.now(),
      }]);
    } catch (err) {
      setMessages((cur) => [...cur, {
        id: crypto.randomUUID(),
        role: 'assistant',
        error: true,
        content: err.response?.data?.reply || ERROR_FALLBACK,
        ts: Date.now(),
      }]);
    } finally {
      setPending(false);
    }
  }, []);

  const clear = useCallback(() => {
    setMessages([]);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* non-fatal */
    }
  }, []);

  return { messages, pending, send, clear };
}
