'use client';

import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/navigation/AppShell';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/store/authStore';
import styles from './profile.module.css';

export default function ProfilePage() {
  return (
    <AppShell title="Профіль" allowedRoles={['student', 'teacher']}>
      <ProfileContent />
    </AppShell>
  );
}

function ProfileContent() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  if (!user) {
    return null;
  }

  return (
    <Card className={styles.card}>
      <Avatar
        emoji={user.avatarEmoji}
        color={user.avatarColor}
        size="xl"
        label={user.displayName}
      />
      <h1>{user.displayName}</h1>
      <p>{user.email}</p>
      <p className={styles.role}>
        {user.role === 'student' ? 'Учень' : 'Учитель'}
      </p>
      <Button
        variant="ghost"
        fullWidth
        onClick={() => {
          logout();
          router.replace('/');
        }}
      >
        Вийти
      </Button>
    </Card>
  );
}
