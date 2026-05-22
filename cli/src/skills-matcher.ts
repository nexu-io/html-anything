import { loadSkill, type SkillMeta } from "./skills-loader.js";
import { invokeAgent } from "./agents-invoke.js";

const CONFIDENCE_THRESHOLD = 3;
const MIN_CONTENT_LENGTH_FOR_AI = 60;

const STRONG_SIGNALS: [keywords: string[], templateId: string][] = [
  [["简历", "resume", "CV", "求职", "工作经历", "教育背景"], "resume-modern"],
  [["定价", "pricing", "价格方案", "套餐", "plans", "免费版", "专业版"], "pricing-page"],
  [["OKR", "KR", "关键结果", "objectives", "季度目标", "key results"], "team-okrs"],
  [["PRD", "产品需求", "spec", "user stories", "用户故事", "需求文档", "功能规格"], "pm-spec"],
  [["周报", "weekly", "本周", "下周计划", "本周完成"], "weekly-update"],
  [["Runbook", "runbook", "oncall", "on-call", "SRE", "告警", "运维", "事故", "incident"], "eng-runbook"],
  [["发票", "invoice", "账单", "税率", "tax", "收款", "付款方"], "invoice"],
  [["入职", "onboarding", "新人", "onboard", "欢迎", "新员工"], "hr-onboarding"],
  [["SaaS", "landing", "落地页", "产品落地", "hero", "social proof"], "saas-landing"],
  [["等候", "waitlist", "预发布", "coming soon", "即将上线", "预约"], "waitlist-page"],
  [["会议纪要", "meeting", "notes", "会议记录", "参会人", "action items"], "meeting-notes"],
  [["看板", "kanban", "board"], "kanban-board"],
  [["Dashboard", "dashboard", "仪表板", "仪表盘", "KPI", "指标", "监控"], "dashboard"],
  [["日报", "社媒", "社交媒体", "social media", "粉丝", "follower"], "social-media-dashboard"],
  [["博客", "blog", "文章", "长文", "杂志", "magazine", "公众号", "newsletter", "essay", "写作"], "article-magazine"],
  [["blog", "post", "技术博客", "blog post", "写作"], "blog-post"],
  [["文档", "docs", "API文档", "技术文档", "documentation", "doc"], "docs-page"],
  [["小红书", "xiaohongshu", "红书"], "card-xiaohongshu"],
  [["推特", "twitter", "tweet", "推文", "𝕏"], "social-x-post-card"],
  [["Spotify", "spotify", "正在播放", "now playing", "音乐", "专辑"], "social-spotify-card"],
  [["Reddit", "reddit", "投票", "upvote"], "social-reddit-card"],
  [["Instagram", "linkedin", "carousel", "轮播", "三联", "thread"], "social-carousel"],
  [["海报", "poster", "宣传", "海报设计", "营销海报", "视觉冲击"], "poster-hero"],
  [["财报", "finance report", "财务报表", "年报", "季度财报", "利润表", "资产负债表"], "finance-report"],
  [["数据报告", "data report", "数据分析", "可视化", "图表", "chart", "statistics"], "data-report"],
  [["直播", "live", "弹幕", "chat", "实时数据"], "live-dashboard"],
  [["PPT", "幻灯片", "deck", "slides", "presentation", "演讲", "演示", "keynote"], "deck-swiss-international"],
  [["原型", "prototype", "线框", "wireframe", "mockup", "低保真", "sketch", "手绘"], "prototype-web"],
  [["视频", "video", "帧动画", "hyperframes", "remotion", "mp4", "片头"], "video-hyperframes"],
  [["VFX", "特效", "光标", "cursor", "chromatic", "reveal"], "vfx-text-cursor"],
  [["恋爱", "dating", "交友", "匹配", "约会", "profile"], "dating-web"],
  [["App", "mobile", "手机", "H5", "移动端", "小程序"], "mobile-app"],
  [["课程", "course", "模块", "module", "教学", "教程", "课时"], "deck-course-module"],
  [["team dashboard", "flow", "工单", "ticket", "flowai"], "flowai-team-dashboard"],
  [["eguide", "电子指南", "guide", "手册", "指南"], "digital-eguide"],
  [["羊皮纸", "kami", "parchment", "古风", "东方", "传统"], "doc-kami-parchment"],
  [["email", "营销邮件", "邮件", "EDM", "newsletter email"], "email-marketing"],
  [["苹果", "Apple", "iOS", "soft", "squircle"], "web-proto-soft"],
  [["brutalist", "工业", "粗野", "swiss", "industrial print"], "web-proto-brutalist"],
  [["editorial", "编辑", "杂志风", "serif", "排版"], "web-proto-editorial"],
  [["gamified", "游戏化", "成就", "徽章", "badge", "积分"], "gamified-app"],
  [["macOS", "notification", "通知", "桌面通知", "弹窗"], "frame-macos-notification"],
  [["glitch", "故障", "cyber", "赛博", "cyberpunk"], "deck-hermes-cyber"],
  [["glitch", "title", "故障标题"], "frame-glitch-title"],
  [["liquid", "流体", "blob", "渐变背景", "hero"], "frame-liquid-bg-hero"],
  [["logo", "outro", "片尾", "结尾", "brand"], "frame-logo-outro"],
  [["light leak", "cinema", "电影感", "漏光", "胶片"], "frame-light-leak-cinema"],
  [["flowchart", "流程图", "sticky", "便利贴", "流程"], "frame-flowchart-sticky"],
  [["chart", "NYT", "数据图", "data chart", "新闻图表", "infographic"], "frame-data-chart-nyt"],
  [["3D", "3d", "mockup", "device", "iPhone", "MacBook", "立体"], "mockup-device-3d"],
  [["pixel", "8-bit", "像素", "复古", "游戏"], "sprite-animation"],
  [["motion", "动效", "循环", "动画", "CSS动画"], "motion-frames"],
  [["pitch", "融资", "pitch deck", "路演", "投资人", "BP"], "deck-pitch"],
  [["product", "launch", "产品发布", "product launch", "上线"], "deck-product-launch"],
  [["simple", "deck", "简单", "简洁", "简约"], "deck-simple"],
  [["swiss", "international", "瑞士", "国际", "现代主义"], "deck-swiss-international"],
  [["graphify", "graph", "dark", "暗色", "图表", "可视化"], "deck-graphify-dark"],
  [["obsidian", "黑曜石", "笔记", "知识"], "deck-obsidian-claude"],
  [["guizang", "贵赞", "墨水", "ink", "editorial deck"], "deck-guizang-editorial"],
  [["magazine", "web", "杂志网页"], "deck-magazine-web"],
  [["safety", "alert", "安全", "告警", "warning"], "deck-safety-alert"],
  [["blueprint", "蓝图", "工程"], "deck-blueprint"],
  [["replit", "terminal", "终端", "暗色"], "deck-replit"],
  [["keyboard", "nav", "键盘导航"], "deck-dir-key-nav"],
  [["open slide", "canvas", "画布", "自由"], "deck-open-slide-canvas"],
  [["presenter", "演讲者", "演讲模式"], "deck-presenter-mode"],
  [["tech", "sharing", "技术分享", "tech talk"], "deck-tech-sharing"],
  [["xhs", "xiaohongshu deck"], "deck-xhs-post"],
  [["XHS", "pastel", "粉彩", "柔和", "粉色"], "deck-xhs-pastel"],
  [["XHS", "white", "白色", "纯净", "极简红书"], "deck-xhs-white"],
  [["mobile", "onboarding", "引导", "启动"], "mobile-onboarding"],
  [["magazine", "poster", "杂志海报", "杂志风海报"], "magazine-poster"],
];

