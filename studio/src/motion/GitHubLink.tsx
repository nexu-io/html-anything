import { useEffect, useState } from 'react';
import { GithubLogo } from '@phosphor-icons/react';
import { useI18n } from '../i18n/I18n';
import { GITHUB_REPOSITORY, readRepositoryStars } from './githubRepository';
import styles from './GitHubLink.module.css';

export function GitHubLink() {
  const { t, formatNumber } = useI18n();
  const [stars, setStars] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      if (document.visibilityState === 'hidden') return;
      void readRepositoryStars().then(value => { if (!cancelled) setStars(value); });
    };
    refresh();
    const timer = window.setInterval(refresh, 60_000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);
  const count = stars === null ? null : new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(stars);
  const label = stars === null ? t('OpenMotion on GitHub') : `${t('OpenMotion on GitHub')}, ${t('{count} GitHub stars', { count: formatNumber(stars) })}`;
  return <a className={styles.link} href={GITHUB_REPOSITORY} target="_blank" rel="noopener noreferrer"
    aria-label={label} title={label}>
    <GithubLogo size={16} weight="fill" aria-hidden="true" />{count !== null && <span className={styles.count} aria-hidden="true">{count}</span>}
  </a>;
}
