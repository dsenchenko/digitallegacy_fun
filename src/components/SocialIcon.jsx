export default function SocialIcon({ id, src, size = 'md' }) {
  const imageSrc = src ?? `/social/${id}.png`;

  return (
    <img
      className={`social-icon social-icon--${size}`}
      src={imageSrc}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
}
