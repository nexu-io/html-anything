# 石膏方块拆出 H

先旋转立方体并拉远，白色细缝沿边缘出现后，各面向外散开。H 留在原中心，分离距离逐渐加大到面板离开画幅。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 4.625,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 2.0,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "H",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#242424"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "H",
        "accent": "#242424"
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

## 外壳沿面法线分离，字母不动

先旋转立方体并拉远，白色细缝沿边缘出现后，各面向外散开。H 留在原中心，分离距离逐渐加大到面板离开画幅。

```motion-demo
{
  "id": "clip-1",
  "title": "外壳沿面法线分离，字母不动",
  "src": "demos/clip-1.html",
  "duration": 2.3,
  "status": "authored",
  "description": "1.3–3.6 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 从重材质切换到轻留白

开始用深灰石膏和侧面明暗区分体积；裂缝变宽时背景同时变浅，结尾只留黑字与轻微地面影。替换字母需先检查外壳能完整遮住它。

## 配色与字形

灰黑石膏立方体、白色裂缝与黑色字母，最终回到浅纸底。。

#575757 · #f2f2ef · #242424 · #a7a7a3 · #d1d1cd

## 元素与制作规则

立方体六面 / 白色裂缝 / 中央字母 / 地面投影

- 先旋转立方体并拉远，白色细缝沿边缘出现后，各面向外散开。H 留在原中心，分离距离逐渐加大到面板离开画幅。
- 开始用深灰石膏和侧面明暗区分体积；裂缝变宽时背景同时变浅，结尾只留黑字与轻微地面影。替换字母需先检查外壳能完整遮住它。

## 内容替换

- 替换中心短字标，保留外壳拆开而主体不动的揭示。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Harvey",
  "id": "V334",
  "palette": [
    "#575757",
    "#f2f2ef",
    "#242424",
    "#a7a7a3",
    "#d1d1cd"
  ],
  "typography": "灰黑石膏立方体、白色裂缝与黑色字母，最终回到浅纸底。",
  "sample": "H",
  "objects": [
    "立方体六面",
    "白色裂缝",
    "中央字母",
    "地面投影"
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
      "timeSeconds": 0.5,
      "frameId": "K0003",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 1.5,
      "frameId": "K0007",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 2.0,
      "frameId": "K0009",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 3.0,
      "frameId": "K0013",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 4.0,
      "frameId": "K0015",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "立方体近景",
      "end": 0.6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.6,
      "label": "旋转拉远",
      "end": 1.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.5,
      "label": "边缘裂开",
      "end": 2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2,
      "label": "面板分离",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "字母露出",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "留白",
      "end": 4.625,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 4.625,
  "fontFamily": "Arial, sans-serif"
}
```
