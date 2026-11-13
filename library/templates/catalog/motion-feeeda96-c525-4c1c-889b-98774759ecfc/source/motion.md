# Claude Haiku 5.5 发布

保持三列构图，用纹理快切制造变化。细弧线先承接图块，再承接产品名，最后回到开场图形。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 11.083333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 2.6,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Claude Haiku 5.5",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#e1b93e"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Claude Haiku 5.5",
        "accent": "#e1b93e"
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

## 固定槽位，切换纹理

三个图形保持相同尺度和间距。方形与 L 形交替，纹理在遮罩内部快切；槽位本身不追着纹理移动。

米白底留出空白。芥末黄、玫红与灰蓝集中在图块内部，黑色只留给弧线与产品名。

```motion-demo
{
  "id": "clip-1",
  "title": "固定槽位，切换纹理",
  "src": "demos/clip-1.html",
  "duration": 4.2,
  "status": "authored",
  "description": "0–4.2 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 让弧线接住产品名

图块退场后，弧线留在原处，单行产品名接替图块成为主体。用同一条基线连接两种画面。

标题保持中等字重的衬线字形，先留足阅读时间，再退回三块拼贴。

```motion-demo
{
  "id": "clip-2",
  "title": "让弧线接住产品名",
  "src": "demos/clip-2.html",
  "duration": 4.499999999999999,
  "status": "authored",
  "description": "4.2–8.7 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 首尾回到同一构图

纹理快切 → 弧线进入 → 标题留读 → 回到拼贴。结尾恢复三个槽位，循环时保持布局连续。

| 时间 | 段落 |
|---|---|
| 0.00–1.50s | 三列纹理切换 |
| 1.50–4.20s | 细弧线进入 |
| 4.20–4.60s | 纹理退场 |
| 4.60–7.40s | 弧线上产品名 |
| 7.40–8.70s | 文字退场 |
| 8.70–11.08s | 回到三列拼贴 |

## 换内容，保留这三个关系



| 可替换 | 保持不变 |
| --- | --- |
| 图块纹理与强调色 | 三列位置、等距与形状变化 |
| 产品名 | 弧线承接与单行标题 |
| 展示时长 | 快切与留读的节奏差 |

## 配色与字形

中等字重衬线产品名；黑色细弧线；三列拼贴块与大留白。

#f8f8f5 · #171716 · #e1b93e · #cb5c8d · #366288

## 元素与制作规则

三列图形槽位 / 方形与 L 形遮罩 / 纹理填充 / 弧线基线 / 产品标题

- 三列位置保持稳定，内部纹理与 L 形朝向离散切换；切换素材不等于整体图块平移。
- 低位细弧线承接三列图块，再承接产品名，靠同一基线维持连续性。
- 标题留读后消失，图块回到起始构图；尾段是循环回接。

## 内容替换

- 保留三列、遮罩变化、弧线承接和循环节奏；替换纹理及产品名。
- 标题建议单行 12–22 个拉丁字符；中文需按实际字宽调整。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Anthropic",
  "id": "V003",
  "palette": [
    "#f8f8f5",
    "#171716",
    "#e1b93e",
    "#cb5c8d",
    "#366288"
  ],
  "typography": "中等字重衬线产品名；黑色细弧线；三列拼贴块与大留白",
  "sample": "Claude Haiku 5.5",
  "objects": [
    "三列图形槽位",
    "方形与 L 形遮罩",
    "纹理填充",
    "弧线基线",
    "产品标题"
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
      "timeSeconds": 1.5,
      "frameId": "K0004",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 4.25,
      "frameId": "K0012",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 7.0,
      "frameId": "K0017",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 9.0,
      "frameId": "K0019",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "三列纹理切换",
      "end": 1.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.5,
      "label": "细弧线进入",
      "end": 4.2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.2,
      "label": "纹理退场",
      "end": 4.6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.6,
      "label": "弧线上产品名",
      "end": 7.4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7.4,
      "label": "文字退场",
      "end": 8.7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8.7,
      "label": "回到三列拼贴",
      "end": 11.083333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 11.083333,
  "fontFamily": "Georgia, serif"
}
```
