# Geist Serif

以三角标志进入蓝底工程图，再放大单字轮廓。细线、尺寸标记和控制点服务于笔画结构，不能盖过字形。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 43.333333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 19.8,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Geist Serif",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#1414ff"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Geist Serif",
        "accent": "#1414ff"
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

## 把字体当作可观察的形状

以三角标志进入蓝底工程图，再放大单字轮廓。细线、尺寸标记和控制点服务于笔画结构，不能盖过字形。

## 在巨型细节与整套字符之间切换

裁切到衬线端部之后，拉回大小写、数字与符号的完整字符集；字重对照按由粗到细纵向排列，保持同一基线逻辑。

| 时间 | 段落 |
|---|---|
| 0.00–1.00s | 三角标志 |
| 1.00–4.00s | 蓝底结构图 |
| 4.00–10.00s | G 字轮廓 |
| 10.00–14.00s | 巨型字形裁切 |
| 14.00–19.00s | 字符集 |
| 19.00–21.00s | 字重阶梯 |
| 21.00–31.00s | 节点与曲线 |
| 31.00–33.00s | 异体对比 |
| 33.00–38.00s | 倾斜轴 |
| 38.00–43.33s | 词样与标志 |

## 只让关键节点动起来

放大 k、R、O 等字形，展示曲线节点、替代字形或轴线角度。控制点与轮廓同步，不添加与字形无关的背景运动。

```motion-demo
{
  "id": "clip-3",
  "title": "只让关键节点动起来",
  "src": "demos/clip-3.html",
  "duration": 6,
  "status": "authored",
  "description": "21–27 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 替换另一套字体时重做字形样本

沿用蓝白、标注和比例对比结构，但字符轮廓必须来自目标字体。最后用一个短词展示阅读效果，再回到品牌标志。

## 配色与字形

蓝白两色；大幅衬线字、细工程标注与字重对照并置。。

#ffffff · #1515f4 · #1414ff · #b4b7ff · #7777cf

## 元素与制作规则

衬线字形 / 基线网格 / 贝塞尔控制点 / 字符集 / 字重对比 / 蓝色三角

- 以三角标志进入蓝底工程图，再放大单字轮廓。细线、尺寸标记和控制点服务于笔画结构，不能盖过字形。
- 裁切到衬线端部之后，拉回大小写、数字与符号的完整字符集；字重对照按由粗到细纵向排列，保持同一基线逻辑。
- 放大 k、R、O 等字形，展示曲线节点、替代字形或轴线角度。控制点与轮廓同步，不添加与字形无关的背景运动。

## 内容替换

- 替换目标字体后保留从结构到字符集再到排版效果的顺序。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Vercel",
  "id": "V154",
  "palette": [
    "#ffffff",
    "#1515f4",
    "#1414ff",
    "#b4b7ff",
    "#7777cf"
  ],
  "typography": "蓝白两色；大幅衬线字、细工程标注与字重对照并置。",
  "sample": "Geist Serif",
  "objects": [
    "衬线字形",
    "基线网格",
    "贝塞尔控制点",
    "字符集",
    "字重对比",
    "蓝色三角"
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
      "timeSeconds": 4.0,
      "frameId": "K0010",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 14.0,
      "frameId": "K0044",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 19.0,
      "frameId": "K0063",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 31.0,
      "frameId": "K0109",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 38.0,
      "frameId": "K0135",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "三角标志",
      "end": 1,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1,
      "label": "蓝底结构图",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "G 字轮廓",
      "end": 10,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10,
      "label": "巨型字形裁切",
      "end": 14,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 14,
      "label": "字符集",
      "end": 19,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 19,
      "label": "字重阶梯",
      "end": 21,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 21,
      "label": "节点与曲线",
      "end": 31,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 31,
      "label": "异体对比",
      "end": 33,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 33,
      "label": "倾斜轴",
      "end": 38,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 38,
      "label": "词样与标志",
      "end": 43.333333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 43.333333,
  "fontFamily": "Georgia, serif"
}
```
