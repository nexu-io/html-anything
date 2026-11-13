# 上下文环形标题

用极少的文字和细圆环，把注意力从代理引向它依赖的上下文。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 11.3113,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 8,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Agents and context",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#c86147"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Agents and context",
        "accent": "#c86147"
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

## 先组合，再把画面让给句子

细圆环在中心聚成一个簇，Agents 位于其下。环簇退出后再出现完整判断句，边缘稀疏符号保持低对比。

```motion-demo
{
  "id": "clip-1",
  "title": "先组合，再把画面让给句子",
  "src": "demos/clip-1.html",
  "duration": 3,
  "status": "authored",
  "description": "1–4 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 关键词拥有最后一个动作

短句沿同一基线逐步展开，context 最后出现并被细圆圈包围。黑底、浅灰等宽字和少量暖橙色即可形成层级，圈线不覆盖文字。

## 保留依赖关系，替换主张

可换成工具与数据、创作与素材等一对依赖关系。先给主体，再给限制条件；关键词短而明确，前后两段都围绕同一中心。

## 配色与字形

等宽小字号、宽字距；中心单行短句，关键词用暖橙色。

#111111 · #e7e4de · #c86147 · #555653 · #222222

## 元素与制作规则

中心圆环簇 / 等宽短句 / 上下文关键词 / 两侧点阵

- 用极少的文字和细圆环，把注意力从代理引向它依赖的上下文。
- 细圆环在中心聚成一个簇，Agents 位于其下。环簇退出后再出现完整判断句，边缘稀疏符号保持低对比。
- 短句沿同一基线逐步展开，context 最后出现并被细圆圈包围。黑底、浅灰等宽字和少量暖橙色即可形成层级，圈线不覆盖文字。

## 内容替换

- 可换成工具与数据、创作与素材等一对依赖关系。先给主体，再给限制条件；关键词短而明确，前后两段都围绕同一中心。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Parallel Web Systems",
  "id": "V341",
  "palette": [
    "#111111",
    "#e7e4de",
    "#c86147",
    "#555653",
    "#222222"
  ],
  "typography": "等宽小字号、宽字距；中心单行短句，关键词用暖橙色",
  "sample": "Agents and context",
  "objects": [
    "中心圆环簇",
    "等宽短句",
    "上下文关键词",
    "两侧点阵"
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
      "timeSeconds": 1.0010000000000001,
      "frameId": "K0002",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 2.0020000000000002,
      "frameId": "K0003",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 5.005,
      "frameId": "K0006",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 8.008000000000001,
      "frameId": "K0009",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 10.01,
      "frameId": "K0011",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "光标",
      "end": 1,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1,
      "label": "圆环簇出现",
      "end": 2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2,
      "label": "Agents",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "清场",
      "end": 5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5,
      "label": "短句逐字进入",
      "end": 8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8,
      "label": "context 圈选",
      "end": 10,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10,
      "label": "退出",
      "end": 11.3113,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 11.3113,
  "fontFamily": "ui-monospace, monospace"
}
```