const SCENARIO_SIGNALS: Record<string, string[]> = {
  marketing: ["marketing", "推广", "营销", "广告", "品牌", "brand", "campaign", "landing page", "着陆页", "落地", "转换", "conversion"],
  engineering: ["代码", "code", "编程", "engineering", "工程", "开发", "部署", "deploy", "CI/CD", "git", "架构", "arch", "SRE", "devops", "运维", "oncall"],
  operations: ["运营", "operation", "ops", "周报", "每周", "weekly", "standup", "站会", "流程", "process", "复盘", "retro"],
  product: ["产品", "product", "PM", "PRD", "需求", "requirement", "feature", "功能", "spec", "roadmap", "路线图", "OKR", "目标", "用户故事", "user story"],
  design: ["设计", "design", "UI", "UX", "原型", "prototype", "mockup", "wireframe", "线框", "配色", "字体", "typography"],
  finance: ["财务", "finance", "财报", "利润", "revenue", "收入", "支出", "expense", "账单", "发票", "invoice", "tax", "税率"],
  sales: ["销售", "sales", "定价", "pricing", "plan", "套餐", "订阅", "subscription", "折扣", "discount"],
  hr: ["HR", "人事", "招聘", "hire", "入职", "onboard", "简历", "resume", "CV", "面试", "interview", "员工", "employee"],
  personal: ["个人", "personal", "简历", "resume", "CV", "spotify", "音乐", "music"],
  education: ["教育", "education", "课程", "course", "教程", "tutorial", "学习", "learn", "教学"],
  creator: ["创作者", "creator", "内容创作", "社媒", "social media", "粉丝", "follower", "自媒体", "KOL"],
  video: ["视频", "video", "帧", "frame", "hyperframes", "remotion", "动画", "animation", "VFX", "片头", "intro"],
};

export interface MatchResult {
  templateId: string;
  zhName: string;
  confidence: number;
  reason: string;
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[，,。；;！!？?、\s]+/g, " ").trim();
}

