# Databricks — GLM 5.3 Flash on the Lakehouse

让新模型从现有列表中被选中，并把同一名称同步到品牌公告位置。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 5.0,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 3.2,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "GLM 5.3 Flash",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#ff5c42"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "GLM 5.3 Flash",
        "accent": "#ff5c42"
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

## 列表选择驱动公告

右侧白色列表从画外上移，光标经过其他项目后停在目标行。选中条突出并带浅红阴影，左侧名称随后出现。

```motion-demo
{
  "id": "clip-1",
  "title": "列表选择驱动公告",
  "src": "demos/clip-1.html",
  "duration": 2.8,
  "status": "authored",
  "description": "0.5–3.3 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 深红背景让白色列表清楚

左侧品牌区域保持留白，红色倾斜大块裁出画幅。用灰字弱化未选项，选中行与公告名称共用强调色。换模型时只替换列表与公告对应的同一个词。

## 配色与字形

中等字重无衬线；列表正文与公告名称保持字号差。

#540c04 · #ffffff · #ff5c42 · #e6edec

## 元素与制作规则

品牌字标 / 倾斜红块 / 模型列表 / 游标 / 选中条

- 右侧白色列表从画外上移，光标经过其他项目后停在目标行。选中条突出并带浅红阴影，左侧名称随后出现。
- 左侧品牌区域保持留白，红色倾斜大块裁出画幅。用灰字弱化未选项，选中行与公告名称共用强调色。换模型时只替换列表与公告对应的同一个词。

## 内容替换

- 适合服务上新、菜单新增和插件接入公告。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Databricks",
  "id": "V172",
  "palette": [
    "#540c04",
    "#ffffff",
    "#ff5c42",
    "#e6edec"
  ],
  "typography": "中等字重无衬线；列表正文与公告名称保持字号差",
  "sample": "GLM 5.3 Flash",
  "objects": [
    "品牌字标",
    "倾斜红块",
    "模型列表",
    "游标",
    "选中条"
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
      "timeSeconds": 0.5333333333333333,
      "frameId": "K0003",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 1.0,
      "frameId": "K0005",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 2.2666666666666666,
      "frameId": "K0007",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 2.8,
      "frameId": "K0009",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "品牌与红色几何",
      "end": 0.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.5,
      "label": "模型列表入场",
      "end": 1.4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.4,
      "label": "游标移动",
      "end": 2.4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.4,
      "label": "选中目标",
      "end": 2.9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.9,
      "label": "名称同步公告",
      "end": 5.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 5.0,
  "fontFamily": "Arial, sans-serif"
}
```
