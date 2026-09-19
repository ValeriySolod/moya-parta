'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AppShell } from '@/components/navigation/AppShell';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SectionCard } from '@/components/ui/SectionCard';
import { XPBar } from '@/components/ui/XPBar';
import { HomeworkCard } from '@/components/learning/HomeworkCard';
import { ComposePostCard } from '@/components/posts/ComposePostCard';
import { studentApi } from '@/services/api';
import { formatEventRange } from '@/lib/format';
import {
  computeXpProgress,
  describeHowToEarnXp,
  describeXpProgress,
  pickNextReward,
} from '@/lib/xpProgress';
import styles from './desk.module.css';

export default function DeskPage() {
  return (
    <AppShell title="Моя парта" allowedRoles={['student']}>
      <DeskContent />
    </AppShell>
  );
}

function DeskContent() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['desk'],
    queryFn: studentApi.getDesk,
  });

  const { data: backpack } = useQuery({
    queryKey: ['backpack'],
    queryFn: studentApi.getBackpack,
  });

  const [bannerImageFailed, setBannerImageFailed] = useState(false);

  if (isLoading) {
    return <LoadingState label="Готуємо твою парту..." />;
  }

  if (isError || !data) {
    return (
      <EmptyState
        title="Щось пішло не так"
        description="Спробуй ще раз відкрити парту."
      />
    );
  }

  const xpProgress = computeXpProgress(data.profile.xp, data.profile.xpToNextLevel);
  const showBannerImage = !bannerImageFailed;
  const nextReward = pickNextReward(backpack);

  return (
    <div className={styles.page}>
      <motion.section
        className={`${styles.hero} ${!showBannerImage ? styles.heroFallback : ''}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className={styles.heroArt} aria-hidden="true">
          {showBannerImage ? (
            <Image
              src="/brand/desk-scene.png"
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 60vw"
              className={styles.heroArtImage}
              priority
              onError={() => setBannerImageFailed(true)}
            />
          ) : null}
          <div className={styles.heroArtShade} />
        </div>

        <div className={styles.heroBody}>
          <Avatar
            emoji={data.user.avatarEmoji}
            color={data.user.avatarColor}
            size="lg"
            label={data.user.displayName}
          />
          <div className={styles.heroCopy}>
            <p className={styles.hello}>Привіт, {data.user.displayName}!</p>
            <h1 className={styles.className}>{data.className} клас</h1>
            <div className={styles.xpWrap}>
              <XPBar
                level={data.profile.level}
                xp={xpProgress.xp}
                xpToNextLevel={xpProgress.xpToNextLevel}
                xpRemaining={xpProgress.xpRemaining}
                isLevelComplete={xpProgress.isLevelComplete}
                hasValidData={xpProgress.hasValidData}
                progressDescription={describeXpProgress(xpProgress)}
                howToEarnXp={describeHowToEarnXp(data.dailyGoal)}
                nextReward={
                  nextReward
                    ? { icon: nextReward.icon, title: nextReward.title }
                    : null
                }
                inverted
              />
            </div>
          </div>
        </div>
      </motion.section>

      <div className={styles.layout}>
        <div className={styles.composeWrap}>
          <ComposePostCard />
        </div>

        <section className={styles.primary}>
          <SectionCard
            tone="learning"
            title="Сьогодні"
            iconSrc="/brand/dash-learning.png"
            action={<span className={styles.pillWarm}>Крок</span>}
          >
            {data.todayHomework.length === 0 ? (
              <p className={styles.emptyLine}>Нових завдань немає</p>
            ) : (
              <div className={styles.stack}>
                {data.todayHomework.map((homework) => (
                  <HomeworkCard
                    key={homework.id}
                    homework={homework}
                    onAction={() => {
                      window.location.href = `/learning/homework/${homework.id}`;
                    }}
                  />
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            tone="wins"
            title="Маленька ціль"
            iconSrc="/brand/dash-wins.png"
          >
            <div className={styles.goalRow}>
              <p className={styles.goalTitle}>{data.dailyGoal.title}</p>
              <span className={styles.goalXp}>+{data.dailyGoal.xp} XP</span>
            </div>
          </SectionCard>
        </section>

        <aside className={styles.secondary}>
          <SectionCard
            tone="board"
            title="У класі"
            iconSrc="/brand/dash-board.png"
            action={
              <Link href="/class" className={styles.link}>
                Відкрити
              </Link>
            }
          >
            {data.latestPosts[0] ? (
              <p className={styles.postPreview}>{data.latestPosts[0].text}</p>
            ) : (
              <p className={styles.emptyLine}>Дошка ще порожня</p>
            )}
          </SectionCard>

          <SectionCard
            tone="events"
            title="Подія"
            iconSrc="/brand/dash-events.png"
            action={
              data.nextEvent ? (
                <Link href="/events" className={styles.link}>
                  Деталі
                </Link>
              ) : null
            }
          >
            {data.nextEvent ? (
              <>
                <p className={styles.compactTitle}>{data.nextEvent.title}</p>
                <p className={styles.muted}>
                  {formatEventRange(
                    data.nextEvent.startsAt,
                    data.nextEvent.endsAt,
                  )}
                </p>
              </>
            ) : (
              <p className={styles.emptyLine}>Подій поки немає</p>
            )}
          </SectionCard>

          <SectionCard
            tone="class"
            title="Мета класу"
            iconSrc="/brand/dash-class.png"
          >
            <p className={styles.compactTitle}>{data.classGoal.title}</p>
            <ProgressBar
              value={data.classGoal.current}
              max={data.classGoal.target}
              label={`${data.classGoal.current} / ${data.classGoal.target} XP`}
              tone="secondary"
            />
          </SectionCard>

          <SectionCard
            tone="wins"
            title="Перемоги"
            iconSrc="/brand/dash-wins.png"
            action={
              <Link href="/wins" className={styles.link}>
                Усі
              </Link>
            }
          >
            <div className={styles.wins}>
              {data.recentAchievements.slice(0, 3).map((item) => (
                <div key={item.id} className={styles.win}>
                  <span aria-hidden="true">{item.icon}</span>
                  <strong>{item.title}</strong>
                </div>
              ))}
            </div>
          </SectionCard>
        </aside>
      </div>
    </div>
  );
}
