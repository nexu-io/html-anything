# Exa — Give Codex and ChatGPT access to 100B+ websites

先提出一个需要外部资料的具体问题，再展示搜索调用和结构化回答；结尾才概括集成能力。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 23.0,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 13,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Exa in Codex",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#245be8"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Exa in Codex",
        "accent": "#245be8"
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

## 让问题有明确的输出目标

开场文字将工具名与宿主名分色，进入白色输入窗后完整输入研究问题。工具标签留在输入栏附近，避免被误解为普通聊天。

```motion-demo
{
  "id": "clip-1",
  "title": "让问题有明确的输出目标",
  "src": "demos/clip-1.html",
  "duration": 5.5,
  "status": "authored",
  "description": "2.5–8 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 检索过程短，回答留阅读时间

搜索记录与终端地址快速经过，最终停在公司、反馈和变化三列对照表。蓝色外框承接不同界面，表格纵向移动时标题行保持稳定。

```motion-demo
{
  "id": "clip-2",
  "title": "检索过程短，回答留阅读时间",
  "src": "demos/clip-2.html",
  "duration": 6,
  "status": "authored",
  "description": "10–16 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 替换题目时同步准备结果结构

可换竞品、文献或客户研究；给出真实可用的查询与列定义。终端输出不需要占满整片，结尾用一句简短可用性说明和品牌即可。

## 配色与字形

界面正文无衬线，工具调用与地址用等宽；介绍句保留蓝色关键词。

#f6f6f3 · #18191b · #245be8 · #147d46 · #e7e8e8

## 元素与制作规则

输入栏 / 工具标签 / 检索记录 / 地址行 / 对照表 / 品牌名

- 开场文字将工具名与宿主名分色，进入白色输入窗后完整输入研究问题。工具标签留在输入栏附近，避免被误解为普通聊天。
- 搜索记录与终端地址快速经过，最终停在公司、反馈和变化三列对照表。蓝色外框承接不同界面，表格纵向移动时标题行保持稳定。
- 可换竞品、文献或客户研究；给出真实可用的查询与列定义。终端输出不需要占满整片，结尾用一句简短可用性说明和品牌即可。

## 内容替换

- 替换研究题目、工具名与结果表；保留输入→调用→答案。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Exa",
  "id": "V329",
  "palette": [
    "#f6f6f3",
    "#18191b",
    "#245be8",
    "#147d46",
    "#e7e8e8"
  ],
  "typography": "界面正文无衬线，工具调用与地址用等宽；介绍句保留蓝色关键词",
  "sample": "Exa in Codex",
  "objects": [
    "输入栏",
    "工具标签",
    "检索记录",
    "地址行",
    "对照表",
    "品牌名"
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
      "path": "https://r.open-design.ai/files/67e0b340a28e6dd6a4d6a0703cab06276a9b8b89bd6611368e3a64260a3e3d8e",
      "timeSeconds": 2.533333333333333,
      "frameId": "K0006",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 8.0,
      "frameId": "K0017",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/b47ef0a4ed70c9d09c7e400ccc3f44b6c9091b64a69aa861849e94585605fd48",
      "timeSeconds": 12.0,
      "frameId": "K0031",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 16.5,
      "frameId": "K0041",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 19.0,
      "frameId": "K0048",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "文字引入",
      "end": 2.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.5,
      "label": "输入任务",
      "end": 8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8,
      "label": "调用搜索",
      "end": 10,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10,
      "label": "检索输出",
      "end": 12,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12,
      "label": "结构化答案",
      "end": 16.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 16.5,
      "label": "接入主张",
      "end": 19,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 19,
      "label": "品牌留白",
      "end": 23.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 23.0,
  "fontFamily": "Arial, sans-serif"
}
```
