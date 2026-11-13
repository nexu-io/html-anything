# AI Labs｜界面元素

通过多个能操作的界面说明自定义能力，每个例子用一次明确反馈收尾。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 46.933333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 26,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Custom interfaces",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#3e8bd7"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Custom interfaces",
        "accent": "#3e8bd7"
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

## 三维对象与批注保持关联

请求之后展示可旋转对象，批注点贴在对象的对应位置，侧栏列出相同编号或内容。旋转改变视角，批注归属不变。

```motion-demo
{
  "id": "clip-1",
  "title": "三维对象与批注保持关联",
  "src": "demos/clip-1.html",
  "duration": 4.800000000000001,
  "status": "authored",
  "description": "4–8.8 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 从流程图切到地图与预约

流程节点有连线，地图点位能展开信息，预约按钮进入确认弹窗再出现成功状态。每个案例只突出一种交互，让界面类型带来变化。

| 时间 | 段落 |
|---|---|
| 0.00–4.00s | 输入三维需求 |
| 4.00–9.00s | 椅子批注 |
| 9.00–19.00s | 流程图 |
| 19.00–24.00s | 地图选择 |
| 24.00–26.00s | 会议室列表 |
| 26.00–29.00s | 预约弹窗 |
| 29.00–31.00s | 成功提示 |
| 31.00–35.00s | 座位分配 |
| 35.00–40.00s | 功能设置 |
| 40.00–44.00s | 入口回顾 |
| 44.00–46.93s | 品牌 |

## 界面框架统一，功能布局各异

无衬线标签、清楚选中态与稳定工具栏贯穿所有案例。深底适合三维和流程，浅底适合地图和座位；蓝色标记选择，橙色强调预约操作。

## 更换素材时准备相应反馈

替换模型、地点、房间和人员必须同步更新批注、详情、确认和成功提示。三维模型可换，但不能用单张截图冒充可旋转对象。

## 配色与字形

无衬线小号界面字；深浅工作区随应用类型变化。

#1c2027 · #f4f6f7 · #3e8bd7 · #16a68b · #efa62a

## 元素与制作规则

请求框 / 三维对象与批注 / 流程节点 / 地图点位 / 预约弹窗 / 座位图

- 通过多个能操作的界面说明自定义能力，每个例子用一次明确反馈收尾。
- 请求之后展示可旋转对象，批注点贴在对象的对应位置，侧栏列出相同编号或内容。旋转改变视角，批注归属不变。
- 流程节点有连线，地图点位能展开信息，预约按钮进入确认弹窗再出现成功状态。每个案例只突出一种交互，让界面类型带来变化。

## 内容替换

- 替换模型、地点、房间和人员必须同步更新批注、详情、确认和成功提示。三维模型可换，但不能用单张截图冒充可旋转对象。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Airtable",
  "id": "V355",
  "palette": [
    "#1c2027",
    "#f4f6f7",
    "#3e8bd7",
    "#16a68b",
    "#efa62a"
  ],
  "typography": "无衬线小号界面字；深浅工作区随应用类型变化",
  "sample": "Custom interfaces",
  "objects": [
    "请求框",
    "三维对象与批注",
    "流程节点",
    "地图点位",
    "预约弹窗",
    "座位图"
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
      "path": "https://r.open-design.ai/files/e9ee44ba222cd33e235339e8af78a1121afc306686c2ef57fd6045813f10f62c",
      "timeSeconds": 9.0,
      "frameId": "K0030",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/d328edf6f035452f308ff9e8b3dcd6912a7ef11d3deaf178cef167fb8655e920",
      "timeSeconds": 24.0,
      "frameId": "K0076",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/c18b6f61ab1c8cdf38a1fecf047027c2a76e9b451287fdd14045bd5a6cdc1244",
      "timeSeconds": 29.0,
      "frameId": "K0096",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 35.0,
      "frameId": "K0116",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 44.0,
      "frameId": "K0134",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "输入三维需求",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "椅子批注",
      "end": 9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9,
      "label": "流程图",
      "end": 19,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 19,
      "label": "地图选择",
      "end": 24,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 24,
      "label": "会议室列表",
      "end": 26,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 26,
      "label": "预约弹窗",
      "end": 29,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 29,
      "label": "成功提示",
      "end": 31,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 31,
      "label": "座位分配",
      "end": 35,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 35,
      "label": "功能设置",
      "end": 40,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 40,
      "label": "入口回顾",
      "end": 44,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 44,
      "label": "品牌",
      "end": 46.933333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 46.933333,
  "fontFamily": "Arial, sans-serif"
}
```
