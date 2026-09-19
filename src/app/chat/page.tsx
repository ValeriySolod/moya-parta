'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/navigation/AppShell';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { getRoleHomePath } from '@/lib/format';

const DESKTOP_MQ = '(min-width: 1028px)';

export default function ChatPage() {
  return (
    <AppShell title="Чат" allowedRoles={['student', 'teacher']}>
      <ChatPageContent />
    </AppShell>
  );
}

function ChatPageContent() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setChatDockOpen = useUiStore((state) => state.setChatDockOpen);

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_MQ);

    const sync = () => {
      if (media.matches && user) {
        setChatDockOpen(true);
        router.replace(getRoleHomePath(user.role));
      }
    };

    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, [router, setChatDockOpen, user]);

  return (
    <div className="chat-page-mobile">
      <ChatPanel />
    </div>
  );
}
