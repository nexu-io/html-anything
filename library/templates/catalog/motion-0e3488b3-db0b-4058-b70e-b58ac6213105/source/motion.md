# Fable 5｜像素角色回归

让一个像素角色完成产品名的安装。角色的行动决定字母何时出现，灯牌点亮后再退出。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 13.166667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 8.6,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "FABLE 5",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#c8775c"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "FABLE 5",
        "accent": "#c8775c"
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

## 固定招牌，把运动留给角色

黑底上只放梯子和横向灯牌。标题采用粗点阵字，暖白灯面与珊瑚角色区分；招牌宽度预留完整产品名。

角色从左进入，沿梯子到达文字区。梯子和牌面保持不动，帮助判断角色的位置。

## 装完最后一个字，再开灯

每次安装后增加一个字母。标题完整后短暂停留，灯面整体点亮，角色再沿原路径下降并向右离场。

角色退场后留一段完整灯牌，让名字成为最后的阅读对象。

## 文字长度会改变动作时长

适合单行短名。替换名字时按字数重新分配安装动作；长名称可以缩短角色每次停顿，仍要保留完整亮牌的停留。

## 配色与字形

黑底点阵、像素角色、影院灯牌。

#101010 · #e8e2bf · #c8775c · #bf4d61 · #4a4942

## 元素与制作规则

像素角色 / 梯子 / 灯牌 / 逐字标题

- 角色到达灯牌后才逐字出现产品名，动作与字母有因果。
- 点亮发生在标题完整后；随后角色从画面右侧退出。
- 梯子与招牌固定，角色运动承担叙事。

## 内容替换

- 替换短产品名与像素角色；保留登高安装→点亮→离场。
- 标题建议单行 4–10 字符。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Anthropic",
  "id": "V253",
  "palette": [
    "#101010",
    "#e8e2bf",
    "#c8775c",
    "#bf4d61",
    "#4a4942"
  ],
  "typography": "黑底点阵、像素角色、影院灯牌",
  "sample": "FABLE 5",
  "objects": [
    "像素角色",
    "梯子",
    "灯牌",
    "逐字标题"
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
      "timeSeconds": 1.25,
      "frameId": "K0006",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/589ed1060f1a3cb1dc7f1ed079841972d80e849322e3d696ec4fc27de540f6e4",
      "timeSeconds": 3.0,
      "frameId": "K0010",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/39f60f7d087bfdc5e713ec20c8ba4a29726debff20ffef246950206f436b5dff",
      "timeSeconds": 8.0,
      "frameId": "K0017",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/6c4d23f667b4ce6e4d14649bddd39f5f9b3f2a735e5050ae51edf6a68211ac18",
      "timeSeconds": 9.5,
      "frameId": "K0020",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/6fd740c5f645c5a437f72edd3597d88b70376b9c0c4d6995d9b29286b01b7751",
      "timeSeconds": 12.5,
      "frameId": "K0029",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "角色从左进入",
      "end": 1.2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.2,
      "label": "爬梯",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "逐字装上标题",
      "end": 8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8,
      "label": "标题完成",
      "end": 9.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9.5,
      "label": "灯牌点亮与角色退场",
      "end": 12.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12.5,
      "label": "留牌淡出",
      "end": 13.166667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 13.166667,
  "fontFamily": "Arial, sans-serif"
}
```
