# Welcome to the Age of No-Code

通过一次从暗到亮的空间穿越，把紧密的界面与代码区域转成开放、可探索的创作世界。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 89.833333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 60,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Age of No-Code",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#4836ef"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Age of No-Code",
        "accent": "#4836ef"
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

## 前半段收紧空间

深蓝近黑背景，代码与网页平面包围中心；用重复框架和旋转多边形形成纵深，中心小球作为穿越方向的锚点。

```motion-demo
{
  "id": "clip-1",
  "title": "前半段收紧空间",
  "src": "demos/clip-1.html",
  "duration": 8,
  "status": "authored",
  "description": "20–28 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 越过边界后打开尺度

进入浅色空间后提高背景明度，增大物体间距；球体、平面和曲面不再密集包围视点。蓝紫仍贯穿，青、粉作为新空间的材质变化。

## 以空间扩张代替长篇宣言

从控件、页面走到场景再走到星系，规模逐段放大。最后切干净白底与小标志，给复杂运动一个明确结束。

| 时间 | 段落 |
|---|---|
| 0.00–10.00s | 暗色界面 |
| 10.00–16.00s | 代码与页面 |
| 16.00–21.00s | 暗到亮的边界 |
| 21.00–35.00s | 旋转几何隧道 |
| 35.00–43.00s | 中心球体 |
| 43.00–54.00s | 多种创作单元 |
| 54.00–68.00s | 明亮开放空间 |
| 68.00–81.00s | 几何世界 |
| 81.00–88.00s | 星系 |
| 88.00–89.83s | 大会标志 |

## 迁移时保留前后反差

新主题可以换创作对象，但暗／亮、拥挤／开阔、局部／整体三组反差要对应同一个成长叙事。不要把全片变成随机三维素材串联。

## 配色与字形

收尾品牌字标简短；主体为球体、几何门与抽象界面。

#09091c · #ffffff · #4836ef · #8de9e6 · #f0a6d5

## 元素与制作规则

暗色网页 / 代码平面 / 旋转门户 / 球体 / 开放地形 / 星系轨道

- 深蓝近黑背景，代码与网页平面包围中心；用重复框架和旋转多边形形成纵深，中心小球作为穿越方向的锚点。
- 进入浅色空间后提高背景明度，增大物体间距；球体、平面和曲面不再密集包围视点。蓝紫仍贯穿，青、粉作为新空间的材质变化。
- 从控件、页面走到场景再走到星系，规模逐段放大。最后切干净白底与小标志，给复杂运动一个明确结束。
- 新主题可以换创作对象，但暗／亮、拥挤／开阔、局部／整体三组反差要对应同一个成长叙事。不要把全片变成随机三维素材串联。

## 内容替换

- 替换具体创作对象；保留空间从封闭到开放的变化。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Webflow",
  "id": "V353",
  "palette": [
    "#09091c",
    "#ffffff",
    "#4836ef",
    "#8de9e6",
    "#f0a6d5"
  ],
  "typography": "收尾品牌字标简短；主体为球体、几何门与抽象界面",
  "sample": "Age of No-Code",
  "objects": [
    "暗色网页",
    "代码平面",
    "旋转门户",
    "球体",
    "开放地形",
    "星系轨道"
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
      "timeSeconds": 16.0,
      "frameId": "K0059",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 35.0,
      "frameId": "K0131",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 43.0,
      "frameId": "K0166",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 68.0,
      "frameId": "K0266",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 88.0,
      "frameId": "K0344",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "暗色界面",
      "end": 10,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10,
      "label": "代码与页面",
      "end": 16,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 16,
      "label": "暗到亮的边界",
      "end": 21,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 21,
      "label": "旋转几何隧道",
      "end": 35,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 35,
      "label": "中心球体",
      "end": 43,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 43,
      "label": "多种创作单元",
      "end": 54,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 54,
      "label": "明亮开放空间",
      "end": 68,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 68,
      "label": "几何世界",
      "end": 81,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 81,
      "label": "星系",
      "end": 88,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 88,
      "label": "大会标志",
      "end": 89.833333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 89.833333,
  "fontFamily": "Arial, sans-serif"
}
```
