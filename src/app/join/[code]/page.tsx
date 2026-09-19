'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { Button } from '@/components/ui/Button';
import { BrandMark } from '@/components/brand/BrandMark';
import {
  AvatarPicker,
  type AvatarOption,
} from '@/components/ui/AvatarPicker';
import { LoadingState } from '@/components/ui/LoadingState';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import styles from '../../login/login.module.css';
import pageStyles from '../join.module.css';

const schema = z.object({
  displayName: z.string().min(2, 'Напиши своє імʼя'),
  login: z.string().min(3, 'Придумай логін'),
  password: z.string().min(4, 'Пароль занадто короткий'),
});

type FormValues = z.infer<typeof schema>;

const AVATARS: AvatarOption[] = [
  { id: 'fox', emoji: '🦊', label: 'Лисичка' },
  { id: 'bear', emoji: '🐻', label: 'Ведмедик' },
  { id: 'bunny', emoji: '🐰', label: 'Зайчик' },
  { id: 'tiger', emoji: '🐯', label: 'Тигреня' },
  { id: 'frog', emoji: '🐸', label: 'Жабка' },
  { id: 'panda', emoji: '🐼', label: 'Панда' },
  { id: 'unicorn', emoji: '🦄', label: 'Єдиноріг' },
  { id: 'penguin', emoji: '🐧', label: 'Пінгвін' },
];

export default function JoinClassPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const acceptSession = useAuthStore((state) => state.acceptSession);
  const [avatarEmoji, setAvatarEmoji] = useState(AVATARS[0].emoji);
  const [error, setError] = useState('');
  const code = (() => {
    try {
      return decodeURIComponent(String(params.code ?? '')).toUpperCase();
    } catch {
      return String(params.code ?? '').toUpperCase();
    }
  })();

  const previewQuery = useQuery({
    queryKey: ['invite', code],
    queryFn: () => authApi.getInvitePreview(code),
    enabled: code.length >= 3,
    retry: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  if (previewQuery.isLoading) {
    return (
      <main className={pageStyles.page}>
        <LoadingState label="Шукаємо клас..." />
        <SiteFooter />
      </main>
    );
  }

  if (previewQuery.isError || !previewQuery.data) {
    return (
      <main className={pageStyles.page}>
        <div className={styles.card}>
          <h1>Код не знайдено</h1>
          <p className={styles.lead}>Перевір код у вчителя і спробуй ще раз.</p>
          <Link href="/join">
            <Button fullWidth>Ввести інший код</Button>
          </Link>
        </div>
        <SiteFooter />
      </main>
    );
  }

  const preview = previewQuery.data;

  const onSubmit = handleSubmit(async (values) => {
    setError('');
    try {
      const result = await authApi.registerStudent({
        inviteCode: preview.inviteCode,
        displayName: values.displayName,
        login: values.login,
        password: values.password,
        avatarEmoji,
      });
      acceptSession(result.token, result.user);
      router.replace('/onboarding');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Щось пішло не так. Спробуй ще раз',
      );
    }
  });

  return (
    <main className={pageStyles.page}>
      <form className={`${styles.card} ${pageStyles.card}`} onSubmit={onSubmit}>
        <BrandMark href="/" size="lg" />
        <h1>Привіт у класі {preview.className}!</h1>
        <p className={styles.lead}>
          Учитель: {preview.teacherName}. У класі вже {preview.studentsCount} учнів.
        </p>

        <label className={styles.field}>
          <span>Твоє імʼя</span>
          <input placeholder="Марійка" {...register('displayName')} />
          {errors.displayName ? <em>{errors.displayName.message}</em> : null}
        </label>

        <div className={styles.field}>
          <span>Обери аватар</span>
          <AvatarPicker
            options={AVATARS}
            value={avatarEmoji}
            onChange={setAvatarEmoji}
          />
        </div>

        <label className={styles.field}>
          <span>Логін</span>
          <input placeholder="mariyka" {...register('login')} />
          {errors.login ? <em>{errors.login.message}</em> : null}
        </label>

        <label className={styles.field}>
          <span>Пароль</span>
          <input type="password" {...register('password')} />
          {errors.password ? <em>{errors.password.message}</em> : null}
        </label>

        {error ? <p className={styles.error}>{error}</p> : null}

        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? 'Заходимо...' : 'Зайти в клас'}
        </Button>
      </form>
      <SiteFooter />
    </main>
  );
}