function isAscii(s: string): boolean {
  return /^[\x00-\x7F]+$/.test(s);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function kwMatches(haystack: string, needle: string): boolean {
  const kw = needle.toLowerCase();
  if (isAscii(kw)) {
    return new RegExp("\\b" + escapeRegExp(kw) + "\\b", "i").test(haystack);
  }
  return haystack.includes(kw);
}

function ruleMatch(content: string, meta: SkillMeta): number {
  const lower = normalize(content);
  let score = 0;

  for (const tag of meta.tags) {
    if (kwMatches(lower, tag)) score += 3;
  }

  const nameWords = normalize(meta.zhName).split(" ").filter((w) => w.length >= 2);
  const descWords = normalize(meta.description).split(" ").filter((w) => w.length >= 3);

  for (const w of nameWords) {
    if (lower.includes(w)) score += 2;
  }
  for (const w of descWords) {
    if (lower.includes(w)) score += 1;
  }

  const scenarioKeywords = SCENARIO_SIGNALS[meta.scenario] ?? [];
  for (const kw of scenarioKeywords) {
    if (kwMatches(lower, kw)) score += 1;
  }

  return score;
}

function strongSignalMatch(
  content: string,
  skillsDir: string,
): MatchResult | null {
  let best: { templateId: string; confidence: number; matched: string[] } | null = null;
  const lower = normalize(content);

  for (const [keywords, templateId] of STRONG_SIGNALS) {
    const matched = keywords.filter((kw) => kwMatches(lower, kw));
    if (matched.length > 0) {
      const confidence = matched.length * 2 + 3;
      if (!best || confidence > best.confidence) {
        best = { templateId, confidence, matched };
      }
    }
  }

  if (best && best.confidence >= CONFIDENCE_THRESHOLD) {
    const meta = loadSkill(skillsDir, best.templateId);
    const name = meta?.zhName ?? best.templateId;
    return {
      templateId: best.templateId,
      zhName: name,
      confidence: best.confidence,
      reason: `关键词命中: ${best.matched.join(", ")} → ${name}`,
    };
  }

  return null;
}

function fallbackMatch(content: string, templates: SkillMeta[]): MatchResult | null {
  let best: SkillMeta | null = null;
  let bestScore = 0;

  for (const t of templates) {
    const score = ruleMatch(content, t);
    if (score > bestScore) {
      bestScore = score;
      best = t;
    }
  }

  if (!best || bestScore < 1) return null;

  return {
    templateId: best.id,
    zhName: best.zhName,
    confidence: bestScore,
    reason: `最佳匹配: ${best.zhName} (scenario: ${best.scenario}, score: ${bestScore})`,
  };
}

async function aiSummaryMatch(
  content: string,
  templates: SkillMeta[],
  agentId: string,
): Promise<MatchResult | null> {
  let summary = "";
  try {
    const prompt = `请用一句话（不超过15个字）描述以下内容最像什么类型的文档，只需回答类型名称：

${content.slice(0, 800)}

类型名称:`;

    const stream = invokeAgent({ agent: agentId, prompt });
    const reader = stream.getReader();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value?.type === "delta") summary += value.text;
      if (value?.type === "html") summary = value.text;
      if (value?.type === "error") return null;
    }
  } catch {
    return null;
  }

  const clean = normalize(summary).trim();
  if (!clean || clean.length > 100) return null;

  return fallbackMatch(clean, templates);
}

export async function matchTemplate(
  content: string,
  templates: SkillMeta[],
  skillsDir: string,
  agentId: string,
  forceAi: boolean = false,
): Promise<MatchResult> {
  if (!forceAi) {
    const strong = strongSignalMatch(content, skillsDir);
    if (strong) {
      strong.confidence = Math.min(strong.confidence, 10);
      return strong;
    }
  }

  const rule = fallbackMatch(content, templates);
  if (!forceAi && rule && rule.confidence >= CONFIDENCE_THRESHOLD) {
    rule.confidence = Math.min(rule.confidence, 10);
    return rule;
  }

  if (content.length < MIN_CONTENT_LENGTH_FOR_AI) {
    if (rule) {
      rule.confidence = Math.min(rule.confidence, 10);
      return rule;
    }
    const fallback = templates.find((t) => t.id === "deck-swiss-international") ?? templates[0];
    return {
      templateId: fallback.id,
      zhName: fallback.zhName,
      confidence: 1,
      reason: "内容较短，使用通用模板",
    };
  }

  const ai = await aiSummaryMatch(content, templates, agentId);
  if (ai) {
    ai.confidence = Math.min(ai.confidence, 10);
    return ai;
  }

  if (rule) {
    rule.confidence = Math.min(rule.confidence, 10);
    return rule;
  }

  const fallback = templates.find((t) => t.id === "deck-swiss-international") ?? templates[0];
  return {
    templateId: fallback.id,
    zhName: fallback.zhName,
    confidence: 1,
    reason: "无法确定主题，使用默认模板",
  };
}
