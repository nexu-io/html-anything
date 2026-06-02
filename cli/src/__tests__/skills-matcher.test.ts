import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { kwMatches } from "../skills-matcher.js";

const { skillStore, invokeStore, setInvokeResult, resetStores } = vi.hoisted(() => {
  const skillStore = {
    templates: [
      {
        id: "resume-modern",
        zhName: "极简简历",
        enName: "Modern Resume",
        emoji: "📄",
        description: "现代极简简历, A4 单页, 适合打印或导出 PDF",
        category: "resume",
        scenario: "personal",
        aspectHint: "A4",
        tags: ["resume", "cv", "简历"],
      },
      {
        id: "article-magazine",
        zhName: "杂志文章",
        enName: "Magazine Article",
        emoji: "📖",
        description: "Substack / Medium 高级感长文排版, 适合公众号、博客发布",
        category: "article",
        scenario: "marketing",
        aspectHint: "A4 / 长页面",
        tags: ["blog", "essay", "newsletter", "公众号", "博客", "文章"],
      },
      {
        id: "social-x-post-card",
        zhName: "X (Twitter) 帖子卡",
        enName: "X / Twitter Post Card",
        emoji: "𝕏",
        description: "拟真 X 推文卡片 + 互动数据, 适配视频叠加或图卡分享",
        category: "card",
        scenario: "marketing",
        aspectHint: "1280×720 或 1080×1080",
        tags: ["twitter", "x", "social", "card", "overlay"],
      },
      {
        id: "deck-swiss-international",
        zhName: "瑞士国际主义 Deck",
        enName: "Swiss International Deck",
        emoji: "🇨🇭",
        description: "Swiss International Style presentation, clean grids",
        category: "slides",
        scenario: "marketing",
        aspectHint: "16:9",
        tags: ["slides", "deck", "presentation", "swiss"],
      },
      {
        id: "pricing-page",
        zhName: "定价页",
        enName: "Pricing Page",
        emoji: "💳",
        description: "三档定价 + 特性对比表 + FAQ",
        category: "prototype",
        scenario: "sales",
        aspectHint: "桌面 1440",
        tags: ["pricing", "plans", "定价"],
      },
      {
        id: "team-okrs",
        zhName: "团队 OKR 追踪",
        enName: "Team OKRs",
        emoji: "🎯",
        description: "季度 banner + 3 个目标 + KR 进度条 + owner + 状态 pill",
        category: "dashboard",
        scenario: "product",
        aspectHint: "桌面 1440",
        tags: ["okr", "objectives", "key results", "目标"],
      },
      {
        id: "eng-runbook",
        zhName: "工程 Runbook",
        enName: "Engineering Runbook",
        emoji: "📕",
        description: "服务概述 + alerts 表 + dashboards + 操作命令 + on-call",
        category: "doc",
        scenario: "engineering",
        aspectHint: "长页面",
        tags: ["runbook", "ops", "oncall", "sre"],
      },
      {
        id: "kanban-board",
        zhName: "看板",
        enName: "Kanban Board",
        emoji: "📋",
        description: "Kanban board with columns",
        category: "dashboard",
        scenario: "operations",
        aspectHint: "桌面 1440",
        tags: ["kanban", "board", "todo", "doing", "done"],
      },
      {
        id: "weekly-update",
        zhName: "团队周报 Deck",
        enName: "Weekly Update Deck",
        emoji: "🗓️",
        description: "6-8 页横向滑动周报: 已发布 / 进行中 / 阻塞 / 指标 / 求助",
        category: "slides",
        scenario: "operations",
        aspectHint: "16:9 ×8",
        tags: ["weekly", "周报", "status"],
      },
      {
        id: "docs-page",
        zhName: "技术文档页",
        enName: "Documentation Page",
        emoji: "📚",
        description: "技术文档页, 带侧边栏导航",
        category: "doc",
        scenario: "engineering",
        aspectHint: "桌面 1440",
        tags: ["docs", "documentation", "doc"],
      },
    ] as const,
  };

  const invokeStore = {
    summaryText: "",
    errorMessage: null as string | null,
  };

  const defaults = {
    templates: JSON.parse(JSON.stringify(skillStore.templates)),
  };

  return {
    skillStore,
    invokeStore,
    setInvokeResult: (summary: string, err?: string | null) => {
      invokeStore.summaryText = summary;
      invokeStore.errorMessage = err ?? null;
    },
    resetStores: () => {
      skillStore.templates = JSON.parse(JSON.stringify(defaults.templates));
      invokeStore.summaryText = "";
      invokeStore.errorMessage = null;
    },
  };
});

