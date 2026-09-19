'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Armchair,
  BookOpen,
  School,
  Trophy,
  LayoutDashboard,
  ClipboardList,
  Shield,
  MessageCircle,
  CalendarDays,
} from 'lucide-react';
import styles from './BottomNavigation.module.css';
import { useAuthStore } from '@/store/authStore';
import { NavCount } from './NavCount';
import { badgeForHref, useNavBadges } from '@/hooks/useNavBadges';

const studentLinks = [
  { href: '/desk', label: 'Парта', icon: Armchair },
  { href: '/class', label: 'Клас', icon: School },
  { href: '/chat', label: 'Чат', icon: MessageCircle },
  { href: '/learning', label: 'Навчання', icon: BookOpen },
  { href: '/wins', label: 'Перемоги', icon: Trophy },
];

const teacherLinks = [
  { href: '/teacher', label: 'Сьогодні', icon: LayoutDashboard },
  { href: '/chat', label: 'Чат', icon: MessageCircle },
  { href: '/teacher/tasks', label: 'Завдання', icon: ClipboardList },
  { href: '/teacher/events', label: 'Події', icon: CalendarDays },
  { href: '/teacher/moderation', label: 'Дошка', icon: Shield },
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

export function BottomNavigation() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const { badges } = useNavBadges();

  if (!user) {
    return null;
  }

  const links = user.role === 'teacher' ? teacherLinks : studentLinks;

  return (
    <nav className={styles.nav} aria-label="Мобільна навігація">
      {links.map((link) => {
        const Icon = link.icon;
        const active = isNavActive(pathname, link.href);
        const count = badgeForHref(link.href, badges, user.role);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`${styles.link} ${active ? styles.active : ''}`}
          >
            <span className={styles.iconWrap}>
              <Icon size={22} aria-hidden="true" />
              <NavCount count={count} label={link.label} />
            </span>
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
