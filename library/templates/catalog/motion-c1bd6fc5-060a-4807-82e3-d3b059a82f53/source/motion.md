# Stripe Treasury

从通知进入余额，再发送付款、创建卡片、对话操作，最后回到总览。每次只让一张操作面板居中，确认后再移交给下一个场景。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 40.64,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 25.7,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Stripe Treasury",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#6533ef"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Stripe Treasury",
        "accent": "#6533ef"
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

## 按资金流串起产品能力

从通知进入余额，再发送付款、创建卡片、对话操作，最后回到总览。每次只让一张操作面板居中，确认后再移交给下一个场景。

| 时间 | 段落 |
|---|---|
| 0.00–3.00s | 收款通知 |
| 3.00–5.80s | 余额 |
| 5.80–9.00s | 发送入口 |
| 9.00–15.00s | 选择收款人 |
| 15.00–21.00s | 转账结果 |
| 21.00–25.00s | 创建卡片 |
| 25.00–28.00s | 卡片收益 |
| 28.00–34.00s | 对话付款 |
| 34.00–39.00s | 账目总览 |
| 39.00–40.64s | 品牌 |

## 用浅紫环境维持轻盈感

白色面板浮在低对比蓝紫渐变上，按钮和焦点描边使用鲜紫色。近景显示字段和点击，远景交代手机与仪表盘。

## 创建动作接到可见成果

创建卡片后立即展示带高光的紫色实体卡，并让 2% 数字占据另一半画面。卡片转动幅度小，数字稳定。

```motion-demo
{
  "id": "clip-3",
  "title": "创建动作接到可见成果",
  "src": "demos/clip-3.html",
  "duration": 2.6999999999999993,
  "status": "authored",
  "description": "24.3–27 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 主题迁移要替换整条交易链

换品牌时把通知、余额、收款方、卡片及报表一起更新。财务数字以说明关系为主，保留按钮与结果的明确承接。

## 配色与字形

浅色产品底、紫色行动按钮；数字比说明文字更突出。。

#f8f8fa · #242331 · #6533ef · #dceafa · #ded3f5

## 元素与制作规则

手机 / 收款通知 / 转账面板 / 支付卡 / 收益数字 / 账目表格

- 从通知进入余额，再发送付款、创建卡片、对话操作，最后回到总览。每次只让一张操作面板居中，确认后再移交给下一个场景。
- 白色面板浮在低对比蓝紫渐变上，按钮和焦点描边使用鲜紫色。近景显示字段和点击，远景交代手机与仪表盘。
- 创建卡片后立即展示带高光的紫色实体卡，并让 2% 数字占据另一半画面。卡片转动幅度小，数字稳定。

## 内容替换

- 替换财务产品和字段，保持入口、确认与结果之间的对应。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Stripe",
  "id": "V298",
  "palette": [
    "#f8f8fa",
    "#242331",
    "#6533ef",
    "#dceafa",
    "#ded3f5"
  ],
  "typography": "浅色产品底、紫色行动按钮；数字比说明文字更突出。",
  "sample": "Stripe Treasury",
  "objects": [
    "手机",
    "收款通知",
    "转账面板",
    "支付卡",
    "收益数字",
    "账目表格"
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
      "timeSeconds": 5.78,
      "frameId": "K0023",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 15.0,
      "frameId": "K0043",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 21.0,
      "frameId": "K0059",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 28.0,
      "frameId": "K0083",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 39.0,
      "frameId": "K0123",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "收款通知",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "余额",
      "end": 5.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5.8,
      "label": "发送入口",
      "end": 9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9,
      "label": "选择收款人",
      "end": 15,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15,
      "label": "转账结果",
      "end": 21,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 21,
      "label": "创建卡片",
      "end": 25,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 25,
      "label": "卡片收益",
      "end": 28,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 28,
      "label": "对话付款",
      "end": 34,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 34,
      "label": "账目总览",
      "end": 39,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 39,
      "label": "品牌",
      "end": 40.64,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 40.64,
  "fontFamily": "Arial, sans-serif"
}
```
