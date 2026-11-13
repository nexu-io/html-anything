# GLM-5V-Turbo — vision coding model

保持输入材料和生成结果同时可见，让草图、图片和录屏分别证明不同的视觉输入能力。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 77.52,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 40,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Sketch = Code",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#7b64c2"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Sketch = Code",
        "accent": "#7b64c2"
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

## 左侧输入，右侧代码与结果接力

草图或参考图留在左侧，执行时右侧先出现代码，再切成运行结果。结果的关键布局应能对应输入，不能只留下漂亮的独立成品。

```motion-demo
{
  "id": "clip-1",
  "title": "左侧输入，右侧代码与结果接力",
  "src": "demos/clip-1.html",
  "duration": 7,
  "status": "authored",
  "description": "9–16 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 每种输入用一句短主张分段

Sketch、Reference、动态网页与图像音乐各有独立段落。黑底细网格、等宽状态信息与紫色操作按钮贯穿，主张大字短促出现后退出。

## 动态对照保持同步与相同观看尺度

网页录屏与生成页面左右放置，保留同一构图比例。三维物体或音乐代码属于各自案例，切换时明确更换输入，避免同一草图解释全部结果。

| 时间 | 段落 |
|---|---|
| 0.00–4.00s | 模型标题 |
| 4.00–9.00s | 草图主张 |
| 9.00–14.00s | 草图输入 |
| 14.00–21.00s | 音乐应用 |
| 21.00–25.00s | 参考图主张 |
| 25.00–31.00s | 图片与请求 |
| 31.00–35.00s | 生成图形 |
| 35.00–40.00s | 风格引用 |
| 40.00–45.00s | 新界面 |
| 45.00–50.00s | 产品图参考 |
| 50.00–55.00s | 产品画面 |
| 55.00–62.00s | 动态网页对照 |
| 62.00–72.00s | 图像转音乐 |
| 72.00–76.00s | 代码结果 |
| 76.00–77.52s | 品牌 |

## 迁移为另一套视觉创作能力

替换源草图、参考图、请求、代码和输出，保持材料到结果的对应。选择少量差异清楚的案例，输出展示时留出读懂变化的时间。

## 配色与字形

等宽状态标签与代码，主张使用斜体无衬线；黑底细网格。

#0d1115 · #f4f4ee · #7b64c2 · #ce5d22 · #437692

## 元素与制作规则

草图画布 / 参考图片 / 输入面板 / 代码区 / 运行预览 / 对照视图

- 保持输入材料和生成结果同时可见，让草图、图片和录屏分别证明不同的视觉输入能力。
- 草图或参考图留在左侧，执行时右侧先出现代码，再切成运行结果。结果的关键布局应能对应输入，不能只留下漂亮的独立成品。
- Sketch、Reference、动态网页与图像音乐各有独立段落。黑底细网格、等宽状态信息与紫色操作按钮贯穿，主张大字短促出现后退出。

## 内容替换

- 替换源草图、参考图、请求、代码和输出，保持材料到结果的对应。选择少量差异清楚的案例，输出展示时留出读懂变化的时间。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Z.ai",
  "id": "V228",
  "palette": [
    "#0d1115",
    "#f4f4ee",
    "#7b64c2",
    "#ce5d22",
    "#437692"
  ],
  "typography": "等宽状态标签与代码，主张使用斜体无衬线；黑底细网格",
  "sample": "Sketch = Code",
  "objects": [
    "草图画布",
    "参考图片",
    "输入面板",
    "代码区",
    "运行预览",
    "对照视图"
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
      "timeSeconds": 14.0,
      "frameId": "K0025",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/b3cf10ceff4fa10f345524b9e33600c49454e6175822cc97202b7e40cdfd20be",
      "timeSeconds": 31.0,
      "frameId": "K0060",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/aa50129c897d8d3a73f28c5444385bbec8ab6004185d0464b878e71dcf1bcca4",
      "timeSeconds": 40.0,
      "frameId": "K0094",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/484c4b345f44017df6efab096575783dd68866597551582b3ede10c113aaf3c9",
      "timeSeconds": 55.0,
      "frameId": "K0137",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 76.0,
      "frameId": "K0191",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "模型标题",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "草图主张",
      "end": 9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9,
      "label": "草图输入",
      "end": 14,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 14,
      "label": "音乐应用",
      "end": 21,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 21,
      "label": "参考图主张",
      "end": 25,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 25,
      "label": "图片与请求",
      "end": 31,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 31,
      "label": "生成图形",
      "end": 35,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 35,
      "label": "风格引用",
      "end": 40,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 40,
      "label": "新界面",
      "end": 45,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 45,
      "label": "产品图参考",
      "end": 50,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 50,
      "label": "产品画面",
      "end": 55,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 55,
      "label": "动态网页对照",
      "end": 62,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 62,
      "label": "图像转音乐",
      "end": 72,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 72,
      "label": "代码结果",
      "end": 76,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 76,
      "label": "品牌",
      "end": 77.52,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 77.52,
  "fontFamily": "ui-monospace, monospace"
}
```
