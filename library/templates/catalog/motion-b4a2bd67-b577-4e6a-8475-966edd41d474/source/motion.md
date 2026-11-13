# Visual Suite 2.0 发布

网站、白板、竖版内容和演示稿在相同工具栏内切换，底部缩略图负责导航。先证明格式共存，再进入具体新能力。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 30.033333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 19,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Visual Suite 2.0",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#21bfca"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Visual Suite 2.0",
        "accent": "#21bfca"
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

## 同一个编辑器容纳多个格式

网站、白板、竖版内容和演示稿在相同工具栏内切换，底部缩略图负责导航。先证明格式共存，再进入具体新能力。

| 时间 | 段落 |
|---|---|
| 0.00–1.50s | 品牌 |
| 1.50–3.00s | 多格式缩略图 |
| 3.00–7.00s | 同一设计内切换 |
| 7.00–8.00s | 套件图标环 |
| 8.00–14.00s | Sheets 与批量生成 |
| 14.00–18.00s | 代码输入 |
| 18.00–22.00s | 交互结果 |
| 22.00–27.00s | AI 生成设计 |
| 27.00–29.00s | 协作调整 |
| 29.00–30.03s | 品牌 |

## 每次 AI 输入都落到可编辑结果

从提示框到计算器、从人物素材到团队海报，完成后继续在编辑器中修改。光标和选择框让“可编辑”成为可见动作。

```motion-demo
{
  "id": "clip-2",
  "title": "每次 AI 输入都落到可编辑结果",
  "src": "demos/clip-2.html",
  "duration": 5.5,
  "status": "authored",
  "description": "23–28.5 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 品牌渐变与内容色彩各司其职

开场、章节衔接和结尾使用青紫渐变；实际内容允许蓝、绿、橙等不同主色。白色编辑器框架保持统一，避免所有画面被同一渐变盖住。

## 配色与字形

高饱和青紫渐变作为品牌底，套件内部用白色编辑器承托彩色设计。。

#6d16f5 · #ffffff · #21bfca · #f04cc7 · #ef8f20 · #4589ef

## 元素与制作规则

多格式缩略图 / 固定编辑器 / 彩色光标 / 表格 / 提示框 / 生成结果

- 网站、白板、竖版内容和演示稿在相同工具栏内切换，底部缩略图负责导航。先证明格式共存，再进入具体新能力。
- 从提示框到计算器、从人物素材到团队海报，完成后继续在编辑器中修改。光标和选择框让“可编辑”成为可见动作。
- 开场、章节衔接和结尾使用青紫渐变；实际内容允许蓝、绿、橙等不同主色。白色编辑器框架保持统一，避免所有画面被同一渐变盖住。

## 内容替换

- 替换为目标创作套件，保留多格式导航及生成后继续编辑。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Canva",
  "id": "V146",
  "palette": [
    "#6d16f5",
    "#ffffff",
    "#21bfca",
    "#f04cc7",
    "#ef8f20",
    "#4589ef"
  ],
  "typography": "高饱和青紫渐变作为品牌底，套件内部用白色编辑器承托彩色设计。",
  "sample": "Visual Suite 2.0",
  "objects": [
    "多格式缩略图",
    "固定编辑器",
    "彩色光标",
    "表格",
    "提示框",
    "生成结果"
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
      "timeSeconds": 3.0,
      "frameId": "K0010",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 8.0,
      "frameId": "K0039",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 14.0,
      "frameId": "K0063",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 22.0,
      "frameId": "K0101",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 29.0,
      "frameId": "K0133",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "品牌",
      "end": 1.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.5,
      "label": "多格式缩略图",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "同一设计内切换",
      "end": 7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7,
      "label": "套件图标环",
      "end": 8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8,
      "label": "Sheets 与批量生成",
      "end": 14,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 14,
      "label": "代码输入",
      "end": 18,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18,
      "label": "交互结果",
      "end": 22,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 22,
      "label": "AI 生成设计",
      "end": 27,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 27,
      "label": "协作调整",
      "end": 29,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 29,
      "label": "品牌",
      "end": 30.033333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 30.033333,
  "fontFamily": "Arial, sans-serif"
}
```
