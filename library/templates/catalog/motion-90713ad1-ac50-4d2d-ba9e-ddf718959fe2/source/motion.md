# Higgsfield — Cursor for motion designers

把制作界面与正在变化的作品放在同一画面。上方合成展示果实从整体到剖面的变化，下方轨道和指令说明这些变化是可编辑的。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 20.1,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 3.02,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "INSIDE OUT",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#c1ff2c"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "INSIDE OUT",
        "accent": "#c1ff2c"
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

## 编辑器是持续存在的舞台

主画布占上方大部分区域，时间线与指令栏留在下方。播放时让画布变化，编辑器布局保持稳定；修改时把焦点短暂移到指令，再回到画布。

## 用整果、剖面和纹理建立连续性

先展示可辨认的果实主体，再展开不同生长或切开状态，最后推近纹理。每次变化留下相同颜色、形状或切面特征，观众才能把细节和整体连起来。

主体由小到大时，文字让出中心；主体变为纹理背景时，窄体大字重新进入。不要让字和果实在每一帧都抢占同一位置。

```motion-demo
{
  "id": "clip-2",
  "title": "用整果、剖面和纹理建立连续性",
  "src": "demos/clip-2.html",
  "duration": 7.2,
  "status": "authored",
  "description": "0.8–8 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 三种底色，统一一套字形

荧光绿、洋红、米白按段落切换；黑色窄体字作为固定视觉线索。字形使用较窄、较重的展示体，行数保持少，编辑器文字仍用常规界面字体。

时间轨道可沿用主画布的强调色，指令区维持深色底，让作品色彩和工具信息各有归属。

## 换成另一件可被解构的产品

准备整体、结构变化、剖面或局部材质，按整体到细节组织。替换文字与修改指令，使它们真的作用于新素材；保留画布与编辑过程并置的关系。

## 配色与字形

无衬线界面文字与清晰大小层级。

#eef0e3 · #08130c · #c1ff2c · #e90096 · #ffffff

## 元素与制作规则

上方画布 / 时间线 / 指令面板 / 果实主体 / 纹理切片 / 窄体文字

- 画布始终与下方时间线、指令区域同时可见，展示制作关系
- 果实从小主体展开为不同剖面，再变成细节纹理
- 荧光绿、洋红、米白按镜头切换，主体位置与字形保持高对比

## 内容替换

- 可换为产品解构动画，保留整体→剖面→材质的观察顺序
- 换素材要有可辨认的整体与细节对应

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Higgsfield",
  "id": "V052",
  "palette": [
    "#eef0e3",
    "#08130c",
    "#c1ff2c",
    "#e90096",
    "#ffffff"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "INSIDE OUT",
  "objects": [
    "上方画布",
    "时间线",
    "指令面板",
    "果实主体",
    "纹理切片",
    "窄体文字"
  ],
  "frames": [
    {
      "path": "https://r.open-design.ai/files/497d37a7c40ad3415ef3e479281d52a35fdaa92755aac1a8008e8be45185f425",
      "timeSeconds": 0.0,
      "frameId": "K0001",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/955504a123de8cb40977b8b941a6ff72781c4b549d36ef92fdb075f372acd83b",
      "timeSeconds": 2.8,
      "frameId": "K0016",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/df48a8cf2b683d2efddb133e7c7c106b15673f8becd00678c49aa5109d336d51",
      "timeSeconds": 3.533333333333333,
      "frameId": "K0021",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/d59c1ef69b0a760089f676f583041594db54bac5fffcb9ca44adf2f3eac61b1c",
      "timeSeconds": 6.0,
      "frameId": "K0036",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/db4838a77ef91e015fadffc235f7ddc053ae3d6ab188e30214bed5579ed8bdb0",
      "timeSeconds": 8.0,
      "frameId": "K0046",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/f439d8de60a84019882f07562a266105b7ff2ee4c61d893df982b4732093fd15",
      "timeSeconds": 17.0,
      "frameId": "K0101",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "编辑画布与轨道",
      "end": 0.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.8,
      "label": "果实展开队列",
      "end": 2.7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.7,
      "label": "窄体字",
      "end": 3.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.5,
      "label": "果实特写",
      "end": 4.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.5,
      "label": "纹理切片",
      "end": 6.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6.0,
      "label": "文字与果实",
      "end": 8.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8.0,
      "label": "修改后回放",
      "end": 13.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13.0,
      "label": "新一轮回放",
      "end": 17.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 17.0,
      "label": "纹理与像素化",
      "end": 20.1,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 20.1,
  "fontFamily": "Arial, sans-serif"
}
```
