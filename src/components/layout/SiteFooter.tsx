import styles from './SiteFooter.module.css';

const GITHUB_URL = 'https://github.com/tony-kobs';
const OWNER_NAME = 'Antony Kobys';
const YEAR = 2026;

function CopyrightLine() {
  return (
    <p className={styles.line}>
      <span>
        © {YEAR} {OWNER_NAME}
      </span>
      <span className={styles.dot} aria-hidden="true">
        ·
      </span>
      <a
        href={GITHUB_URL}
        className={styles.link}
        target="_blank"
        rel="noopener noreferrer"
      >
        GitHub
      </a>
    </p>
  );
}

export function SiteFooter({
  variant = 'page',
}: {
  variant?: 'page' | 'inline';
}) {
  if (variant === 'inline') {
    return <CopyrightLine />;
  }

  return (
    <footer className={styles.footer}>
      <CopyrightLine />
    </footer>
  );
}
