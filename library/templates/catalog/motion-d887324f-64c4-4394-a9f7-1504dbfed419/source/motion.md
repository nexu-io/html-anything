# 界面按钮排列 · 10.7 秒

让三个带缺口的效果按钮像可拼合的模块一样拆散再归位；顺序从底项开始，保留紧密的竖向关系。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 10.683333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 5.4,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Effects",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#ffffff"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Effects",
        "accent": "#ffffff"
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

## 不规则轮廓要为相邻项留口

每个按钮都有局部凹口与斜边，堆叠时保持相近宽度和小间距。标签贴近轮廓平直的区域，方向箭头留在另一端。

## 离场一起，回场错开

三个按钮短促滑出后，Gradient Fill 先返回，再加入 Fractal Noise 与 Halftone。黑底与白色细轮廓保持极简，移动时标签和箭头跟随容器。

```motion-demo
{
  "id": "clip-2",
  "title": "离场一起，回场错开",
  "src": "demos/clip-2.html",
  "duration": 4.5,
  "status": "authored",
  "description": "1–5.5 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 更换标签保留三项容量

适合短效果名或工具名；内容变长时优先加宽模块，不让标签碰到凹口。循环开始与结束使用同一排列。

## 配色与字形

微型无衬线标签；细白描边与倒角缺口轮廓。

#000000 · #ffffff · #ffffff · #777777

## 元素与制作规则

不规则描边按钮 / 效果名 / 折角 / 方向箭头

- 每个按钮都有局部凹口与斜边，堆叠时保持相近宽度和小间距。标签贴近轮廓平直的区域，方向箭头留在另一端。
- 三个按钮短促滑出后，Gradient Fill 先返回，再加入 Fractal Noise 与 Halftone。黑底与白色细轮廓保持极简，移动时标签和箭头跟随容器。
- 适合短效果名或工具名；内容变长时优先加宽模块，不让标签碰到凹口。循环开始与结束使用同一排列。

## 内容替换

- 替换三个短工具名；保留底→中→顶的组装顺序。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Modyfi",
  "id": "V361",
  "palette": [
    "#000000",
    "#ffffff",
    "#ffffff",
    "#777777"
  ],
  "typography": "微型无衬线标签；细白描边与倒角缺口轮廓",
  "sample": "Effects",
  "objects": [
    "不规则描边按钮",
    "效果名",
    "折角",
    "方向箭头"
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
      "timeSeconds": 1.0,
      "frameId": "K0002",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 2.0,
      "frameId": "K0004",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 5.0,
      "frameId": "K0007",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 6.35,
      "frameId": "K0009",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 10.0,
      "frameId": "K0013",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "三项按钮",
      "end": 1.1,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.1,
      "label": "整体滑出",
      "end": 2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2,
      "label": "底项先回",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "中项加入",
      "end": 5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5,
      "label": "顶项加入",
      "end": 6.2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6.2,
      "label": "再次重组",
      "end": 10,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10,
      "label": "循环落定",
      "end": 10.683333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 10.683333,
  "fontFamily": "Arial, sans-serif"
}
```
