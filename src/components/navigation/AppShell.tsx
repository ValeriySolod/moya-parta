'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import styles from './AppShell.module.css';
import { Sidebar } from './Sidebar';
import { BottomNavigation } from './BottomNavigation';
import { AppHeader } from './AppHeader';
import { Toast } from '@/components/ui/Toast';
import { LoadingState } from '@/components/ui/LoadingState';
import { ChatDock } from '@/components/chat/ChatDock';
import { useAuthStore } from '@/store/authStore';
import { sectionFromPath } from '@/hooks/useNavBadges';
import { navApi } from '@/services/api';
import type { UserRole } from '@/types';
import type { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
  title?: string;
  allowedRoles: UserRole[];
}

export function AppShell({ children, title, allowedRoles }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { user, isLoading, isAuthenticated, bootstrap } = useAuthStore();
  const lastMarked = useRef<string | null>(null);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated || !user) {
      router.replace('/');
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      router.replace('/');
    }
  }, [allowedRoles, isAuthenticated, isLoading, router, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const section = sectionFromPath(pathname);
    if (!section) {
      lastMarked.current = null;
      return;
    }

    if (lastMarked.current === section) {
      return;
    }

    lastMarked.current = section;

    void navApi.markSeen(section).then((badges) => {
      queryClient.setQueryData(['nav-badges'], badges);
      if (
        section === 'notifications' ||
        section === 'chat' ||
        section === 'wins' ||
        section === 'events'
      ) {
        void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
    });
  }, [pathname, user, queryClient]);

  if (isLoading || !user) {
    return (
      <div className={styles.loading}>
        <LoadingState label="Відкриваємо твій клас..." />
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.main}>
        <AppHeader title={title} />
        <div className={styles.content}>{children}</div>
      </div>
      <ChatDock />
      <BottomNavigation />
      <Toast />
    </div>
  );
}
