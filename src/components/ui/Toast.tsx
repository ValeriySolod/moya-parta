'use client';

import { AnimatePresence, motion } from 'framer-motion';
import styles from './Toast.module.css';
import { useUiStore } from '@/store/uiStore';

export function Toast() {
  const toast = useUiStore((state) => state.toast);

  return (
    <div className={styles.host} aria-live="polite">
      <AnimatePresence>
        {toast ? (
          <motion.div
            key={toast.message}
            className={`${styles.toast} ${styles[toast.tone]}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            {toast.message}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
