# HyperOS 官网界面动效 1

从材质特写进入手机界面，再把相同圆角和透明层扩展到图标、小组件与多设备。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 47.2,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 30.5,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "HyperOS",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#4d9ee8"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "HyperOS",
        "accent": "#4d9ee8"
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

## 材质特写要回到可用控件

先展示玻璃边缘与曲面，再落到锁屏、音乐和控制中心。透明层保留边缘高光与背景色透出，正文比背景更清楚，不让折射干扰按钮含义。

## 控件属于设备，也能短暂离开屏幕

音乐卡和桌面小组件从手机中被放大展示，再回到完整界面。整体位置与内容一一对应，漂浮组件使用不同深度但同一光照方向。

```motion-demo
{
  "id": "clip-2",
  "title": "控件属于设备，也能短暂离开屏幕",
  "src": "demos/clip-2.html",
  "duration": 6.5,
  "status": "authored",
  "description": "28.5–35 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 多设备段用共同视觉规则收束

手机、平板和穿戴设备并置时保持共同圆角、图标与排版。先单屏看细节，最后看设备家族，不在一开始堆满产品。

| 时间 | 段落 |
|---|---|
| 0.00–4.00s | 玻璃近景 |
| 4.00–8.00s | 手机锁屏 |
| 8.00–10.00s | 多机组合 |
| 10.00–14.00s | 音乐控件 |
| 14.00–18.00s | 玻璃材质 |
| 18.00–20.00s | 控制中心 |
| 20.00–24.00s | 拨号界面 |
| 24.00–29.00s | 桌面图标 |
| 29.00–35.00s | 悬浮小组件 |
| 35.00–38.00s | 图标序列 |
| 38.00–41.00s | 平板文件 |
| 41.00–45.00s | 多屏展示 |
| 45.00–46.50s | 设备家族 |
| 46.50–47.20s | 品牌 |

## 换系统主题时替换整组组件

同时更新壁纸、时间、图标、音乐和日历数据，保留组件归属与多尺度展开。材质效果可以简化，但每个控件的边界与阅读层级要一致。

## 配色与字形

无衬线窄长时间数字；控件和图标圆角一致，透明层保持明亮。

#eef6fb · #11171f · #4d9ee8 · #e2a9b6 · #b4dacf

## 元素与制作规则

手机与平板 / 玻璃控件 / 大时间字 / 应用图标 / 桌面组件 / 设备矩阵

- 从材质特写进入手机界面，再把相同圆角和透明层扩展到图标、小组件与多设备。
- 先展示玻璃边缘与曲面，再落到锁屏、音乐和控制中心。透明层保留边缘高光与背景色透出，正文比背景更清楚，不让折射干扰按钮含义。
- 音乐卡和桌面小组件从手机中被放大展示，再回到完整界面。整体位置与内容一一对应，漂浮组件使用不同深度但同一光照方向。

## 内容替换

- 同时更新壁纸、时间、图标、音乐和日历数据，保留组件归属与多尺度展开。材质效果可以简化，但每个控件的边界与阅读层级要一致。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Xiaomi",
  "id": "V227",
  "palette": [
    "#eef6fb",
    "#11171f",
    "#4d9ee8",
    "#e2a9b6",
    "#b4dacf"
  ],
  "typography": "无衬线窄长时间数字；控件和图标圆角一致，透明层保持明亮",
  "sample": "HyperOS",
  "objects": [
    "手机与平板",
    "玻璃控件",
    "大时间字",
    "应用图标",
    "桌面组件",
    "设备矩阵"
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
      "path": "https://r.open-design.ai/files/342a4526187575935a4909d225311194d9fcd9b18985a47525457834c93f582b",
      "timeSeconds": 10.0,
      "frameId": "K0044",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 18.0,
      "frameId": "K0083",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/038f683a1cb98e49359cefa94fe1fd05a9bf6be44bfcb0a35792d8c6dcfe6a21",
      "timeSeconds": 29.0,
      "frameId": "K0130",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 38.0,
      "frameId": "K0172",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/8ee1877088df70954dd6309989446b8a2112379134a8e8f5bccd6b836732026e",
      "timeSeconds": 46.5,
      "frameId": "K0207",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "玻璃近景",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "手机锁屏",
      "end": 8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8,
      "label": "多机组合",
      "end": 10,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10,
      "label": "音乐控件",
      "end": 14,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 14,
      "label": "玻璃材质",
      "end": 18,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18,
      "label": "控制中心",
      "end": 20,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 20,
      "label": "拨号界面",
      "end": 24,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 24,
      "label": "桌面图标",
      "end": 29,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 29,
      "label": "悬浮小组件",
      "end": 35,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 35,
      "label": "图标序列",
      "end": 38,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 38,
      "label": "平板文件",
      "end": 41,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 41,
      "label": "多屏展示",
      "end": 45,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 45,
      "label": "设备家族",
      "end": 46.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 46.5,
      "label": "品牌",
      "end": 47.2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 47.2,
  "fontFamily": "Arial, sans-serif"
}
```
