import { SOCIAL_LINKS } from '../config';
import SocialIcon from './SocialIcon';

export default function SocialLinks({ size = 'md', showLabels = false, className = '' }) {
  return (
    <ul className={`social-links social-links--${size}${className ? ` ${className}` : ''}`}>
      {SOCIAL_LINKS.map((link) => (
        <li key={link.id}>
          <a
            className="social-links__item"
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.label}
            title={link.label}
          >
            <SocialIcon id={link.id} src={link.iconSrc} size={size} />
            {showLabels && <span className="social-links__label">{link.label}</span>}
          </a>
        </li>
      ))}
    </ul>
  );
}
