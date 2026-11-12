# 排字动效 · 3.5 秒

用字的尺度和对齐方式完成整段动效：先看到字形局部，再拉回完整短句，最后拆成一列可移动的动作词。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 3.516667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 1.6,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Made to move",
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
        "title": "Made to move",
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

## 文字由近到远，行线保持水平

开头放大 Made 的局部，缩小后分为 Made / to / move 三行。细横线标明行高，短词在行内左右错开，行距紧但不重叠。

```motion-demo
{
  "id": "clip-1",
  "title": "文字由近到远，行线保持水平",
  "src": "demos/clip-1.html",
  "duration": 2.2,
  "status": "authored",
  "description": "0–2.2 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 动词列表保持六行容量

结尾以 Design、Generate、Collaborate、Animate、Explore、Remix 六行替换大标题，各行横向滑到不同对齐点。黑底白字，次要词允许灰色；新文案应保持短词和近似字长。

## 配色与字形

紧凑无衬线粗体；沿水平基准线排列，左右对齐交替。

#000000 · #ffffff · #ffffff · #777777

## 元素与制作规则

大字局部 / 水平细线 / 三行标题 / 动词列表

- 开头放大 Made 的局部，缩小后分为 Made / to / move 三行。细横线标明行高，短词在行内左右错开，行距紧但不重叠。
- 结尾以 Design、Generate、Collaborate、Animate、Explore、Remix 六行替换大标题，各行横向滑到不同对齐点。黑底白字，次要词允许灰色；新文案应保持短词和近似字长。

## 内容替换

- 替换三行主张和最多六个动作词；按字长重新计算行宽。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Modyfi",
  "id": "V360",
  "palette": [
    "#000000",
    "#ffffff",
    "#ffffff",
    "#777777"
  ],
  "typography": "紧凑无衬线粗体；沿水平基准线排列，左右对齐交替",
  "sample": "Made to move",
  "objects": [
    "大字局部",
    "水平细线",
    "三行标题",
    "动词列表"
  ],
  "frames": [
    {
      "path": "assets/reference-1.jpg",
      "timeSeconds": 0.0,
      "frameId": "K0001",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-2.jpg",
      "timeSeconds": 1.25,
      "frameId": "K0007",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/5e52e33319a159f2ededbb3d002a68cf7b0d9e3010e3131fe83493678e93c1e3",
      "timeSeconds": 2.25,
      "frameId": "K0013",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "超大字局部",
      "end": 1.3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.3,
      "label": "三行主张",
      "end": 2.2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.2,
      "label": "六项动词列表",
      "end": 3.516667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 3.516667,
  "fontFamily": "Arial, sans-serif"
}
```
