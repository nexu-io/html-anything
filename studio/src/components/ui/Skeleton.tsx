import type { CSSProperties } from 'react';
import styles from './Skeleton.module.css';

/** Decorative loading geometry; the containing region owns its accessible status. */
export function Skeleton({ className = '', style, animated = true }: { className?: string; style?: CSSProperties; animated?: boolean }) {
  return <span aria-hidden="true" className={`${styles.skeleton} ${className}`} data-animated={animated || undefined} style={style} />;
}
