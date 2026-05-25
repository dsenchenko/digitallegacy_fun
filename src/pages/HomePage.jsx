import { Link } from 'react-router-dom';
import { PERSONAL_INSTAGRAM_URL, SOCIAL_LINKS } from '../config';
import '../styles/home.css';

function socialHref(id) {
  return SOCIAL_LINKS.find((link) => link.id === id)?.href ?? '#';
}

function ExternalSocialLink({ id, href, children }) {
  return (
    <a
      className="home__inline-link"
      href={href ?? socialHref(id)}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}

function HomeFigure({ className = '', src, alt, width, height }) {
  return (
    <figure className={`home__figure${className ? ` ${className}` : ''}`}>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
      />
    </figure>
  );
}

export default function HomePage() {
  return (
    <div className="home">
      <article className="home__article">
        <h1 className="home__title">Вітаю в ламповому клубі цифрової спадщини</h1>

        <header className="home__intro">
          <HomeFigure
            className="home__figure--portrait"
            src="/dmytro.jpg"
            alt="Дмитро, автор Digital Legacy"
            width={576}
            height={1024}
          />
          <p className="home__lead">
            Привіт. Мене звати Дмитро, і я автор проекту <strong>Digital Legacy</strong>.
            Останні 15 років я працюю в IT, але паралельно постійно знаходжусь у процесі
            створення чогось нового. На моїх каналах ми згадуємо трушну цифрову спадщину,
            розбираємо олдскульне залізо та ігри, розробляємо власні проекти наживо і
            просто граємо в класику без сучасного стерильного пластику. Часто запускаю все
            саме на оригінальних консолях — PlayStation 1, PlayStation 2 чи Xbox 360, бо
            для мене важливий автентичний досвід.
          </p>
        </header>

        <section className="home__section home__section--mirror">
          <HomeFigure
            className="home__figure--pov"
            src="/stream-pov.jpg"
            alt="Вигляд зі стріму: монітор, мікрофон і клавіатура"
            width={768}
            height={1024}
          />
          <p>
            Цей сайт — не просто візитка, а ваш <strong>пульт управління</strong> моїм
            ефіром. Тут немає звичайної нудної кнопки «кинути на каву». Система
            інтерактивних донатів дозволяє вам буквально втручатися в мій стрім:
            влаштувати хаос, поки я намагаюся зосередитися, поміняти сенсу, зробити
            інвертоване керування чи замовити пісню (
            <Link to="/menu" className="home__inline-link">
              меню донатів
            </Link>
            ).
          </p>
        </section>

        <aside className="home__callout" aria-label="Правило зборів">
          <p className="home__callout-kicker">Про донати</p>
          <p>
            Але найголовніше: всі гроші з донатів йдуть на допомогу нашим військовим. У
            мене є жорстке правило: збираю кошти <strong>тільки</strong> для тих хлопців,
            яких знаю особисто. Жодних незнайомців чи сторонніх фондів — я відповідаю за
            порядність кожного збору своїм іменем, сам акумулюю кошти та контролюю процеси
            від закупівлі снаряги до ремонту техніки. Всі звіти та історію зборів я веду
            на своїй сторінці в{' '}
            <ExternalSocialLink href={PERSONAL_INSTAGRAM_URL}>
              Instagram
            </ExternalSocialLink>
            , де можна прозоро побачити, куди саме пішли гроші.
          </p>
        </aside>

        <blockquote className="home__pullquote">
          <p>
            Тож ці донати — це ваш шанс зробити життєво важливу справу і за це нормально
            повеселитися, зробивши моє проходження ігор максимально складним і
            нестерпним.
          </p>
          <footer>
            Ви впливаєте на вайб, створюєте контент разом зі мною і допомагаєте своїм.
          </footer>
        </blockquote>

        <div className="home__outro">
          <p>
            Якщо вам близький такий двіж — підписуйтесь на{' '}
            <ExternalSocialLink id="twitch">Twitch</ExternalSocialLink>, залітайте на{' '}
            <ExternalSocialLink id="tiktok">TikTok</ExternalSocialLink>,{' '}
            <ExternalSocialLink id="youtube">YouTube</ExternalSocialLink> або{' '}
            <ExternalSocialLink id="instagram">Instagram</ExternalSocialLink>. Займайте
            місця на дивані, погнали творити дичину.
          </p>
        </div>
      </article>
    </div>
  );
}
