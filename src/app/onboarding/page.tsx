'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { studentApi } from '@/services/api';
import { useUiStore } from '@/store/uiStore';
import styles from './onboarding.module.css';

const steps = [
  {
    title: 'Привіт! 👋',
    text: 'Раді бачити тебе в цифровому класі.',
  },
  {
    title: 'Це твоя парта',
    text: 'Тут твоє місце, твій прогрес і твої справи на сьогодні.',
  },
  {
    title: 'Тут живе твій клас',
    text: 'Друзі, дошка класу, події та спільні перемоги.',
  },
  {
    title: 'Тут можна навчатися, грати та ділитися',
    text: 'Завдання, квести, тести і твоя дошка для ідей.',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const showToast = useUiStore((state) => state.showToast);
  const [index, setIndex] = useState(0);
  const isLast = index === steps.length - 1;

  const finish = async () => {
    try {
      await studentApi.completeOnboarding();
      showToast('Готовий? Тоді заходимо в клас!');
      router.replace('/desk');
    } catch {
      showToast('Щось пішло не так. Спробуй ще раз', 'error');
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <AnimatePresence mode="wait">
          <motion.div
            key={steps[index].title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={styles.step}
          >
            <h1>{isLast ? 'Готовий?' : steps[index].title}</h1>
            <p>{isLast ? 'Твоя парта вже чекає.' : steps[index].text}</p>
          </motion.div>
        </AnimatePresence>

        <div className={styles.dots} aria-hidden="true">
          {steps.map((step, i) => (
            <span
              key={step.title}
              className={`${styles.dot} ${i === index ? styles.active : ''}`}
            />
          ))}
        </div>

        <Button
          fullWidth
          onClick={() => {
            if (isLast) {
              void finish();
              return;
            }
            setIndex((value) => value + 1);
          }}
        >
          {isLast ? 'Зайти в клас' : 'Далі'}
        </Button>
      </div>
    </main>
  );
}
