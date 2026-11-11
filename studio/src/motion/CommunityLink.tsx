import { useI18n } from '../i18n/I18n';
import { Tooltip } from '../components/ui/Tooltip';
import feishuLogo from './community-feishu.svg';
import discordLogo from './community-discord.svg';

// Shared destinations and brand artwork from OpenDesign's community entry.
const FEISHU_URL = 'https://applink.feishu.cn/client/chat/chatter/add_by_link?link_token=a38j32fc-756c-4d02-846b-53356fee12a7';
const DISCORD_URL = 'https://discord.gg/mHAjSMV6gz';

export function CommunityLink() {
  const { locale, t } = useI18n();
  const chinese = locale === 'zh-CN';
  const label = t('Join the OpenDesign community');
  return <Tooltip label={label} side="bottom" lines={2}>
    <a className="motion-icon-button motion-community-link" href={chinese ? FEISHU_URL : DISCORD_URL}
      target="_blank" rel="noopener noreferrer" aria-label={label}>
      <img src={chinese ? feishuLogo : discordLogo} width="16" height="16" alt="" />
    </a>
  </Tooltip>;
}
