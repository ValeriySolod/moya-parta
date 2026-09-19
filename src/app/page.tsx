import Image from 'next/image';
import Link from 'next/link';
import { BrandMark } from '@/components/brand/BrandMark';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { Button } from '@/components/ui/Button';
import styles from './page.module.css';

const steps = [
  {
    title: 'Вчитель створює клас',
    text: 'Реєстрація, назва класу і код для учнів.',
    icon: '/brand/icon-create-class.png',
    alt: '',
  },
  {
    title: 'Учні заходять за кодом',
    text: 'Посилання або короткий код — і дитина вже в класі. За потреби допоможе мама чи тато.',
    icon: '/brand/icon-join-code.png',
    alt: '',
  },
  {
    title: 'Життя класу починається',
    text: 'Парта, дошка, завдання, квести й маленькі перемоги.',
    icon: '/brand/icon-class-life.png',
    alt: '',
  },
] as const;

export default function LandingPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <BrandMark size="md" tagline inverted />
        <Link href="/login" className={styles.loginLink}>
          Увійти
        </Link>
      </header>

      <section className={styles.hero} aria-label="Моя парта">
        <div className={styles.heroMedia}>
          <Image
            src="/brand/hero.png"
            alt="Затишна шкільна парта в ранковому світлі класу"
            fill
            priority
            sizes="100vw"
            className={styles.heroImage}
          />
          <div className={styles.heroShade} aria-hidden="true" />
        </div>

        <div className={styles.heroInner}>
          <p className={`${styles.eyebrow} ${styles.rise}`} style={{ animationDelay: '40ms' }}>
            Для учнів 1–4 класів
          </p>
          <h1 className={`${styles.brandHero} ${styles.rise}`} style={{ animationDelay: '120ms' }}>
            Моя парта
          </h1>
          <p className={`${styles.headline} ${styles.rise}`} style={{ animationDelay: '200ms' }}>
            У кожного — своя парта. У кожного — своє місце в класі.
          </p>
          <p className={`${styles.subtitle} ${styles.rise}`} style={{ animationDelay: '280ms' }}>
            Цифровий клас, де можна навчатися, творити й бути разом — без
            рейтингів між дітьми.
          </p>
          <div className={`${styles.ctaRow} ${styles.rise}`} style={{ animationDelay: '360ms' }}>
            <Link href="/register">
              <Button>Я вчитель — створити клас</Button>
            </Link>
            <Link href="/join">
              <Button variant="ghost" className={styles.ctaGhost}>
                У мене є код класу
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section id="how" className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>Як це працює</h2>
          <p>Дитина заходить не в журнал, а у свій цифровий клас.</p>
        </div>
        <ol className={styles.steps}>
          {steps.map((step, index) => (
            <li key={step.title} className={styles.step}>
              <span className={styles.stepNum} aria-hidden="true">
                {index + 1}
              </span>
              <Image
                src={step.icon}
                alt={step.alt}
                width={72}
                height={72}
                className={styles.stepIcon}
              />
              <div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.deskSection}>
        <div className={styles.deskCopy}>
          <p className={styles.kicker}>Головний екран учня</p>
          <h2>Моя парта</h2>
          <p>
            Тут видно, що важливо сьогодні, скільки вже пройдено, і що цікавого
            в класі. Без порівнянь і таблиць лідерів — лише власний шлях.
          </p>
        </div>
        <div className={styles.deskVisual}>
          <Image
            src="/brand/desk-scene.png"
            alt="Вид зверху на шкільну парту з зошитом і олівцями"
            fill
            sizes="(max-width: 900px) 100vw, 52vw"
            className={styles.deskImage}
          />
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>Закритий і спокійний клас</h2>
          <p>
            Клас лише за запрошенням. Пости зʼявляються одразу — учитель може
            приховати, якщо треба. Лише позитивні реакції, без відкритого
            пошуку людей.
          </p>
        </div>
        <div className={styles.roles}>
          <article>
            <h3>Для вчителя</h3>
            <p>Клас, код, завдання, перевірка робіт, події й чат.</p>
          </article>
          <article>
            <h3>Для учнів</h3>
            <p>Своя парта, друзі з класу, творчість і маленькі перемоги.</p>
          </article>
        </div>
      </section>

      <section className={styles.finalCta}>
        <h2>Готові відкрити клас?</h2>
        <p>Почніть з одного коду — і в кожного зʼявиться своя парта.</p>
        <div className={styles.ctaRow}>
          <Link href="/register">
            <Button>Створити клас</Button>
          </Link>
          <Link href="/join">
            <Button variant="ghost">Увійти за кодом</Button>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
