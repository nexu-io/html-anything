# Qwen3.8-Max：材质标志与模型公告

保持同一三瓣标志，先切换内部材质，再在蓝色背景上放大移位，把空间让给产品名称与参数。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 4.033333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 3.7,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Qwen3.8-Max",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#1a2eff"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Qwen3.8-Max",
        "accent": "#1a2eff"
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

## 材质变化不能破坏标志轮廓

三瓣围绕中心旋转，森林、水面与金属反光依次替换。中间留白与瓣间距离一致，让多种材质仍被读成同一标志。

```motion-demo
{
  "id": "clip-1",
  "title": "材质变化不能破坏标志轮廓",
  "src": "demos/clip-1.html",
  "duration": 2.8,
  "status": "authored",
  "description": "0–2.8 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 名称出现前让标志让位

末段把标志推向右下并放大，左上出现产品名，参数标签放在名称下方。深蓝背景、白色大字和少量银蓝高光形成最终公告。

## 更换产品时保留信息密度

一个产品名配两枚简短参数标签即可；新标志需能承受内部贴图和放大裁切。

## 配色与字形

白色无衬线粗标题；参数标签紧凑并列。

#02072c · #ffffff · #1a2eff · #80d9e4 · #c9e0ff

## 元素与制作规则

三瓣标志 / 自然纹理 / 金属边缘 / 蓝色光场 / 产品名 / 参数标签

- 三瓣围绕中心旋转，森林、水面与金属反光依次替换。中间留白与瓣间距离一致，让多种材质仍被读成同一标志。
- 末段把标志推向右下并放大，左上出现产品名，参数标签放在名称下方。深蓝背景、白色大字和少量银蓝高光形成最终公告。
- 一个产品名配两枚简短参数标签即可；新标志需能承受内部贴图和放大裁切。

## 内容替换

- 替换标志、产品名与两项参数，保留材质串联与末帧信息区。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Alibaba",
  "id": "V174",
  "palette": [
    "#02072c",
    "#ffffff",
    "#1a2eff",
    "#80d9e4",
    "#c9e0ff"
  ],
  "typography": "白色无衬线粗标题；参数标签紧凑并列",
  "sample": "Qwen3.8-Max",
  "objects": [
    "三瓣标志",
    "自然纹理",
    "金属边缘",
    "蓝色光场",
    "产品名",
    "参数标签"
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
      "timeSeconds": 1.6333333333333333,
      "frameId": "K0007",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 3.0,
      "frameId": "K0014",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 3.2666666666666666,
      "frameId": "K0015",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "素材填充标志",
      "end": 1.6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.6,
      "label": "金属材质",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "放大移位",
      "end": 3.25,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.25,
      "label": "名称与参数",
      "end": 4.033333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 4.033333,
  "fontFamily": "Arial, sans-serif"
}
```
