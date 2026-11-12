# 同项目 5 秒短预览 · 5.0 秒

在很短的篇幅里，让一组点变成人物、地点和物品，直接表达搜索覆盖的范围。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 5.033333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 2.5,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Search On",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#4e8be3"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Search On",
        "accent": "#4e8be3"
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

## 从文字密度转到图形密度

浅底上先打出短标题，再复制成整齐阵列。标题用轻量无衬线，点群沿用蓝、红、绿等强调色，以留白保持轮廓清楚。

## 同一批点连续重构

人物、建筑和物品依次占据中心，每种形态完整后才转向下一类。保持点的大小和运动质感，靠目标轮廓变化表达分类。

## 重新定义三个类别

可换成工具、团队、项目等三类对象。每类选择一个外轮廓简单的代表形状，配一个短标签；保留快速成形和短暂停留。

## 配色与字形

浅底打字标题与彩色点云类别。

#f8faf9 · #416f9d · #4e8be3 · #df667d · #70bfa0

## 元素与制作规则

标题 / 点云 / 人物形状 / 城市形状 / 物体形状

- 点群按人物、地点、物品依次重构，颜色跟随类别。
- 短片集中展示分类覆盖，内容在人物、地点、物品三个类别间递进。

## 内容替换

- 可换成三类内容，保留点群同一材质和类别递进。
- 每类只给一个短标签。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Google",
  "id": "V020",
  "palette": [
    "#f8faf9",
    "#416f9d",
    "#4e8be3",
    "#df667d",
    "#70bfa0"
  ],
  "typography": "浅底打字标题与彩色点云类别",
  "sample": "Search On",
  "objects": [
    "标题",
    "点云",
    "人物形状",
    "城市形状",
    "物体形状"
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
      "timeSeconds": 1.3333333333333333,
      "frameId": "K0004",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 2.2333333333333334,
      "frameId": "K0007",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 3.0,
      "frameId": "K0010",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 3.966666666666667,
      "frameId": "K0014",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 4.5,
      "frameId": "K0018",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "打字标题",
      "end": 1.2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.2,
      "label": "标题阵列",
      "end": 2.2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.2,
      "label": "点云集结",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "人物轮廓",
      "end": 3.9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.9,
      "label": "建筑轮廓",
      "end": 4.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.5,
      "label": "物体轮廓",
      "end": 5.033333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 5.033333,
  "fontFamily": "Arial, sans-serif"
}
```
