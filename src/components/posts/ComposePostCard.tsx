'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { studentApi } from '@/services/api';
import { useUiStore } from '@/store/uiStore';
import styles from './ComposePostCard.module.css';

const schema = z.object({
  text: z.string().min(1, 'Напиши, чим хочеш поділитись'),
});

type FormValues = z.infer<typeof schema>;

const emojiOptions = ['🌳', '🎨', '🐶', '📚', '🚀', '🏅', '⚽', '🌈'];

type ComposePostCardProps = {
  invalidateKeys?: string[][];
};

export function ComposePostCard({
  invalidateKeys = [['class'], ['board'], ['desk']],
}: ComposePostCardProps) {
  const showToast = useUiStore((state) => state.showToast);
  const queryClient = useQueryClient();
  const [selectedEmoji, setSelectedEmoji] = useState('🎨');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { text: '' },
  });

  const createMutation = useMutation({
    mutationFn: (values: FormValues) =>
      studentApi.createPost({
        text: values.text,
        imageEmoji: selectedEmoji,
        category: 'творчість',
      }),
    onSuccess: () => {
      reset();
      setSelectedEmoji('🎨');
      showToast('Показано класу!');
      invalidateKeys.forEach((queryKey) => {
        void queryClient.invalidateQueries({ queryKey });
      });
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : 'Не вдалося опублікувати', 'error');
    },
  });

  return (
    <div id="compose">
      <Card className={styles.card}>
      <div className={styles.head}>
        <h2>Що в тебе нового?</h2>
        <p className={styles.hint}>Чим хочеш поділитись з класом?</p>
      </div>

      <form
        className={styles.form}
        onSubmit={handleSubmit((values) => createMutation.mutate(values))}
      >
        <textarea
          rows={3}
          placeholder="Напиши тут — малюнок, пригода, книжка чи просто гарний день…"
          {...register('text')}
        />
        {errors.text ? <em>{errors.text.message}</em> : null}

        <div className={styles.emojiRow} role="group" aria-label="Обери іконку">
          {emojiOptions.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className={`${styles.emoji} ${
                selectedEmoji === emoji ? styles.emojiActive : ''
              }`}
              onClick={() => setSelectedEmoji(emoji)}
              aria-label={`Обрати ${emoji}`}
              aria-pressed={selectedEmoji === emoji}
            >
              {emoji}
            </button>
          ))}
        </div>

        <Button type="submit" fullWidth disabled={createMutation.isPending}>
          Показати класу
        </Button>
      </form>
      </Card>
    </div>
  );
}
