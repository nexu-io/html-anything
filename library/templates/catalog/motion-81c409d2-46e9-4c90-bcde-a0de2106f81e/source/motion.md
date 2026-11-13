# Linear — custom environments in coding sessions

用一组倾斜环境卡展示不同运行配置。焦点在卡片间交接，最后退去卡片，只留下能力主张。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 17.166667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 8,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Custom environments",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#6970c6"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Custom environments",
        "accent": "#6970c6"
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

## 一张卡读完，再交给下一张

Web、Go 和数据服务配置依次成为前景。名称、运行时和变量保持在同一张卡内，前景卡更亮、更清楚，后景卡降低对比；透视方向一致，不能每切一张就翻转空间。

## 暗色卡组靠层次而非装饰分开

接近黑色的背景与深灰卡片之间留出明度差，冷紫用于选中与细节。主标题采用中粗无衬线，运行时与变量可用等宽字；卡片的倾斜程度以仍能阅读字段为限。

## 为每个环境准备完整的三层内容

替换技术栈时同时更新环境名、运行时和配置值，保持相同的字段位置。最后一张卡退出后再给总结句，结束页只保留品牌或能力主张。

## 配色与字形

无衬线中粗主标题；细边框界面与小号功能文字。

#090a0c · #e9e9e8 · #6970c6 · #30333c · #ffffff

## 元素与制作规则

环境卡组 / 代理标签 / 运行时 / 环境变量 / 景深

- 暗色卡片以倾斜近景逐张展示，卡片内各环境字段保持关联。
- 前后卡片明暗区分焦点，最后卡片退去只留主张。

## 内容替换

- 可换技术环境；每张卡保留名称、运行时、配置三个层级。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Linear",
  "id": "V112",
  "palette": [
    "#090a0c",
    "#e9e9e8",
    "#6970c6",
    "#30333c",
    "#ffffff"
  ],
  "typography": "无衬线中粗主标题；细边框界面与小号功能文字",
  "sample": "Custom environments",
  "objects": [
    "环境卡组",
    "代理标签",
    "运行时",
    "环境变量",
    "景深"
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
      "timeSeconds": 4.0,
      "frameId": "K0017",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 8.0,
      "frameId": "K0033",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 12.0,
      "frameId": "K0049",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 16.0,
      "frameId": "K0060",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "Web 配置卡",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "Go 配置卡",
      "end": 8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8,
      "label": "数据服务卡",
      "end": 12,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12,
      "label": "能力主张",
      "end": 16,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 16,
      "label": "品牌",
      "end": 17.166667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 17.166667,
  "fontFamily": "Arial, sans-serif"
}
```
