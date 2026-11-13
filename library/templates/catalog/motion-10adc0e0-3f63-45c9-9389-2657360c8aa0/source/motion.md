# 研究突破｜数学与理论计算机科学成果

用点和线建立一组研究图示。每个主题逐步成形，再把视觉复杂度降下来，为下一个主题腾出空间。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 31.948583,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 9.3,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Mathematical Advances",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#33ca69"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Mathematical Advances",
        "accent": "#33ca69"
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

## 把索引放到边角

黑板色背景配粉笔白细线，中心留给主要图形。学科、编号和短标题固定在边角，用等宽字保持整齐；强调色只用于当前节点或重点关系。

## 按图形的构成顺序绘制

圆点先出现，再连接边，最后增加填充或密度。三角形、格点、密堆积和网络各自采用能解释结构的生长方式。

上一图撤去时保留少量点，让这些点成为下一图的起点。

```motion-demo
{
  "id": "clip-2",
  "title": "按图形的构成顺序绘制",
  "src": "demos/clip-2.html",
  "duration": 14,
  "status": "authored",
  "description": "9–23 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 几何主题之间如何切换

先给一个可辨认整体，再用近一步的细节展开。章节结束时减少元素数量，最终切白底标题，拉开与前面黑板内容的密度差。

| 时间 | 段落 |
|---|---|
| 0.00–4.00s | 标题与点阵 |
| 4.00–9.00s | 圆内密堆积 |
| 9.00–14.00s | 格点与标注 |
| 14.00–19.00s | 三角几何 |
| 19.00–23.00s | 节点图 |
| 23.00–28.50s | 分层网络 |
| 28.50–31.95s | 白底品牌 |

## 换成新的知识主题

先选能表达该主题的图示，再替换名称。沿用点、线和边角索引，不让相邻图示的构建过程完全相同。

## 配色与字形

粉笔黑板、点阵与细线几何、角落等宽编号。

#111419 · #f1f1eb · #33ca69 · #d99ab5 · #97a4ca

## 元素与制作规则

网格 / 圆点集合 / 粉笔线 / 手写注释 / 编号栏

- 每一研究主题用一种几何图建立，再归约为少量点以接入下个图。
- 标题、编号和学科在边角维持稳定索引，主体变化在中心。
- 点、边和填充依次构建，避免整个数学图一帧出现。

## 内容替换

- 替换知识领域时定义对应图示和图例，不能只改名称。
- 保留少量点作为不同图间的共同视觉原语。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "OpenAI",
  "id": "V011",
  "palette": [
    "#111419",
    "#f1f1eb",
    "#33ca69",
    "#d99ab5",
    "#97a4ca"
  ],
  "typography": "粉笔黑板、点阵与细线几何、角落等宽编号",
  "sample": "Mathematical Advances",
  "objects": [
    "网格",
    "圆点集合",
    "粉笔线",
    "手写注释",
    "编号栏"
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
      "timeSeconds": 4.004,
      "frameId": "K0005",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 9.008999999999999,
      "frameId": "K0016",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 19.019,
      "frameId": "K0030",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 23.023,
      "frameId": "K0034",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 28.528499999999998,
      "frameId": "K0041",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "标题与点阵",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "圆内密堆积",
      "end": 9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9,
      "label": "格点与标注",
      "end": 14,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 14,
      "label": "三角几何",
      "end": 19,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 19,
      "label": "节点图",
      "end": 23,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 23,
      "label": "分层网络",
      "end": 28.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 28.5,
      "label": "白底品牌",
      "end": 31.948583,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 31.948583,
  "fontFamily": "ui-monospace, monospace"
}
```
