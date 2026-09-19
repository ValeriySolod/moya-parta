import Image from 'next/image';
import Link from 'next/link';
import styles from './BrandMark.module.css';

type BrandMarkProps = {
  href?: string;
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  tagline?: boolean;
  inverted?: boolean;
};

const sizes = {
  sm: 32,
  md: 44,
  lg: 64,
} as const;

export function BrandMark({
  href = '/',
  size = 'md',
  showWordmark = true,
  tagline = false,
  inverted = false,
}: BrandMarkProps) {
  const px = sizes[size];
  const content = (
    <span
      className={`${styles.mark} ${styles[size]} ${inverted ? styles.inverted : ''}`}
    >
      <Image
        src="/brand/logo.png"
        alt=""
        width={px}
        height={px}
        className={styles.logo}
        priority={size !== 'sm'}
      />
      {showWordmark ? (
        <span className={styles.text}>
          <strong className={styles.name}>Моя парта</strong>
          {tagline ? (
            <span className={styles.tagline}>Твоє місце в класі</span>
          ) : null}
        </span>
      ) : null}
    </span>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className={styles.link} aria-label="Моя парта — на головну">
      {content}
    </Link>
  );
}
