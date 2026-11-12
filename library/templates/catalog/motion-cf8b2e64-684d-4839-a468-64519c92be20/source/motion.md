# Slides 上线

输入主题后生成封面、内容与讲稿，缩略图栏始终在左。逐页切换显示配色、字体和插画语言如何延续。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 25.6,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 10.7,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Describe your deck",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#f07818"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Describe your deck",
        "accent": "#f07818"
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

## 让第一页和后续页属于同一套设计

输入主题后生成封面、内容与讲稿，缩略图栏始终在左。逐页切换显示配色、字体和插画语言如何延续。

| 时间 | 段落 |
|---|---|
| 0.00–4.80s | 输入 deck 请求 |
| 4.80–8.00s | 生成全套 |
| 8.00–14.50s | 逐页浏览 |
| 14.50–16.00s | 品牌系统 |
| 16.00–18.80s | 文字编辑 |
| 18.80–22.70s | 展示和导出 |
| 22.70–25.60s | 品牌收尾 |

## 品牌说明紧挨着可编辑结果

蓝色说明段把字体色板放在一侧、演示稿放另一侧，接着直接选中文字修改。使用同一套酸黄、青绿和深褐内容资产。

```motion-demo
{
  "id": "clip-2",
  "title": "品牌说明紧挨着可编辑结果",
  "src": "demos/clip-2.html",
  "duration": 3.799999999999999,
  "status": "authored",
  "description": "14.4–18.2 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 结尾展示真实交付出口

保留 Present 和 Export 的区别，导出菜单打开后给出文件反馈。替换主题时需要成套替换各页、讲稿和品牌系统。

## 配色与字形

浅灰点阵外框，黑色中等无衬线；品牌示例为青绿与酸黄，说明段用蓝底。。

#f5f4ef · #222222 · #f07818 · #4b4fe3 · #d4f55d · #b8e9d4

## 元素与制作规则

提示框 / 幻灯片编辑器 / 缩略图栏 / 讲稿区 / 品牌色板 / 导出菜单

- 输入主题后生成封面、内容与讲稿，缩略图栏始终在左。逐页切换显示配色、字体和插画语言如何延续。
- 蓝色说明段把字体色板放在一侧、演示稿放另一侧，接着直接选中文字修改。使用同一套酸黄、青绿和深褐内容资产。
- 保留 Present 和 Export 的区别，导出菜单打开后给出文件反馈。替换主题时需要成套替换各页、讲稿和品牌系统。

## 内容替换

- 替换演示主题及各页内容，保留生成、浏览、品牌编辑和导出链路。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Wix（Base44）",
  "id": "V147",
  "palette": [
    "#f5f4ef",
    "#222222",
    "#f07818",
    "#4b4fe3",
    "#d4f55d",
    "#b8e9d4"
  ],
  "typography": "浅灰点阵外框，黑色中等无衬线；品牌示例为青绿与酸黄，说明段用蓝底。",
  "sample": "Describe your deck",
  "objects": [
    "提示框",
    "幻灯片编辑器",
    "缩略图栏",
    "讲稿区",
    "品牌色板",
    "导出菜单"
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
      "timeSeconds": 4.766666666666667,
      "frameId": "K0009",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/9c79c2ea1230317ac591fa19a9163f6f8e7f0b34d2144527aeda43e6f0d3fd98",
      "timeSeconds": 8.0,
      "frameId": "K0021",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/64bd5b6785560d8848ea9d1dc3222e880afdba5792c4acbc385497ba0e2134e9",
      "timeSeconds": 16.0,
      "frameId": "K0058",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/2f15e738324083cca07de4076591ad7c80cf2a59e2a3aeda52cf9cce55562dee",
      "timeSeconds": 18.8,
      "frameId": "K0068",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 22.766666666666666,
      "frameId": "K0078",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "输入 deck 请求",
      "end": 4.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.8,
      "label": "生成全套",
      "end": 8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8,
      "label": "逐页浏览",
      "end": 14.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 14.5,
      "label": "品牌系统",
      "end": 16,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 16,
      "label": "文字编辑",
      "end": 18.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18.8,
      "label": "展示和导出",
      "end": 22.7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 22.7,
      "label": "品牌收尾",
      "end": 25.6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 25.6,
  "fontFamily": "Arial, sans-serif"
}
```
