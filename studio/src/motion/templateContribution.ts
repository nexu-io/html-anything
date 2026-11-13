export const templateContributionUrl = 'https://github.com/nexu-io/openmotion/blob/main/CONTRIBUTING.md';

/** Keep the selected template and environment-specific handoff intact. */
export function templateSubmissionPrompt(recreatePrompt: string): string {
  return `${recreatePrompt}\n\nCreate a reusable, editable template from this recreation and prepare it for contribution to OpenMotion. Read ${templateContributionUrl} and the linked template catalog contribution guide first. Include editable source, a preview, adaptation instructions, accurate source attribution and asset licenses; run the applicable template and storage checks. Prepare a focused pull request against nexu-io/openmotion with an English title and description, and show me the result for review. Do not merge or publish packages or CMS content.`;
}
