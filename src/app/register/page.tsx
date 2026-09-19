'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { Button } from '@/components/ui/Button';
import { BrandMark } from '@/components/brand/BrandMark';
import {
  AvatarPicker,
  type AvatarOption,
} from '@/components/ui/AvatarPicker';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import styles from '../login/login.module.css';

const schema = z.object({
  displayName: z.string().min(2, 'Напиши своє імʼя'),
  login: z.string().min(3, 'Придумай логін'),
  password: z.string().min(4, 'Пароль занадто короткий'),
});

type FormValues = z.infer<typeof schema>;

const TEACHER_AVATARS: AvatarOption[] = [
  { id: 'neutral', emoji: '🧑‍🏫', label: 'Учитель' },
  { id: 'man', emoji: '👨‍🏫', label: 'Учитель чоловік' },
  { id: 'woman', emoji: '👩‍🏫', label: 'Учителька' },
];

export default function RegisterTeacherPage() {
  const router = useRouter();
  const acceptSession = useAuthStore((state) => state.acceptSession);
  const [error, setError] = useState('');
  const [avatarEmoji, setAvatarEmoji] = useState(TEACHER_AVATARS[0].emoji);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setError('');
    try {
      const result = await authApi.registerTeacher({
        ...values,
        avatarEmoji,
      });
      acceptSession(result.token, result.user);
      router.replace('/teacher');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Щось пішло не так. Спробуй ще раз',
      );
    }
  });

  return (
    <main className={styles.page}>
      <form className={styles.card} onSubmit={onSubmit}>
        <BrandMark href="/" size="lg" />
        <h1>Створити кабінет учителя</h1>
        <p className={styles.lead}>
          Після реєстрації ти створиш клас і отримаєш код для учнів.
        </p>

        <label className={styles.field}>
          <span>Як до тебе звертатися?</span>
          <input
            placeholder="Наприклад: Андрій Петрович"
            {...register('displayName')}
          />
          {errors.displayName ? <em>{errors.displayName.message}</em> : null}
        </label>

        <div className={styles.field}>
          <span>Обери аватар</span>
          <AvatarPicker
            options={TEACHER_AVATARS}
            value={avatarEmoji}
            onChange={setAvatarEmoji}
          />
        </div>

        <label className={styles.field}>
          <span>Логін</span>
          <input placeholder="andriy" {...register('login')} />
          {errors.login ? <em>{errors.login.message}</em> : null}
        </label>

        <label className={styles.field}>
          <span>Пароль</span>
          <input type="password" {...register('password')} />
          {errors.password ? <em>{errors.password.message}</em> : null}
        </label>

        {error ? <p className={styles.error}>{error}</p> : null}

        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? 'Створюємо...' : 'Зареєструватися'}
        </Button>

        <p className={styles.hint}>
          Вже є акаунт? <Link href="/login">Увійти</Link>
        </p>
      </form>
      <SiteFooter />
    </main>
  );
}
