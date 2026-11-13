# Claude｜个人财务

用一个旅行愿望贯穿财务演示。数据负责回答能否实现、怎样实现，最后回到生活场景。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 91.166667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 14.3,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Personal Finance",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#d17754"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Personal Finance",
        "accent": "#d17754"
      }
    },
    {
      "label": "OpenDesign 改编",
      "values": {
        "title": "OpenDesign",
        "accent": "#7050da"
      }
    }
  ]
}
```

## 愿望先于数据出现

开场用旅行画面和一个具体问题建立目标。生活镜头铺满画面；转入工具后用暖白底、聊天气泡和衬线说明，形成场景与论证的分工。

![0.00s · 构图参考](assets/reference-1.webp)

## 账户连接是计划的前提

提出财务问题后先显示连接账户，再展开收支总览。授权、数据和建议按顺序出现，避免一上来就给结论。

```motion-demo
{
  "id": "clip-2",
  "title": "账户连接是计划的前提",
  "src": "demos/clip-2.html",
  "duration": 18,
  "status": "authored",
  "description": "14–32 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 一次问题只带出一组数据

总览之后用追问进入支出、贷款和预算。图表先建立结构，重点数字随后强调；旁边说明只解释当前决策。

| 问题 | 画面任务 |
| --- | --- |
| 钱花在哪里 | 支出分类与重点项目 |
| 怎样腾出预算 | 可调整项与时间安排 |
| 下一步怎么做 | 目的地选项与具体方案 |

## 中段回到生活，结尾兑现目标

生活镜头穿插在数据段之间，让观众记住最初愿望。最终选择与预算相呼应，再用旅行场景收尾。

| 时间 | 段落 |
|---|---|
| 0.00–10.00s | 旅行愿望 |
| 10.00–14.00s | 财务能力引入 |
| 14.00–20.00s | 授权连接账户 |
| 20.00–32.00s | 收支总览 |
| 32.00–39.00s | 追问资金去向 |
| 39.00–50.00s | 支出与贷款 |
| 50.00–55.00s | 生活画面回应 |
| 55.00–66.00s | 预算方案 |
| 66.00–79.00s | 酒店选择 |
| 79.00–91.17s | 回到旅行愿望与品牌 |

## 迁移到另一种人生计划

可换成学习、搬家或创作目标，同时替换生活素材与资源数据。保留目标、资源盘点、方案、结果四者的因果；数值须在图表与文案之间一致。

## 配色与字形

生活旅行画面穿插暖白财务图卡，衬线说明配聊天气泡。

#f8f7f1 · #252824 · #d17754 · #35a97b · #88acba

## 元素与制作规则

愿望场景 / 聊天请求 / 账户连接 / 收支图卡 / 预算日历 / 目的地结果

- 先建立具体生活愿望，再用数据判断可行性，最后回到生活结果。
- 图表按问题逐项出现；数字与说明有层级，不能同时堆满。
- 实拍镜头作为愿望与回报，界面作为论证。

## 内容替换

- 换为创作规划时保留目标→资源盘点→方案→成果的叙事。
- 预算与财务数字均可替换，必须内部一致。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Anthropic",
  "id": "V283",
  "palette": [
    "#f8f7f1",
    "#252824",
    "#d17754",
    "#35a97b",
    "#88acba"
  ],
  "typography": "生活旅行画面穿插暖白财务图卡，衬线说明配聊天气泡",
  "sample": "Personal Finance",
  "objects": [
    "愿望场景",
    "聊天请求",
    "账户连接",
    "收支图卡",
    "预算日历",
    "目的地结果"
  ],
  "frames": [
    {
      "path": "assets/reference-1.webp",
      "timeSeconds": 0.0,
      "frameId": "K0001",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-2.webp",
      "timeSeconds": 14.0,
      "frameId": "K0048",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 32.0,
      "frameId": "K0087",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 39.0,
      "frameId": "K0096",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 55.0,
      "frameId": "K0143",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 79.0,
      "frameId": "K0199",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "旅行愿望",
      "end": 10,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10,
      "label": "财务能力引入",
      "end": 14,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 14,
      "label": "授权连接账户",
      "end": 20,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 20,
      "label": "收支总览",
      "end": 32,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 32,
      "label": "追问资金去向",
      "end": 39,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 39,
      "label": "支出与贷款",
      "end": 50,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 50,
      "label": "生活画面回应",
      "end": 55,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 55,
      "label": "预算方案",
      "end": 66,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 66,
      "label": "酒店选择",
      "end": 79,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 79,
      "label": "回到旅行愿望与品牌",
      "end": 91.166667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 91.166667,
  "fontFamily": "Georgia, serif"
}
```
