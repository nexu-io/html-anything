import { useEffect, useState } from 'react';
import { GithubLogo } from '@phosphor-icons/react';
import { useI18n } from '../i18n/I18n';
import { GITHUB_REPOSITORY, readRepositoryStars, VERIFIED_REPOSITORY_STARS } from './githubRepository';
import styles from './GitHubLink.module.css';

export function GitHubLink() {
  const { t, formatNumber } = useI18n();
  const [stars, setStars] = useState<number | null>(VERIFIED_REPOSITORY_STARS);
  useEffect(() => {
    let cancelled = false;
    void readRepositoryStars().then(value => { if (!cancelled) setStars(value); });
    return () => { cancelled = true; };
  }, []);
  const count = stars === null ? 'GitHub' : new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(stars);
  return <a className={styles.link} href={GITHUB_REPOSITORY} target="_blank" rel="noopener noreferrer"
    aria-label={t('OpenMotion on GitHub')} title={stars === null ? 'GitHub' : t('{count} GitHub stars', { count: formatNumber(stars) })}>
    <GithubLogo size={16} weight="fill" aria-hidden="true" /><span>{count}</span>
  </a>;
}
