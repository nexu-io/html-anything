# Creative Cloud｜标志主片

一条标志轮廓贯穿多种创作媒介：先是设计界面，再是涂鸦、图像和微景观。每次换材质都保留中心形状。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 9.876,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 4.94,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Creative Cloud",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#ed20b8"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Creative Cloud",
        "accent": "#ed20b8"
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

## 先把标志当作设计中的对象

色条、选框和控制点围绕弧形逐步组装，网格与工具标签在外围。标志稳定后再让材质与装饰接管画面。

## 不同创作媒介沿同一轮廓交接

涂鸦、摄影、立体景观可以完全换风格，但主轮廓的大小与重心保持接近。外围素材错开进入，换段时优先沿弧线擦除或接续。

```motion-demo
{
  "id": "clip-2",
  "title": "不同创作媒介沿同一轮廓交接",
  "src": "demos/clip-2.html",
  "duration": 3.6000000000000005,
  "status": "authored",
  "description": "2.8–6.4 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 最后沿轮廓拆开结束

景观轨道收缩、拆段、退出，让中心回到白场。换品牌时先设计一个在各种媒介中都能认出的基础剪影，再准备一组配套风格。

## 配色与字形

以标志轮廓与材质为主；文字只是拼贴或编辑辅助。

#ffffff · #171717 · #ed20b8 · #ffc20c · #57c2d9

## 元素与制作规则

标志弧线 / 材质层 / 外围装饰 / 局部光泽 / 编辑线框

- 色条、选框和控制点围绕弧形逐步组装，网格与工具标签在外围。标志稳定后再让材质与装饰接管画面。
- 涂鸦、摄影、立体景观可以完全换风格，但主轮廓的大小与重心保持接近。外围素材错开进入，换段时优先沿弧线擦除或接续。
- 景观轨道收缩、拆段、退出，让中心回到白场。换品牌时先设计一个在各种媒介中都能认出的基础剪影，再准备一组配套风格。

## 内容替换

- 替换基础标志与风格素材组；保留相同重心、尺度与外围留白。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Adobe",
  "id": "V343",
  "palette": [
    "#ffffff",
    "#171717",
    "#ed20b8",
    "#ffc20c",
    "#57c2d9"
  ],
  "typography": "以标志轮廓与材质为主；文字只是拼贴或编辑辅助",
  "sample": "Creative Cloud",
  "objects": [
    "标志弧线",
    "材质层",
    "外围装饰",
    "局部光泽",
    "编辑线框"
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
      "timeSeconds": 1.8594979079497906,
      "frameId": "K0008",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 2.8512301255230126,
      "frameId": "K0012",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 4.25618410041841,
      "frameId": "K0018",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 6.239648535564854,
      "frameId": "K0026",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 8.51236820083682,
      "frameId": "K0034",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "设计网格组装",
      "end": 1.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.8,
      "label": "玻璃按钮",
      "end": 2.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.8,
      "label": "涂鸦拼贴",
      "end": 4.4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.4,
      "label": "图像与色条",
      "end": 6.3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6.3,
      "label": "自然微景观",
      "end": 8.6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8.6,
      "label": "拆散退场",
      "end": 9.876,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 9.876,
  "fontFamily": "Arial, sans-serif"
}
```
