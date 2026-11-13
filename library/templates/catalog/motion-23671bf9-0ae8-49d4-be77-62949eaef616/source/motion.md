# SUNO 版本开关

V 在上，6 在下，橙色边缘与粉色内部形成多层光泽。中间品牌名保持小而稳定，版本字向上下离开后才露出控件。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 5.0,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 3.8,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "SUNO",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#ff5b14"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "SUNO",
        "accent": "#ff5b14"
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

## 先用大版本字占满视野

V 在上，6 在下，橙色边缘与粉色内部形成多层光泽。中间品牌名保持小而稳定，版本字向上下离开后才露出控件。

```motion-demo
{
  "id": "clip-1",
  "title": "先用大版本字占满视野",
  "src": "demos/clip-1.html",
  "duration": 2.3,
  "status": "authored",
  "description": "0–2.3 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 把发布口号收成实际选择

小胶囊先显示一个版本，再横向伸长露出第二个选项。浅色选中块留在左侧，背景从黑转为暗红，底部补一句两种模式说明。

## 配色与字形

暗红黑底，橙粉发光的巨大立体版本字，切换器很小。。

#160100 · #ffffff · #ff5b14 · #e8118e · #6d1613

## 元素与制作规则

巨大 V 与 6 / 中心品牌名 / 版本胶囊 / 双选项切换器

- V 在上，6 在下，橙色边缘与粉色内部形成多层光泽。中间品牌名保持小而稳定，版本字向上下离开后才露出控件。
- 小胶囊先显示一个版本，再横向伸长露出第二个选项。浅色选中块留在左侧，背景从黑转为暗红，底部补一句两种模式说明。

## 内容替换

- 替换版本和模式名，保留从巨大宣传字到小型真实控件的尺度反差。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Suno",
  "id": "V340",
  "palette": [
    "#160100",
    "#ffffff",
    "#ff5b14",
    "#e8118e",
    "#6d1613"
  ],
  "typography": "暗红黑底，橙粉发光的巨大立体版本字，切换器很小。",
  "sample": "SUNO",
  "objects": [
    "巨大 V 与 6",
    "中心品牌名",
    "版本胶囊",
    "双选项切换器"
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
      "timeSeconds": 1.2666666666666666,
      "frameId": "K0006",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 1.8,
      "frameId": "K0008",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 3.2666666666666666,
      "frameId": "K0014",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 4.0,
      "frameId": "K0019",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "巨型 V6",
      "end": 1.2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.2,
      "label": "上下退场",
      "end": 1.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.8,
      "label": "小型版本胶囊",
      "end": 3.3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.3,
      "label": "扩成双版本",
      "end": 4.2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.2,
      "label": "留读",
      "end": 5.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 5.0,
  "fontFamily": "Arial, sans-serif"
}
```
