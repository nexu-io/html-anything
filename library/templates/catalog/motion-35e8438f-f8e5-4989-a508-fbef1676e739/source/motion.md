# Suki｜线条与文字品牌短片

把临床人员与工具的协作用两组细线表达，线束交汇后变成贯穿真实照护场景的视觉线索。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 23.083333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 8.7,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Presence is powerful",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#e9e65e"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Presence is powerful",
        "accent": "#e9e65e"
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

## 每句文字从同一根竖线开始

一根细竖线靠近左侧，短粗段标出正文起点。文本左对齐，最多三四行；浅米底深字与深底浅字切换时保持起始轴不变。

## 两种线束先分开，再交织

浅蓝代表 Clinicians，黄色代表 Suki。细竖条沿曲线路径排列，先上下分离，再交错重叠并横向展开；标签在关系建立后退出，让线本身接管运动。

```motion-demo
{
  "id": "clip-2",
  "title": "两种线束先分开，再交织",
  "src": "demos/clip-2.html",
  "duration": 4.7,
  "status": "authored",
  "description": "5.8–10.5 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 图形过渡到人物时减弱存在感

线束收成少量竖线，叠到照护画面上后逐根淡出。文案沿相同竖轴出现，最后回到浅底品牌字标；实拍留给人与人的互动，不再叠大面积图形。

## 替换角色与场景，保留互补关系

可迁移到其他人与工具的协作，但两种颜色要始终对应同一角色。选择真实工作关系的画面，文字强调具体价值，收尾保持安静。

## 配色与字形

无衬线短句左对齐；细竖线像正文起笔，品牌字标粗而紧凑。

#ffffe1 · #1b1b1b · #e9e65e · #b9dae5 · #d9d7bc

## 元素与制作规则

竖向基线 / 左对齐主张 / 黄蓝线束 / 人物画面 / 品牌字标

- 把临床人员与工具的协作用两组细线表达，线束交汇后变成贯穿真实照护场景的视觉线索。
- 一根细竖线靠近左侧，短粗段标出正文起点。文本左对齐，最多三四行；浅米底深字与深底浅字切换时保持起始轴不变。
- 浅蓝代表 Clinicians，黄色代表 Suki。细竖条沿曲线路径排列，先上下分离，再交错重叠并横向展开；标签在关系建立后退出，让线本身接管运动。

## 内容替换

- 可迁移到其他人与工具的协作，但两种颜色要始终对应同一角色。选择真实工作关系的画面，文字强调具体价值，收尾保持安静。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Suki",
  "id": "V385",
  "palette": [
    "#ffffe1",
    "#1b1b1b",
    "#e9e65e",
    "#b9dae5",
    "#d9d7bc"
  ],
  "typography": "无衬线短句左对齐；细竖线像正文起笔，品牌字标粗而紧凑",
  "sample": "Presence is powerful",
  "objects": [
    "竖向基线",
    "左对齐主张",
    "黄蓝线束",
    "人物画面",
    "品牌字标"
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
      "timeSeconds": 2.906175059952038,
      "frameId": "K0009",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 6.974820143884892,
      "frameId": "K0020",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 10.545263788968825,
      "frameId": "K0034",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/cb50105ab3df3ca378c6908089332e2a83192504d17c61de3da9863bd804e058",
      "timeSeconds": 14.946043165467625,
      "frameId": "K0044",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 20.924460431654676,
      "frameId": "K0056",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "浅底",
      "end": 1,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1,
      "label": "主张与竖线",
      "end": 2.9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.9,
      "label": "切深底",
      "end": 3.3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.3,
      "label": "产品说明",
      "end": 5.9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5.9,
      "label": "两组线束",
      "end": 7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7,
      "label": "线束相遇",
      "end": 8.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8.5,
      "label": "展开流动",
      "end": 10.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10.5,
      "label": "退到边缘",
      "end": 11.2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11.2,
      "label": "愿景短句",
      "end": 14,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 14,
      "label": "线条过渡",
      "end": 15,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15,
      "label": "人物画面",
      "end": 19.9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 19.9,
      "label": "浅底回场",
      "end": 21,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 21,
      "label": "品牌",
      "end": 23.083333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 23.083333,
  "fontFamily": "Arial, sans-serif"
}
```
