import { useI18n } from '../i18n/I18n';
import { Tooltip } from '../components/ui/Tooltip';
import discordLogo from './community-discord.svg';

// Public community entry shared with the README and landing pages.
export const COMMUNITY_URL = 'https://discord.gg/mHAjSMV6gz';

export function CommunityLink() {
  const { t } = useI18n();
  const label = t('Join the OpenDesign community');
  return <Tooltip label={label} side="bottom" lines={2}>
    <a className="motion-icon-button motion-community-link" href={COMMUNITY_URL}
      target="_blank" rel="noopener noreferrer" aria-label={label}>
      <img src={discordLogo} width="16" height="16" alt="" />
    </a>
  </Tooltip>;
}
