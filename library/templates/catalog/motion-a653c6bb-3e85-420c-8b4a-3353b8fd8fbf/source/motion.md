# Pond｜系统发布

用花园与蜂群比喻计算系统：大字给主张，彩色微型进程块在周围持续活动。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 19.0,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 7.2,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Pond",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#d3fc55"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Pond",
        "accent": "#d3fc55"
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

## 大字是句子，碎块是后台活动

garden、blossoms、bees 分别占据主画面，周围短标签组成任务、模型和进程关系。主词用大号衬线斜体，微型文字用等宽，二者字号差距要足够明显。

## 纸色、深棕与酸性色块交替

大部分画面用浅纸底，关键转折整屏切深棕或亮黄。荧光绿、紫、粉与薄荷色以硬边矩形进入，不做柔和玻璃卡；植物线描降低对比度，作为纹理而非正文。

## 系统词与字母收束比喻

后段从蜂群切到 Linux 标识与 Operating System，Pond 四字母分散再聚拢成二乘二。周围任务块缩小，主名称获得留白。

```motion-demo
{
  "id": "clip-3",
  "title": "系统词与字母收束比喻",
  "src": "demos/clip-3.html",
  "duration": 5.199999999999999,
  "status": "authored",
  "description": "13.3–18.5 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 用新的生态比喻组织内容

可以替换为另一种协作网络，但需要一组互相对应的自然对象、系统角色与短词。保留大词逐屏推进和后台微标签持续变化，勿把所有小标签放大到正文层级。

## 配色与字形

衬线斜体主词搭配等宽微型系统标签；矩形色块不使用圆角。

#f6fff0 · #32170d · #d3fc55 · #bf9cf0 · #f48aaa · #9de1d2

## 元素与制作规则

衬线主词 / 彩色进程块 / 植物线描 / 蝴蝶与蜜蜂 / 角落控制 / Pond 四字母

- 用花园与蜂群比喻计算系统：大字给主张，彩色微型进程块在周围持续活动。
- garden、blossoms、bees 分别占据主画面，周围短标签组成任务、模型和进程关系。主词用大号衬线斜体，微型文字用等宽，二者字号差距要足够明显。
- 大部分画面用浅纸底，关键转折整屏切深棕或亮黄。荧光绿、紫、粉与薄荷色以硬边矩形进入，不做柔和玻璃卡；植物线描降低对比度，作为纹理而非正文。

## 内容替换

- 可以替换为另一种协作网络，但需要一组互相对应的自然对象、系统角色与短词。保留大词逐屏推进和后台微标签持续变化，勿把所有小标签放大到正文层级。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Butterfly",
  "id": "V375",
  "palette": [
    "#f6fff0",
    "#32170d",
    "#d3fc55",
    "#bf9cf0",
    "#f48aaa",
    "#9de1d2"
  ],
  "typography": "衬线斜体主词搭配等宽微型系统标签；矩形色块不使用圆角",
  "sample": "Pond",
  "objects": [
    "衬线主词",
    "彩色进程块",
    "植物线描",
    "蝴蝶与蜜蜂",
    "角落控制",
    "Pond 四字母"
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
      "timeSeconds": 2.25,
      "frameId": "K0012",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 5.0,
      "frameId": "K0022",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 10.5,
      "frameId": "K0045",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 14.0,
      "frameId": "K0060",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 17.0,
      "frameId": "K0075",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "微型控制块",
      "end": 1,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1,
      "label": "色块闪现",
      "end": 2.2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.2,
      "label": "进程与蝴蝶",
      "end": 3.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.8,
      "label": "a",
      "end": 5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5,
      "label": "garden",
      "end": 7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7,
      "label": "blossoms",
      "end": 9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9,
      "label": "bees",
      "end": 10.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10.5,
      "label": "模型标签",
      "end": 13.3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13.3,
      "label": "Linux",
      "end": 14,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 14,
      "label": "Operating System",
      "end": 15.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15.5,
      "label": "Pond 字母",
      "end": 17,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 17,
      "label": "系统锁定",
      "end": 19.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 19.0,
  "fontFamily": "Georgia, serif"
}
```
