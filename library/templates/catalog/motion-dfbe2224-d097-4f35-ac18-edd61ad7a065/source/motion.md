# Grok Bot｜角色叠放

让角色逐个落到同一堆叠上。数量增加时，镜头主动拉远，为完整队伍让出空间。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 12.433333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 3.3,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Grok Bot",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#ee9856"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Grok Bot",
        "accent": "#ee9856"
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

## 每个角色都有独立轮廓

纯白底上用黑、橙、绿、红等实色区分角色，五官简单统一。底部角色较稳，上方角色可以更轻巧；说明文字采用黑色无衬线。

## 接触之后，整叠一起回应

新角色落到顶部后先轻压、回弹，再带动整叠小幅摆动。已有角色保持接触，堆叠重心沿同一轴变化。

角色变多时缩小整体，保持顶端和底部都在画面内。

## 用一句话解释队伍扩大

堆叠完成后出现适用范围或新计划说明，再收束品牌。可换角色、数量与声明，保留增加、接触、拉远和稳定四种动作。

## 配色与字形

纯白底彩色卡通脸、层叠平衡与整体缩放。

#ffffff · #161616 · #ee9856 · #7fbe6b · #e75d5d

## 元素与制作规则

底部黑角色 / 彩色角色组 / 堆叠轴 / 发布说明

- 角色逐个落在上一角色上，接触后整体轻微摆动。
- 数量增加时镜头拉远保持全体可见，而非裁掉上端。
- 堆叠完成后撤去角色，只保留适用范围说明。

## 内容替换

- 适用于新增角色或更多方案；颜色、轮廓和顺序可替换。
- 保留落点、接触和重心连续性。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "xAI / Grok",
  "id": "V309",
  "palette": [
    "#ffffff",
    "#161616",
    "#ee9856",
    "#7fbe6b",
    "#e75d5d"
  ],
  "typography": "纯白底彩色卡通脸、层叠平衡与整体缩放",
  "sample": "Grok Bot",
  "objects": [
    "底部黑角色",
    "彩色角色组",
    "堆叠轴",
    "发布说明"
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
      "timeSeconds": 2.0,
      "frameId": "K0006",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 3.0,
      "frameId": "K0010",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 6.0,
      "frameId": "K0021",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 8.0,
      "frameId": "K0028",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 10.0,
      "frameId": "K0031",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "单个角色",
      "end": 2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2,
      "label": "第二角色落下",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "更多角色叠放",
      "end": 4.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.5,
      "label": "拉远看堆叠",
      "end": 6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6,
      "label": "整体轻摆",
      "end": 8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8,
      "label": "覆盖计划说明",
      "end": 10,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10,
      "label": "品牌",
      "end": 12.433333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 12.433333,
  "fontFamily": "Arial, sans-serif"
}
```
