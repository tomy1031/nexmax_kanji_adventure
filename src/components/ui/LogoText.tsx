import { RubyText } from './Ruby';

/**
 * Logo lettering: the same text twice, a thick dark outline behind and a
 * gradient in front (see .g-logo in index.css for why it takes two layers).
 * The back copy is hidden from screen readers so the title is read once.
 */
export const LogoText = ({
  children,
  showFurigana = true,
  tone = 'gold',
  shine = false,
  className = '',
  style,
}: {
  children: string;
  showFurigana?: boolean;
  tone?: 'gold' | 'blue';
  shine?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) => (
  <span className={`g-logo ${tone === 'blue' ? 'g-logo-blue' : ''} ${shine ? 'g-logo-shine' : ''} ${className}`} style={style}>
    <span className="g-logo-back" aria-hidden>
      <RubyText showFurigana={showFurigana}>{children}</RubyText>
    </span>
    <span className="g-logo-front">
      <RubyText showFurigana={showFurigana}>{children}</RubyText>
    </span>
  </span>
);

export default LogoText;
