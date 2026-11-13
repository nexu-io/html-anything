# Magistral 发布

先交代程序要完成的具体要求，再让代码旁边出现连续运行的结果。整个画面围绕同一个编程任务推进。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 36.3,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 33.5,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Magistral",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#ec5e29"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Magistral",
        "accent": "#ec5e29"
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

## 长提示词分成可扫读的要求

深色聊天界面上，提示框居中，正文按条目排列。等宽字用于代码，普通无衬线用于说明；橙色标志和少量彩色小球提供强调。

## 从要求走到解释与代码

提示输入完成后缩回聊天布局，接上分段说明。镜头跟随当前重点向下移动，保留一部分上文，帮助阅读顺序衔接。

```motion-demo
{
  "id": "clip-2",
  "title": "从要求走到解释与代码",
  "src": "demos/clip-2.html",
  "duration": 29,
  "status": "authored",
  "description": "0–29 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 运行结果占据完整一侧

代码留在左边，右边展示九种多边形。边数递增形成规则，小球颜色区分个体；图形旋转、缩放时始终留在各自格内。

运行段保持足够长的连续运动，让观众能看见边界、球体与变化之间的关系。

```motion-demo
{
  "id": "clip-3",
  "title": "运行结果占据完整一侧",
  "src": "demos/clip-3.html",
  "duration": 7.299999999999997,
  "status": "authored",
  "description": "29–36.3 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 换一种编程案例

可改成图表、布局或交互组件。先写可看见的要求，再选择对应结果画面；保留提示、说明、代码、运行四层，但不必让每层占相同时间。

## 配色与字形

深色聊天录屏、密集等宽代码、九宫格物理示例。

#151515 · #f0f0ee · #ec5e29 · #6ac69e · #a384d9

## 元素与制作规则

提示词 / 思考段落 / 说明 / 代码 / 九宫格多边形 / 彩色小球

- 先展示具体约束，再显示解释和代码，最后并排运行结果。
- 多边形边数逐格增加，小球在边界内运动，形成可见验证。
- 镜头从输入近景拉远到聊天，再推近最终双栏。

## 内容替换

- 可换成其他编程任务，但必须有可视化验收结果。
- 多边形边界和球体运动共同承担验收画面，保持九格清晰分离。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Mistral",
  "id": "V036",
  "palette": [
    "#151515",
    "#f0f0ee",
    "#ec5e29",
    "#6ac69e",
    "#a384d9"
  ],
  "typography": "深色聊天录屏、密集等宽代码、九宫格物理示例",
  "sample": "Magistral",
  "objects": [
    "提示词",
    "思考段落",
    "说明",
    "代码",
    "九宫格多边形",
    "彩色小球"
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
      "timeSeconds": 9.0,
      "frameId": "K0021",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 12.0,
      "frameId": "K0029",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 23.0,
      "frameId": "K0044",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 29.0,
      "frameId": "K0065",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 32.0,
      "frameId": "K0078",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "长要求输入",
      "end": 9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9,
      "label": "提交任务",
      "end": 12,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12,
      "label": "推理展开",
      "end": 23,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 23,
      "label": "程序说明",
      "end": 29,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 29,
      "label": "代码与结果并排",
      "end": 32,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 32,
      "label": "九种多边形运行",
      "end": 36.3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 36.3,
  "fontFamily": "ui-monospace, monospace"
}
```
