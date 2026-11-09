import { readFileSync } from 'node:fs';

const defaults = JSON.parse(readFileSync(new URL('./template-config.json', import.meta.url), 'utf8'));

export function packageTemplateConfig(environment = 'prod') {
  if (environment !== 'dev' && environment !== 'prod') throw new Error('Template environment must be dev or prod');
  return { ...defaults, environment } as { environment: 'dev' | 'prod'; resourceId: string; locale: string };
}

export function templateConfig() {
  return {
    ...packageTemplateConfig(process.env.MOTION_TEMPLATE_ENV ?? defaults.environment),
    resourceId: process.env.MOTION_TEMPLATE_RESOURCE_ID ?? defaults.resourceId,
    locale: process.env.MOTION_TEMPLATE_LOCALE ?? defaults.locale,
  };
}
