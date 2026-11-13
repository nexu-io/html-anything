# Rive CLI — build Rive files with your agent

用一连串真正发生状态变化的作品说明交互能力：游戏、控件、设计系统和音序器各演示一个清楚动作。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 31.266667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 27,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Interactive motion",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#55efba"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Interactive motion",
        "accent": "#55efba"
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

## 先让观众看见动作，再换作品

竞速轨道有前进速度，节奏游戏有击中反馈，纸牌有位置变化。每个作品独占一屏，不把所有案例缩成同时播放的小格。

| 时间 | 段落 |
|---|---|
| 0.00–2.00s | 竞速菜单 |
| 2.00–6.00s | 轨道加速 |
| 6.00–8.20s | 节奏游戏 |
| 8.20–13.00s | 纸牌 |
| 13.00–15.00s | 玻璃控件 |
| 15.00–17.00s | 旋钮面板 |
| 17.00–21.00s | 设计系统 |
| 21.00–25.60s | 编辑器与旗帜 |
| 25.60–29.50s | 步进音序器 |
| 29.50–31.00s | 卡牌游戏 |
| 31.00–31.27s | 黑场 |

## 黑色外部舞台统一不同视觉语言

作品之间可有不同配色和字体，但四周保留黑色边距。状态数字、选中颜色与动作结果足够亮；控件的暗色基底不应吞掉边缘。

## 音序器用扫描线串起格子反馈

固定列宽与行距，亮格表示已编排步骤，播放头匀速横移。扫描到亮格时短促加强亮度，跨越空格时不改变其状态。

```motion-demo
{
  "id": "clip-3",
  "title": "音序器用扫描线串起格子反馈",
  "src": "demos/clip-3.html",
  "duration": 3.1999999999999993,
  "status": "authored",
  "description": "25.6–28.8 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 换案例时保留可见的交互因果

新主题可替换成不同应用，但每屏都要有输入、状态与反馈。多个作品可以共用外部框架，内部不必强行统一成同一风格。

## 配色与字形

无衬线紧凑游戏标题与等宽状态数字；不同作品保留自身字体，外部舞台纯黑。

#070909 · #eaf1ee · #55efba · #d553a2 · #eac34f · #8b68f5

## 元素与制作规则

竞速轨道 / 节奏箭头 / 纸牌列 / 玻璃控件 / 旋钮 / 编辑器 / 步进格子

- 用一连串真正发生状态变化的作品说明交互能力：游戏、控件、设计系统和音序器各演示一个清楚动作。
- 竞速轨道有前进速度，节奏游戏有击中反馈，纸牌有位置变化。每个作品独占一屏，不把所有案例缩成同时播放的小格。
- 作品之间可有不同配色和字体，但四周保留黑色边距。状态数字、选中颜色与动作结果足够亮；控件的暗色基底不应吞掉边缘。

## 内容替换

- 新主题可替换成不同应用，但每屏都要有输入、状态与反馈。多个作品可以共用外部框架，内部不必强行统一成同一风格。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Rive",
  "id": "V384",
  "palette": [
    "#070909",
    "#eaf1ee",
    "#55efba",
    "#d553a2",
    "#eac34f",
    "#8b68f5"
  ],
  "typography": "无衬线紧凑游戏标题与等宽状态数字；不同作品保留自身字体，外部舞台纯黑",
  "sample": "Interactive motion",
  "objects": [
    "竞速轨道",
    "节奏箭头",
    "纸牌列",
    "玻璃控件",
    "旋钮",
    "编辑器",
    "步进格子"
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
      "timeSeconds": 6.0,
      "frameId": "K0033",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/54a9f61627d6c2f659939a6c2341ab6f0f12aa8474dc6448b1e55c331fa3bf5e",
      "timeSeconds": 13.0,
      "frameId": "K0061",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 17.0,
      "frameId": "K0071",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 25.566666666666666,
      "frameId": "K0103",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 31.0,
      "frameId": "K0125",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "竞速菜单",
      "end": 2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2,
      "label": "轨道加速",
      "end": 6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6,
      "label": "节奏游戏",
      "end": 8.2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8.2,
      "label": "纸牌",
      "end": 13,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13,
      "label": "玻璃控件",
      "end": 15,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15,
      "label": "旋钮面板",
      "end": 17,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 17,
      "label": "设计系统",
      "end": 21,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 21,
      "label": "编辑器与旗帜",
      "end": 25.6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 25.6,
      "label": "步进音序器",
      "end": 29.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 29.5,
      "label": "卡牌游戏",
      "end": 31,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 31,
      "label": "黑场",
      "end": 31.266667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 31.266667,
  "fontFamily": "Arial, sans-serif"
}
```
