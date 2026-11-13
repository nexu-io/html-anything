# Salsa｜音乐主题 Doodle

用乐器、花瓣和舞步把音乐连成一串形状。镜头从局部动作逐渐走向街头群舞。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 48.458333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 11.3,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Salsa",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#ff476c"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Salsa",
        "accent": "#ff476c"
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

## 给乐器和舞者一套共同的轮廓

使用黄、粉、红、蓝的大色块，搭配黑色和奶油白。人物、乐器和花瓣都简化为明确轮廓，少用细纹理；品牌短字采用厚实清楚的字形。

## 从圆形里寻找转场

唱片、喇叭口与花心共享圆形中心。上一镜的圆扩大或旋转后，接入下一镜相近形状；背景色可以切换，主色块的位置持续相接。

```motion-demo
{
  "id": "clip-2",
  "title": "从圆形里寻找转场",
  "src": "demos/clip-2.html",
  "duration": 18,
  "status": "authored",
  "description": "0–18 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 身体局部和完整动作交替

舞鞋、手和琴键提供短而密的动作，整个人物提供清楚的舞姿。双人段让动作相互回应，群舞段增加人数和横向空间。

![25.00s · 构图参考](assets/reference-4.webp)

## 把场面逐次扩大

前段以单个演奏者和几何图形为主，中段进入舞步，后段把人群与街道汇在一起。几何旋转可重复，人物动作要随镜头任务改变。

| 时间 | 段落 |
|---|---|
| 0.00–6.00s | 唱片与花瓣 |
| 6.00–11.00s | 吹奏乐器 |
| 11.00–18.00s | 形状万花筒 |
| 18.00–21.00s | 打击乐 |
| 21.00–25.00s | 舞步特写 |
| 25.00–31.00s | 键盘与手 |
| 31.00–37.00s | 双人舞 |
| 37.00–43.00s | 花瓣到人群 |
| 43.00–46.00s | 街头群舞 |
| 46.00–48.46s | 品牌 |

## 换一种音乐文化

同时替换乐器、服装、动作和场景。保留形状相接的转场与从单人到群体的规模变化，为新音乐重新安排动作停顿。

## 配色与字形

高饱和扁平插画、几何花瓣、人物舞蹈与乐器特写。

#ffcd36 · #1b1010 · #ff476c · #268de3 · #fff5dd

## 元素与制作规则

唱片 / 乐器 / 花瓣 / 舞者 / 键盘 / 人群

- 用圆形唱片、喇叭口、花瓣把音乐演奏与舞步串联。
- 局部特写和整个人物交替，色块跨镜头接续；对称旋转建立重复节奏。
- 后段从单人、双人到群体，扩大场面。

## 内容替换

- 换为另一文化主题需要替换乐器、服装和动作；保留局部→全身→群体。
- 图形转场保持同一中心或同一色块。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Google",
  "id": "V021",
  "palette": [
    "#ffcd36",
    "#1b1010",
    "#ff476c",
    "#268de3",
    "#fff5dd"
  ],
  "typography": "高饱和扁平插画、几何花瓣、人物舞蹈与乐器特写",
  "sample": "Salsa",
  "objects": [
    "唱片",
    "乐器",
    "花瓣",
    "舞者",
    "键盘",
    "人群"
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
      "timeSeconds": 11.0,
      "frameId": "K0056",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 21.0,
      "frameId": "K0104",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 25.0,
      "frameId": "K0128",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 37.0,
      "frameId": "K0196",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 46.0,
      "frameId": "K0239",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "唱片与花瓣",
      "end": 6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6,
      "label": "吹奏乐器",
      "end": 11,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11,
      "label": "形状万花筒",
      "end": 18,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18,
      "label": "打击乐",
      "end": 21,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 21,
      "label": "舞步特写",
      "end": 25,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 25,
      "label": "键盘与手",
      "end": 31,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 31,
      "label": "双人舞",
      "end": 37,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 37,
      "label": "花瓣到人群",
      "end": 43,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 43,
      "label": "街头群舞",
      "end": 46,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 46,
      "label": "品牌",
      "end": 48.458333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 48.458333,
  "fontFamily": "Arial, sans-serif"
}
```
