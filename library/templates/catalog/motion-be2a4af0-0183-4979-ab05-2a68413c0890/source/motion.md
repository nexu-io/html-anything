# Lovable — skills in Lovable.

一句短标题留在画面中央，周围形体缓慢漂浮；一次穿越触发划线，让静态文案发生语义变化。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 8.05,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 4.5,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Skill issue?",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#ff6b4c"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Skill issue?",
        "accent": "#ff6b4c"
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

## 标题周围留出活动空间

用米白底和黑色粗体形成阅读中心，标题保持单行。渐变形体分布在四角，大小不一；较大的形体可以局部出画，小形体完整露出。

形体使用粉、橙、蓝的连续过渡，标题不跟随形体改变颜色或位置。小品牌标记放在独立安静区域。

## 让穿越成为唯一的强动作

常态漂浮的幅度小、速度低，各形体的旋转略有错拍。选一个形体穿过标题区域，穿过时带出短划线；其余形体继续缓慢运动，避免同时抢焦点。

划线沿文字基线附近展开，读者还能认出原句。短暂停留后撤掉划线，形体回到可自然衔接开头的状态。

## 替换一句可以被回应的话

选短疑问、误解或挑战句，保证划线带来的语义成立。可以替换形体材质和品牌色；保留中央稳定文字、周边慢动、单次穿越三个层级。

## 配色与字形

无衬线界面文字与清晰大小层级。

#f8f5ef · #151616 · #ff6b4c · #df38d0 · #7498fc

## 元素与制作规则

居中标题 / 角落渐变图形 / 划线 / 小品牌

- 标题基本固定，四周不同尺度的柔软图形旋转漂浮
- 一个图形穿过标题触发短暂划线，动作与语义同步
- 大图形局部出界，小图形留在画内，形成景深层次

## 内容替换

- 替换一句质疑句与品牌符号，保留穿过→划线的因果
- 文字保持一行，不能让环绕元素抢占中心阅读区

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Lovable",
  "id": "V044",
  "palette": [
    "#f8f5ef",
    "#151616",
    "#ff6b4c",
    "#df38d0",
    "#7498fc"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "Skill issue?",
  "objects": [
    "居中标题",
    "角落渐变图形",
    "划线",
    "小品牌"
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
      "timeSeconds": 1.0,
      "frameId": "K0005",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 4.25,
      "frameId": "K0017",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 4.75,
      "frameId": "K0019",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 6.0,
      "frameId": "K0022",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "中心标题与角落图形",
      "end": 1.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.0,
      "label": "图形漂浮旋转",
      "end": 4.3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.3,
      "label": "图形穿过标题",
      "end": 4.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.8,
      "label": "标题划线",
      "end": 6.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6.0,
      "label": "回到初始标题",
      "end": 8.05,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 8.05,
  "fontFamily": "Arial, sans-serif"
}
```
