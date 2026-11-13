# 用 MCP 迁移到 Framer

前窗固定在右上，后窗位于左下。两者保持相同透视方向，后窗收起时先缩为一点，再沿斜轴展开。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 6.1,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 2,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "MCP migration",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#173aff"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "MCP migration",
        "accent": "#173aff"
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

## 两张窗口共用一条斜轴

前窗固定在右上，后窗位于左下。两者保持相同透视方向，后窗收起时先缩为一点，再沿斜轴展开。

```motion-demo
{
  "id": "clip-1",
  "title": "两张窗口共用一条斜轴",
  "src": "demos/clip-1.html",
  "duration": 2.0,
  "status": "authored",
  "description": "0.5–2.5 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 发光集中在边缘

纯黑背景上只用电蓝、浅蓝与白色高光。玻璃面半透明，左上边缘最亮，细碎拖尾沿移动方向向外散开。

## 把循环用于迁移或同步

替换窗口内部标志即可表达另一组工具。维持前景主体稳定，避免两个窗口同时大幅移动而失去参照。

## 配色与字形

无正文的蓝色发光玻璃图形；黑底留出宽阔负空间。。

#000000 · #ffffff · #173aff · #061748 · #7ddaff

## 元素与制作规则

前景窗口 / 后景窗口 / 蓝色边缘 / 拖尾颗粒

- 前窗固定在右上，后窗位于左下。两者保持相同透视方向，后窗收起时先缩为一点，再沿斜轴展开。
- 纯黑背景上只用电蓝、浅蓝与白色高光。玻璃面半透明，左上边缘最亮，细碎拖尾沿移动方向向外散开。
- 替换窗口内部标志即可表达另一组工具。维持前景主体稳定，避免两个窗口同时大幅移动而失去参照。

## 内容替换

- 保留双平面与错位伸缩关系，可替换同步或迁移对象。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Framer",
  "id": "V153",
  "palette": [
    "#000000",
    "#ffffff",
    "#173aff",
    "#061748",
    "#7ddaff"
  ],
  "typography": "无正文的蓝色发光玻璃图形；黑底留出宽阔负空间。",
  "sample": "MCP migration",
  "objects": [
    "前景窗口",
    "后景窗口",
    "蓝色边缘",
    "拖尾颗粒"
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
      "timeSeconds": 0.8,
      "frameId": "K0004",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 1.2666666666666666,
      "frameId": "K0006",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 3.8,
      "frameId": "K0016",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 4.533333333333333,
      "frameId": "K0019",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "双窗口叠合",
      "end": 0.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.8,
      "label": "后窗收起",
      "end": 1.3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.3,
      "label": "后窗重新长出",
      "end": 3.7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.7,
      "label": "循环收起",
      "end": 4.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.5,
      "label": "窗口复位",
      "end": 6.1,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 6.1,
  "fontFamily": "Arial, sans-serif"
}
```
