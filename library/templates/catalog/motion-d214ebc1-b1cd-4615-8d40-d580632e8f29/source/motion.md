# Figma AI Image Editing

用三个短例子区分主体调整、删除物体和移除背景。每个例子都完整展示选区、操作和最终结果。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 24.333333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 6,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Image editing",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#36b3ce"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Image editing",
        "accent": "#36b3ce"
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

## 主体高亮只是中间一步

第一张图先选择主体，再显示高亮，操作之后必须回到正常画面展示变化。高亮覆盖在对象上方，外部背景保持稳定，让选区范围一眼可见。

```motion-demo
{
  "id": "clip-1",
  "title": "主体高亮只是中间一步",
  "src": "demos/clip-1.html",
  "duration": 9,
  "status": "authored",
  "description": "0–9 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 删除物体与去背景分开演示

第二个例子让待删物体消失并显示填补区域；第三个例子保留主体、移除背景并露出透明底。切换例子时重置选择状态，不把同一遮罩一直留到结尾。

| 操作 | 最终画面应说明 |
| --- | --- |
| 调整主体 | 同一主体发生具体改变 |
| 删除对象 | 目标消失，周围背景连续 |
| 移除背景 | 主体保留，背景成为透明区域 |

## 蓝色工具环境，让照片当主角

浅蓝和青色用于界面与选择提示，深色无衬线文字保持清楚。照片占画面主体，工具栏只放必要操作；对比前后时保持照片尺度和位置，避免取景变化掩盖编辑效果。

## 用适合编辑的照片替换

挑选主体与背景关系清楚的照片，分别准备调整、删物和抠图结果。三种操作的名称、选区和结果要匹配，透明结果可以用棋盘底帮助阅读。

## 配色与字形

无衬线中粗主标题；细边框界面与小号功能文字。

#afd0dd · #253544 · #36b3ce · #90b8c5 · #ffffff

## 元素与制作规则

原图 / 主体遮罩 / 工具栏 / 待删对象 / 补全背景 / 透明抠图

- 每个例子都按选区→操作→结果展示；主体高亮仅是中间状态。
- 删物与去背景是不同操作，不能把一个遮罩当全流程。

## 内容替换

- 可替换照片，但必须有适合分离的主体及清楚的结果对照。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Figma",
  "id": "V285",
  "palette": [
    "#afd0dd",
    "#253544",
    "#36b3ce",
    "#90b8c5",
    "#ffffff"
  ],
  "typography": "无衬线中粗主标题；细边框界面与小号功能文字",
  "sample": "Image editing",
  "objects": [
    "原图",
    "主体遮罩",
    "工具栏",
    "待删对象",
    "补全背景",
    "透明抠图"
  ],
  "frames": [
    {
      "path": "https://r.open-design.ai/files/99e399c92941a7baa4553fd1329c90a33d839d7f3d08839d450147d0d6a9a77c",
      "timeSeconds": 0.0,
      "frameId": "K0001",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/cff69452b9804697777c94fab343cf717aacad20d9ae00c49f82e56a0e4395a2",
      "timeSeconds": 6.0,
      "frameId": "K0019",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/ba56f64bbece492abf3e09565ad2ca2659fbeaa0ed11e9eccae44be4b98f1c2f",
      "timeSeconds": 9.0,
      "frameId": "K0028",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/ab33e04ffee763772d3de6aad3ee6485eb1b4914c557476d2d2428ad752eed01",
      "timeSeconds": 15.0,
      "frameId": "K0041",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/83dc27e266a18d0355541a9a391e5170a8659b2be1abf39134d77c93fe9b4ece",
      "timeSeconds": 18.0,
      "frameId": "K0050",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/60e10910a53f371d49d07cca398b09b0117aba071be726dc538950b15725c301",
      "timeSeconds": 23.0,
      "frameId": "K0065",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "选择主体",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "主体高亮",
      "end": 6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6,
      "label": "主体调整",
      "end": 9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9,
      "label": "第二张图",
      "end": 12,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12,
      "label": "删除对象",
      "end": 15,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15,
      "label": "填补结果",
      "end": 18,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18,
      "label": "第三张图",
      "end": 21,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 21,
      "label": "移除背景",
      "end": 23,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 23,
      "label": "透明对象",
      "end": 24.333333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 24.333333,
  "fontFamily": "Arial, sans-serif"
}
```
