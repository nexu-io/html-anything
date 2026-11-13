# 产品演变回顾

固定品牌名的位置，让图标、版本号和产品后缀接力变化，最后回归纯粹的主品牌。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 13.0,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 7,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Goodnotes",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#53bfd0"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Goodnotes",
        "accent": "#53bfd0"
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

## 变化集中在版本槽位

名称与图标按同一基线排列，版本数字连续替换，更新字标后再出现产品档位。每次长度变化以中心整体平衡，避免主名称左右跳动。

```motion-demo
{
  "id": "clip-1",
  "title": "变化集中在版本槽位",
  "src": "demos/clip-1.html",
  "duration": 8.7,
  "status": "authored",
  "description": "0–8.7 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 浅背景上保持字形连续

浅蓝微光衬托黑色圆润无衬线字，更新段可短暂使用青蓝渐层。图标尺寸统一，版本与后缀比主名称轻，最终品牌留足空白。

## 适合产品升级与系列回顾

替换历史版本、图标和档位名称，保持可辨的主名称。最后一版的停留长于早期快切，让演变有明确终点。

## 配色与字形

无衬线圆润字标；版本数字、版本后缀与主名称同基线。

#e5f3f5 · #080f12 · #53bfd0 · #1958a0 · #ffffff

## 元素与制作规则

应用图标 / 固定名称 / 版本数字 / 产品后缀 / 浅蓝光晕

- 固定品牌名的位置，让图标、版本号和产品后缀接力变化，最后回归纯粹的主品牌。
- 名称与图标按同一基线排列，版本数字连续替换，更新字标后再出现产品档位。每次长度变化以中心整体平衡，避免主名称左右跳动。
- 浅蓝微光衬托黑色圆润无衬线字，更新段可短暂使用青蓝渐层。图标尺寸统一，版本与后缀比主名称轻，最终品牌留足空白。

## 内容替换

- 替换历史版本、图标和档位名称，保持可辨的主名称。最后一版的停留长于早期快切，让演变有明确终点。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Goodnotes",
  "id": "V357",
  "palette": [
    "#e5f3f5",
    "#080f12",
    "#53bfd0",
    "#1958a0",
    "#ffffff"
  ],
  "typography": "无衬线圆润字标；版本数字、版本后缀与主名称同基线",
  "sample": "Goodnotes",
  "objects": [
    "应用图标",
    "固定名称",
    "版本数字",
    "产品后缀",
    "浅蓝光晕"
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
      "timeSeconds": 1.0,
      "frameId": "K0002",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 3.0,
      "frameId": "K0004",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 7.0,
      "frameId": "K0008",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 8.0,
      "frameId": "K0009",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 9.0,
      "frameId": "K0010",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "旧版本",
      "end": 1,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1,
      "label": "版本快切",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "版本六",
      "end": 5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5,
      "label": "新字标",
      "end": 7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7,
      "label": "Essential",
      "end": 8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8,
      "label": "Pro",
      "end": 9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9,
      "label": "主品牌定格",
      "end": 13.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 13.0,
  "fontFamily": "Arial, sans-serif"
}
```
