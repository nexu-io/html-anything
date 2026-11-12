# A New Era of No-Code

以球体作为视觉向导，在分层网页、表单和流程空间中穿行。界面不只是截图，而是具有前后距离的可组合平面。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 103.533333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 35,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Webflow",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#473af4"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Webflow",
        "accent": "#473af4"
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

## 网页分层，球体穿过层间

将网页拆成底板、图片、标题与线框，沿深度方向留距离。小球沿共同透视方向穿行，近处平面移动更快，远处更慢。

```motion-demo
{
  "id": "clip-1",
  "title": "网页分层，球体穿过层间",
  "src": "demos/clip-1.html",
  "duration": 9,
  "status": "authored",
  "description": "4–13 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 从抽象空间落到具体界面

门户与透明立方体负责换空间，进入工作台后用输入栏、按钮和控件组建立功能感。蓝紫为主，粉、青、黄只分配给局部内容。

## 用连线解释界面之间的关系

后段让数据轨迹在窗口、表单与用户节点之间流动。路径要有明确起点和终点，球体抵达后才触发下一个窗口的状态。

| 时间 | 段落 |
|---|---|
| 0.00–4.00s | 球体引路 |
| 4.00–13.00s | 层叠网页 |
| 13.00–22.00s | 尺度深度 |
| 22.00–31.00s | 穿越门户 |
| 31.00–48.00s | 界面构建 |
| 48.00–59.00s | 输入与内容 |
| 59.00–70.00s | 界面层级 |
| 70.00–83.00s | 数据流 |
| 83.00–98.00s | 跨屏连接 |
| 98.00–103.53s | 品牌收束 |

## 新题材也需要空间中的向导

可换为产品模块或业务卡，但保留一个持续出现的球体或小物件。准备可分层的界面元素，不将整屏图片当成所有空间层。

## 配色与字形

少量品牌字标；主体是窗口线框、控件与空间几何。

#100851 · #f4f0f6 · #473af4 · #ad78e7 · #75def1 · #ed9ccf

## 元素与制作规则

球体 / 网页平面 / 线框 / 门户 / 表单 / 连接轨迹 / 窗口群

- 将网页拆成底板、图片、标题与线框，沿深度方向留距离。小球沿共同透视方向穿行，近处平面移动更快，远处更慢。
- 门户与透明立方体负责换空间，进入工作台后用输入栏、按钮和控件组建立功能感。蓝紫为主，粉、青、黄只分配给局部内容。
- 后段让数据轨迹在窗口、表单与用户节点之间流动。路径要有明确起点和终点，球体抵达后才触发下一个窗口的状态。
- 可换为产品模块或业务卡，但保留一个持续出现的球体或小物件。准备可分层的界面元素，不将整屏图片当成所有空间层。

## 内容替换

- 替换网页内容与业务流程；保留球体引导、深度分层与连接。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Webflow",
  "id": "V352",
  "palette": [
    "#100851",
    "#f4f0f6",
    "#473af4",
    "#ad78e7",
    "#75def1",
    "#ed9ccf"
  ],
  "typography": "少量品牌字标；主体是窗口线框、控件与空间几何",
  "sample": "Webflow",
  "objects": [
    "球体",
    "网页平面",
    "线框",
    "门户",
    "表单",
    "连接轨迹",
    "窗口群"
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
      "timeSeconds": 13.0,
      "frameId": "K0056",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 31.0,
      "frameId": "K0126",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 48.0,
      "frameId": "K0191",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 70.0,
      "frameId": "K0288",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 98.0,
      "frameId": "K0401",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "球体引路",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "层叠网页",
      "end": 13,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13,
      "label": "尺度深度",
      "end": 22,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 22,
      "label": "穿越门户",
      "end": 31,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 31,
      "label": "界面构建",
      "end": 48,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 48,
      "label": "输入与内容",
      "end": 59,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 59,
      "label": "界面层级",
      "end": 70,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 70,
      "label": "数据流",
      "end": 83,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 83,
      "label": "跨屏连接",
      "end": 98,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 98,
      "label": "品牌收束",
      "end": 103.533333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 103.533333,
  "fontFamily": "Arial, sans-serif"
}
```