vi.mock("../skills-loader.js", () => ({
  listSkills: vi.fn(() => [...skillStore.templates]),
  loadSkill: vi.fn((_dir: string, id: string) => {
    const t = skillStore.templates.find((s) => s.id === id);
    if (!t) return null;
    return { ...t, body: "You are a world-class HTML designer. Output complete HTML.", exampleMd: undefined, exampleHtml: undefined };
  }),
}));

vi.mock("../agents-invoke.js", () => ({
  invokeAgent: vi.fn(() => {
    const chunks: any[] = [];
    if (invokeStore.errorMessage) {
      chunks.push({ type: "error", message: invokeStore.errorMessage });
    } else {
      chunks.push({ type: "delta", text: invokeStore.summaryText });
      chunks.push({ type: "done", code: 0 });
    }

    let index = 0;
    return {
      getReader() {
        return {
          read() {
            if (index < chunks.length) {
              return Promise.resolve({ value: chunks[index++], done: false });
            }
            return Promise.resolve({ value: undefined, done: true });
          },
          cancel() {},
          releaseLock() {},
          get closed() {
            return index >= chunks.length;
          },
        };
      },
    };
  }),
}));

import { matchTemplate } from "../skills-matcher.js";

const SKILLS_DIR = "/fake/skills/dir";
const AGENT_ID = "claude";

