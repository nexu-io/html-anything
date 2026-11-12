# Universe 2023｜几何循环

一颗球、一块圆片和一块方片组成紧凑的旋转构图。方片绕中心移动，遮挡关系让平面也有空间感。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 14.9,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 4,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Orbit study",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#21e88a"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Orbit study",
        "accent": "#21e88a"
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

## 三种形状分开控制

球体保持大体居中，圆片靠着球面移动，方片同时改变位置与角度。近侧盖在球前，远侧退后；不要把三个物体锁成一张整图旋转。

```motion-demo
{
  "id": "clip-1",
  "title": "三种形状分开控制",
  "src": "demos/clip-1.html",
  "duration": 6.8,
  "status": "authored",
  "description": "0.7–7.5 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 光泽统一，轮廓要不同

黑底承托蓝、绿、青高光。球体用圆滑明暗，方片用方向性渐变，圆片保留较平的蓝面。循环末段缩小整组，为再次出现留黑场。

## 用于背景时保留空白

适合短片过渡或品牌纹理。更换几何或材质时仍保留一个体积主体与两种平面，避免添加解释文字遮住遮挡关系。

## 配色与字形

无正文；球面、圆片与方片靠形状和光泽区分。

#000000 · #ffffff · #21e88a · #134bd9 · #8bd6ed

## 元素与制作规则

蓝绿球体 / 蓝色圆片 / 渐变方片

- 球体保持大体居中，圆片靠着球面移动，方片同时改变位置与角度。近侧盖在球前，远侧退后；不要把三个物体锁成一张整图旋转。
- 黑底承托蓝、绿、青高光。球体用圆滑明暗，方片用方向性渐变，圆片保留较平的蓝面。循环末段缩小整组，为再次出现留黑场。
- 适合短片过渡或品牌纹理。更换几何或材质时仍保留一个体积主体与两种平面，避免添加解释文字遮住遮挡关系。

## 内容替换

- 可换几何和高光色；保留独立轨道、遮挡排序与整体收缩。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "GitHub",
  "id": "V349",
  "palette": [
    "#000000",
    "#ffffff",
    "#21e88a",
    "#134bd9",
    "#8bd6ed"
  ],
  "typography": "无正文；球面、圆片与方片靠形状和光泽区分",
  "sample": "Orbit study",
  "objects": [
    "蓝绿球体",
    "蓝色圆片",
    "渐变方片"
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
      "timeSeconds": 0.7946666666666666,
      "frameId": "K0004",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 7.483111111111111,
      "frameId": "K0031",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 13.906666666666666,
      "frameId": "K0057",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "组合显现",
      "end": 0.7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.7,
      "label": "三体循环",
      "end": 7.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7.5,
      "label": "回到原侧",
      "end": 14,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 14,
      "label": "缩小隐去",
      "end": 14.9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 14.9,
  "fontFamily": "Arial, sans-serif"
}
```
