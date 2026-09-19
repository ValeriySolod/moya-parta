'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Backpack,
  BookOpen,
  LogOut,
  School,
  Trophy,
  Armchair,
  LayoutDashboard,
  ClipboardList,
  Shield,
  Link2,
  CalendarDays,
  Map,
} from 'lucide-react';
import styles from './Sidebar.module.css';
import { BrandMark } from '@/components/brand/BrandMark';
import { useAuthStore } from '@/store/authStore';
import { Avatar } from '@/components/ui/Avatar';
import { NavCount } from './NavCount';
import { badgeForHref, useNavBadges } from '@/hooks/useNavBadges';

const studentLinks = [
  { href: '/desk', label: 'Моя парта', icon: Armchair, tone: 'today' },
  { href: '/class', label: 'Мій клас', icon: School, tone: 'class' },
  { href: '/quests', label: 'Квести', icon: Map, tone: 'learning' },
  { href: '/events', label: 'Події', icon: CalendarDays, tone: 'events' },
  { href: '/learning', label: 'Навчання', icon: BookOpen, tone: 'learning' },
  { href: '/wins', label: 'Мої перемоги', icon: Trophy, tone: 'wins' },
  { href: '/backpack', label: 'Мій рюкзак', icon: Backpack, tone: 'tasks' },
];

const teacherLinks = [
  { href: '/teacher', label: 'Сьогодні', icon: LayoutDashboard, tone: 'today' },
  { href: '/teacher/class', label: 'Мій клас', icon: School, tone: 'class' },
  { href: '/teacher/tasks', label: 'Завдання', icon: ClipboardList, tone: 'tasks' },
  { href: '/teacher/events', label: 'Події', icon: CalendarDays, tone: 'events' },
  { href: '/teacher/moderation', label: 'Дошка', icon: Shield, tone: 'board' },
];

function isNavActive(pathname: string, href: string): boolean {
  if (pathname === href) {
    return true;
  }

  if (href === '/teacher' || href === '/desk') {
    return false;
  }

  return pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { badges } = useNavBadges();

  if (!user) {
    return null;
  }

  const links = user.role === 'teacher' ? teacherLinks : studentLinks;
  const inviteActive = pathname.startsWith('/teacher/invite');

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <BrandMark
          href={user.role === 'teacher' ? '/teacher' : '/desk'}
          size="md"
          tagline
        />
      </div>

      <nav className={styles.nav} aria-label="Основна навігація">
        {links.map((link) => {
          const Icon = link.icon;
          const count = badgeForHref(link.href, badges, user.role);
          const active = isNavActive(pathname, link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.link} ${styles[`tone_${link.tone}`]} ${active ? styles.active : ''}`}
            >
              <span className={styles.iconWrap}>
                <Icon size={20} aria-hidden="true" />
                <NavCount count={count} label={link.label} />
              </span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        {user.role === 'teacher' ? (
          <Link
            href="/teacher/invite"
            className={`${styles.link} ${styles.tone_invite} ${inviteActive ? styles.active : ''}`}
          >
            <span className={styles.iconWrap}>
              <Link2 size={20} aria-hidden="true" />
            </span>
            <span>Запросити</span>
          </Link>
        ) : null}
        <Link href="/profile" className={styles.profile}>
          <Avatar
            emoji={user.avatarEmoji}
            color={user.avatarColor}
            size="sm"
            label={user.displayName}
          />
          <span>{user.displayName}</span>
        </Link>
        <button type="button" className={styles.logout} onClick={handleLogout}>
          <LogOut size={18} aria-hidden="true" />
          Вийти
        </button>
      </div>
    </aside>
  );
}
