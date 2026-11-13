# 产品预热｜Windows 相关预告

先让催更请求占满桌面，再用一个复古系统弹框回应。多到少的突变是这支短片的主要节奏。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 9.217542,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 3.3,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Codex for Windows",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#7e74e9"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Codex for Windows",
        "accent": "#7e74e9"
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

## 让桌面一眼可辨认

蓝天、草地和复古窗口建立平台语境。请求帖用白底黑字，略微旋转并错开位置；系统按钮保留硬边和朴素字形。

## 堆到最密，再清场

相似请求从不同方向陆续进入，后来的帖子盖住前面的局部。密度到顶后突然撤去，弹框单独出现，最后只留产品图标。

## 换平台时一起换文化符号

可替换用户请求、桌面背景、系统弹框和图标。让请求表达同一个需求，结尾的单一回应才有力度；每张帖控制在一两行可扫读内容。

## 配色与字形

蓝天草地桌面意象、白社交帖叠层、复古系统对话框。

#67a3e6 · #1a1a1a · #7e74e9 · #91b844 · #ffffff

## 元素与制作规则

桌面背景 / 用户需求帖 / 系统对话框 / 产品图标

- 多条相似请求从不同方向叠入并微倾，累积需求压力。
- 密集帖子骤然撤去，留下复古确认框作回应。
- 最后缩减为单图标，密度变化制造笑点。

## 内容替换

- 换平台时同时更换背景文化符号、需求和系统样式。
- 保留多请求→单回应→产品揭示。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "OpenAI",
  "id": "V012",
  "palette": [
    "#67a3e6",
    "#1a1a1a",
    "#7e74e9",
    "#91b844",
    "#ffffff"
  ],
  "typography": "蓝天草地桌面意象、白社交帖叠层、复古系统对话框",
  "sample": "Codex for Windows",
  "objects": [
    "桌面背景",
    "用户需求帖",
    "系统对话框",
    "产品图标"
  ],
  "frames": [
    {
      "path": "https://r.open-design.ai/files/44e3c8e30cabedb4ce1fa78e699446d2211a55f960d769243976b2e225e54f99",
      "timeSeconds": 0.0,
      "frameId": "K0001",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/c360fdcb71a008d673e521ecf3b44a22a3ca5aa619fba5e114dd0270217478bb",
      "timeSeconds": 0.25025,
      "frameId": "K0002",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/0c1eb0b33d317840a06b7ad3845e14345efaf971db180f5afe09e1f1cbec50f1",
      "timeSeconds": 3.0029999999999997,
      "frameId": "K0008",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/0aeeed589939b864fe1168cc2c879d50f9e72992216e6a9de73b4eece482cbf3",
      "timeSeconds": 6.25625,
      "frameId": "K0021",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/4ec35de2cf05a21169f24d526a609a9c8957419f861a9256f0a4a696dff430e6",
      "timeSeconds": 7.632624999999999,
      "frameId": "K0025",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "第一条需求",
      "end": 0.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.5,
      "label": "帖子逐个叠入",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "需求密度增加",
      "end": 6.2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6.2,
      "label": "旧式系统弹框",
      "end": 7.6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7.6,
      "label": "产品图标落版",
      "end": 9.217542,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 9.217542,
  "fontFamily": "Arial, sans-serif"
}
```
