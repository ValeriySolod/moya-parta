'use client';

import { useEffect } from 'react';
import { MessageCircle, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { NavCount } from '@/components/navigation/NavCount';
import { useNavBadges } from '@/hooks/useNavBadges';
import { navApi } from '@/services/api';
import { hydrateChatDockPreference, useUiStore } from '@/store/uiStore';
import styles from './ChatDock.module.css';

export function ChatDock() {
  const chatDockOpen = useUiStore((state) => state.chatDockOpen);
  const setChatDockOpen = useUiStore((state) => state.setChatDockOpen);
  const toggleChatDock = useUiStore((state) => state.toggleChatDock);
  const { badges } = useNavBadges();
  const queryClient = useQueryClient();

  useEffect(() => {
    hydrateChatDockPreference();
  }, []);

  useEffect(() => {
    if (!chatDockOpen) {
      return;
    }

    void navApi.markSeen('chat').then((next) => {
      queryClient.setQueryData(['nav-badges'], next);
    });
  }, [chatDockOpen, queryClient]);

  if (!chatDockOpen) {
    return (
      <aside className={styles.collapsed} aria-label="Чат приховано">
        <button
          type="button"
          className={styles.expandBtn}
          onClick={() => setChatDockOpen(true)}
          aria-label={
            badges.chat
              ? `Відкрити чат, ${badges.chat} нових`
              : 'Відкрити чат'
          }
        >
          <span className={styles.iconWrap}>
            <MessageCircle size={22} aria-hidden="true" />
            <NavCount count={badges.chat} label="Чат" />
          </span>
          <PanelRightOpen size={18} aria-hidden="true" />
        </button>
      </aside>
    );
  }

  return (
    <aside className={styles.dock} aria-label="Чат класу">
      <header className={styles.head}>
        <div className={styles.headTitle}>
          <MessageCircle size={18} aria-hidden="true" />
          <strong>Чат</strong>
        </div>
        <button
          type="button"
          className={styles.hideBtn}
          onClick={toggleChatDock}
          aria-label="Приховати чат"
          title="Приховати"
        >
          <PanelRightClose size={18} aria-hidden="true" />
        </button>
      </header>
      <div className={styles.body}>
        <ChatPanel compact />
      </div>
    </aside>
  );
}
