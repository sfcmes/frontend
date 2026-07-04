// [MES] AiChatPage — full-page AI assistant
import { useState } from 'react';
import PageContainer from 'src/components/container/PageContainer';
import { Icon } from 'src/components/mes/Icon';
import { ConfirmDialog } from 'src/components/mes/ui';
import { useAiChat } from 'src/components/mes/ai/useAiChat';
import { ChatConversation } from 'src/components/mes/ai/ChatConversation';

const AiChatPage = () => {
  const { messages, pending, send, clear } = useAiChat();
  const [confirmClear, setConfirmClear] = useState(false);

  // Height fills the shell's <main> content box (viewport minus topbar + main
  // padding, and the reserved bottom-nav space below md) so the message list
  // scrolls internally instead of the page.
  return (
    <PageContainer title="ผู้ช่วย AI" description="ผู้ช่วย AI สำหรับสอบถามข้อมูลการผลิต">
      <div className="mes-card flex flex-col h-[calc(100dvh-9rem)] md:h-[calc(100dvh-5.5rem)]">
        <div className="flex items-center gap-3 px-4 py-3 md:px-5 border-b border-mes-border shrink-0">
          <span className="text-mes-accent"><Icon name="message-chatbot" size={22} /></span>
          <h1 className="text-lg font-semibold text-mes-text flex-1 min-w-0 truncate">ผู้ช่วย AI</h1>
          <button
            type="button"
            className="mes-btn mes-btn-ghost text-xs"
            onClick={() => setConfirmClear(true)}
            disabled={messages.length === 0}
          >
            <Icon name="trash" size={16} /> ล้างบทสนทนา
          </button>
        </div>

        <ChatConversation messages={messages} pending={pending} onSend={send} />
      </div>

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => { clear(); setConfirmClear(false); }}
        title="ล้างบทสนทนาทั้งหมด?"
        message="ประวัติการสนทนาทั้งหมดจะถูกลบและไม่สามารถกู้คืนได้"
        confirmLabel="ล้างบทสนทนา"
        danger
      />
    </PageContainer>
  );
};

export default AiChatPage;