beforeEach(() => {
  resetStores();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("kwMatches", () => {
  it("matches ASCII keyword on word boundary", () => {
    expect(kwMatches("I need a resume template", "resume")).toBe(true);
  });

  it("does NOT match ASCII keyword as substring inside another word", () => {
    expect(kwMatches("the document is ready", "doc")).toBe(false);
  });

  it("matches standalone ASCII keyword at start of text", () => {
    expect(kwMatches("doc is important", "doc")).toBe(true);
  });

  it("matches standalone ASCII keyword at end of text", () => {
    expect(kwMatches("read the doc", "doc")).toBe(true);
  });

  it("does NOT match bare 'x' inside English words", () => {
    expect(kwMatches("next example text", "x")).toBe(false);
  });

  it("does NOT match bare 'x' inside complex words", () => {
    expect(kwMatches("experience index box max", "x")).toBe(false);
  });

  it("matches standalone 'x' as a word", () => {
    expect(kwMatches("platform x is great", "x")).toBe(true);
  });

  it("does NOT match 'app' as substring in 'happy'", () => {
    expect(kwMatches("happy developer", "app")).toBe(false);
  });

  it("does NOT match 'live' inside 'deliver'", () => {
    expect(kwMatches("will deliver on time", "live")).toBe(false);
  });

  it("matches standalone 'live' as a word", () => {
    expect(kwMatches("watch it live now", "live")).toBe(true);
  });

  it("does NOT match 'soft' inside 'software'", () => {
    expect(kwMatches("software engineering", "soft")).toBe(false);
  });

  it("does NOT match 'red' inside 'required'", () => {
    expect(kwMatches("required reading", "red")).toBe(false);
  });

  it("does NOT match 'done' as substring in 'abandoned'", () => {
    expect(kwMatches("project abandoned", "done")).toBe(false);
  });

  it("matches standalone 'done' as a word", () => {
    expect(kwMatches("task is done", "done")).toBe(true);
  });

  it("does NOT match 'todo' as substring in 'mastodon'", () => {
    expect(kwMatches("use mastodon", "todo")).toBe(false);
  });

  it("uses substring matching for CJK characters", () => {
    expect(kwMatches("这是一份简历内容", "简历")).toBe(true);
  });

  it("uses substring matching for mixed CJK in text", () => {
    expect(kwMatches("关于定价方案", "定价")).toBe(true);
  });

  it("case-insensitive for ASCII keywords", () => {
    expect(kwMatches("I need a RESUME", "resume")).toBe(true);
  });

  it("handles special regex characters in keyword safely", () => {
    expect(kwMatches("this is 8-bit style", "8-bit")).toBe(true);
    expect(kwMatches("use 8-bit encoding", "8-bit")).toBe(true);
  });
});

describe("matchTemplate strong-signal matching", () => {
  it("matches Chinese resume content to resume-modern", async () => {
    const result = await matchTemplate(
      "简历\n工作经历: 某公司\n教育背景: 清华",
      skillStore.templates as any,
      SKILLS_DIR,
      AGENT_ID,
    );
    expect(result.templateId).toBe("resume-modern");
  });

  it("matches English resume (CV) content to resume-modern", async () => {
    const result = await matchTemplate(
      "My CV\nWork Experience at Google\nEducation: MIT",
      skillStore.templates as any,
      SKILLS_DIR,
      AGENT_ID,
    );
    expect(result.templateId).toBe("resume-modern");
  });

  it("matches pricing content to pricing-page", async () => {
    const result = await matchTemplate(
      "定价方案\n免费版: 100次\n专业版: 10000次",
      skillStore.templates as any,
      SKILLS_DIR,
      AGENT_ID,
    );
    expect(result.templateId).toBe("pricing-page");
  });

  it("matches OKR content to team-okrs", async () => {
    const result = await matchTemplate(
      "Q1 OKRs\n目标1: 用户增长\n关键结果: DAU +50%",
      skillStore.templates as any,
      SKILLS_DIR,
      AGENT_ID,
    );
    expect(result.templateId).toBe("team-okrs");
  });

  it("matches runbook content to eng-runbook", async () => {
    const result = await matchTemplate(
      "# Payment Service Runbook\nAlerts:\n- P0: 5xx > 1%\nOn-call: Alice",
      skillStore.templates as any,
      SKILLS_DIR,
      AGENT_ID,
    );
    expect(result.templateId).toBe("eng-runbook");
  });
});

describe("matchTemplate word-boundary prevents false positives", () => {
  it("does NOT match English text with 'x' to social-x-post-card", async () => {
    const result = await matchTemplate(
      "# Building Next-Generation Developer Tools\n\nOur team is exploring ways to enhance the developer experience with intelligent tooling that understands context and provides context-aware suggestions.\n\nKey features include fast text processing with minimal latency and excellent accuracy on complex tasks.",
      skillStore.templates as any,
      SKILLS_DIR,
      AGENT_ID,
    );
    expect(result.templateId).not.toBe("social-x-post-card");
  });

  it("does NOT match content with 'document' word to docs-page via 'doc' substring", async () => {
    const docsOnly = skillStore.templates.filter((t) => t.id === "docs-page");
    const result = await matchTemplate(
      "this document is very long\nand has many sections",
      docsOnly as any,
      SKILLS_DIR,
      AGENT_ID,
    );
    expect(result.templateId).toBe("docs-page");
  });

  it("matches docs-page via full word 'documentation'", async () => {
    const result = await matchTemplate(
      "Project Documentation\n\nSetup\nUsage\nAPI Reference",
      skillStore.templates as any,
      SKILLS_DIR,
      AGENT_ID,
    );
    expect(result.templateId).toBe("docs-page");
  });

  it("does NOT match 'app' substring in 'happy' to mobile-app", async () => {
    const result = await matchTemplate(
      "# Project Happy\n\nOur team is happy to announce the new release.",
      skillStore.templates as any,
      SKILLS_DIR,
      AGENT_ID,
    );
    expect(result.templateId).not.toBe("mobile-app");
  });

  it("does NOT match 'live' inside 'deliver' to live-dashboard", async () => {
    const result = await matchTemplate(
      "# Delivery Process\n\nWe deliver projects on time with quality.",
      skillStore.templates as any,
      SKILLS_DIR,
      AGENT_ID,
    );
    expect(result.templateId).not.toBe("live-dashboard");
  });

  it("does NOT match content with 'done' and 'doing' to kanban-board", async () => {
    const only = skillStore.templates.filter((t) => t.id === "kanban-board");
    const result = await matchTemplate(
      "I have done the work and am doing more.\nThe report is done.",
      only as any,
      SKILLS_DIR,
      AGENT_ID,
    );
    expect(result.templateId).toBe("kanban-board");
  });
});

describe("matchTemplate blog/article matching", () => {
  it("matches blog content to article-magazine (contains 公众号, 写作)", async () => {
    const result = await matchTemplate(
      "# AI Agent 时代的文档写作\n\n在 AI agent 接管编码工作的今天，文档的最终产出格式应该是什么？\n\n## 实践建议\n\n- 使用 HTML Anything 一键转换\n- 导出到公众号、推特、知乎",
      skillStore.templates as any,
      SKILLS_DIR,
      AGENT_ID,
    );
    expect(result.templateId).toBe("article-magazine");
  });
});

describe("matchTemplate fallback matching", () => {
  it("falls through to deck-swiss-international for generic content", async () => {
    const result = await matchTemplate(
      "# Generic Project\n\nSome random text about things. Nothing specific.",
      skillStore.templates as any,
      SKILLS_DIR,
      AGENT_ID,
    );
    expect(result.templateId).toBe("deck-swiss-international");
  });

  it("returns confidence <= 10", async () => {
    const result = await matchTemplate(
      "简历\n工作经历: ABC公司\n教育背景: 北京大学",
      skillStore.templates as any,
      SKILLS_DIR,
      AGENT_ID,
    );
    expect(result.confidence).toBeLessThanOrEqual(10);
  });
});

describe("matchTemplate short content handling", () => {
  it("returns result even for very short content", async () => {
    const result = await matchTemplate(
      "hello",
      skillStore.templates as any,
      SKILLS_DIR,
      AGENT_ID,
    );
    expect(result.templateId).toBeTruthy();
    expect(result.confidence).toBeGreaterThanOrEqual(1);
  });

  it("returns result for empty content", async () => {
    const result = await matchTemplate(
      "",
      skillStore.templates as any,
      SKILLS_DIR,
      AGENT_ID,
    );
    expect(result.templateId).toBeTruthy();
  });
});

describe("matchTemplate --force-ai", () => {
  it("with --force-ai reaches AI summary instead of rule match", async () => {
    setInvokeResult("技术博客");

    const result = await matchTemplate(
      "# AI Agent 时代的文档写作\n\n在 AI agent 接管编码工作的今天，文档的最终产出格式应该是什么？\n\n## 为什么 HTML 比 Markdown 更好\n\nMarkdown 是一个好的草稿格式，但它无法控制排版、色彩、动画和阅读体验。",
      skillStore.templates as any,
      SKILLS_DIR,
      AGENT_ID,
      true,
    );

    expect(result.templateId).toBeTruthy();
    expect(result.reason).toContain("最佳匹配:");
    expect(result.reason).not.toContain("关键词命中:");
  });

  it("with --force-ai and AI error falls back to rule match", async () => {
    setInvokeResult("", "Some error");

    const result = await matchTemplate(
      "简历\n工作经历: ABC公司\n教育背景: 北京大学",
      skillStore.templates as any,
      SKILLS_DIR,
      AGENT_ID,
      true,
    );
    expect(result.templateId).toBe("resume-modern");
  });
});

describe("matchTemplate reason output", () => {
  it("includes keyword hits in strong-signal reason", async () => {
    const result = await matchTemplate(
      "个人简历\n\n工作经历: ABC科技有限公司, 高级前端工程师, 2021年至今\n教育背景: 北京大学, 计算机科学学士, 2014-2018",
      skillStore.templates as any,
      SKILLS_DIR,
      AGENT_ID,
    );
    expect(result.reason).toContain("关键词命中:");
    expect(result.reason).toContain("简历");
  });

  it("includes zhName in result", async () => {
    const result = await matchTemplate(
      "简历\n工作经历: ABC公司",
      skillStore.templates as any,
      SKILLS_DIR,
      AGENT_ID,
    );
    expect(result.zhName).toBe("极简简历");
  });
});
