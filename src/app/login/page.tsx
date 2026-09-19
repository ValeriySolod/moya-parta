'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { Button } from '@/components/ui/Button';
import { BrandMark } from '@/components/brand/BrandMark';
import { useAuthStore } from '@/store/authStore';
import { getRoleHomePath } from '@/lib/format';
import styles from './login.module.css';

const schema = z.object({
  email: z.string().min(3, 'Введи логін'),
  password: z.string().min(4, 'Пароль занадто короткий'),
});

type FormValues = z.infer<typeof schema>;

const demos = [
  { role: 'Учень', email: 'student@example.com' },
  { role: 'Вчитель', email: 'teacher@example.com' },
] as const;

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(getRoleHomePath(user.role));
    }
  }, [isAuthenticated, router, user]);

  const onSubmit = handleSubmit(async (values) => {
    setError('');
    try {
      const nextUser = await login(values.email, values.password);
      router.replace(getRoleHomePath(nextUser.role));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Щось пішло не так. Спробуй ще раз',
      );
    }
  });

  return (
    <main className={styles.loginPage}>
      <div className={styles.loginShell}>
        <aside className={styles.visual} aria-hidden="true">
          <Image
            src="/brand/login-panel.png"
            alt=""
            fill
            priority
            sizes="(max-width: 1027px) 100vw, 48vw"
            className={styles.visualImage}
          />
          <div className={styles.visualShade} />
          <div className={styles.visualCopy}>
            <BrandMark href="/" size="md" inverted />
            <p className={styles.visualQuote}>
              Увійди — і сядь за свою парту.
            </p>
          </div>
        </aside>

        <section className={styles.formPane}>
          <div className={styles.formInner}>
            <div className={styles.mobileBrand}>
              <BrandMark href="/" size="lg" tagline />
            </div>

            <header className={styles.formHead}>
              <h1>Вітаємо знову</h1>
              <p className={styles.lead}>
                Увійди, щоб відкрити свій клас і сісти за парту.
              </p>
            </header>

            <form className={styles.form} onSubmit={onSubmit} noValidate>
              <label className={styles.field}>
                <span>Логін</span>
                <input
                  type="text"
                  autoComplete="username"
                  placeholder="твій логін"
                  {...register('email')}
                />
                {errors.email ? <em>{errors.email.message}</em> : null}
              </label>

              <label className={styles.field}>
                <span>Пароль</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                />
                {errors.password ? <em>{errors.password.message}</em> : null}
              </label>

              {error ? <p className={styles.error}>{error}</p> : null}

              <Button type="submit" fullWidth disabled={isSubmitting}>
                {isSubmitting ? 'Заходимо...' : 'Увійти'}
              </Button>
            </form>

            <div className={styles.paths}>
              <p className={styles.pathsLabel}>Немає акаунта?</p>
              <div className={styles.pathRow}>
                <Link href="/register" className={styles.pathBtn}>
                  Я вчитель
                </Link>
                <Link href="/join" className={styles.pathBtn}>
                  У мене є код
                </Link>
              </div>
            </div>

            <div className={styles.demoBlock}>
              <p className={styles.demoLabel}>Швидке демо</p>
              <div className={styles.pathRow}>
                {demos.map((demo) => (
                  <button
                    key={demo.email}
                    type="button"
                    className={styles.demoChip}
                    onClick={() => {
                      setValue('email', demo.email);
                      setValue('password', 'demo1234');
                    }}
                  >
                    {demo.role}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
