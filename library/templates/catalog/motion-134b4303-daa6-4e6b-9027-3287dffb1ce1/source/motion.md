# Grok Bot｜购物功能短片

让一个角色注视并介绍一张卡片。卡片的翻转先建立存在感，随后用一句话说明它代表的新能力。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 11.333333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 4.3,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Bot can buy",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#87bda8"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Bot can buy",
        "accent": "#87bda8"
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

## 角色和卡片各占一侧

白底上用黑色圆脸和绿色卡片形成简洁对照。角色五官朝向卡片，功能说明用黑色无衬线放在下方，保持图形之间的空隙。

## 围绕竖轴翻转卡片

卡片正面逐渐变窄到侧边，再展开成另一面；厚度、圆角和明暗一起变化。角色目光随卡片轻微移动，身体位置保持稳定。

## 替换新的能力象征

可把银行卡换为权限卡、证书或通行证，同时更换短句。让物件先可辨认，再出现解释；复杂图案减少到主标识和两三项细节。

## 配色与字形

白底黑色圆脸与绿色银行卡、简短声明。

#fcfcfb · #181918 · #87bda8 · #c7ddd2 · #e3e7e2

## 元素与制作规则

黑色圆脸 / 绿色卡片 / 眼睛 / 功能短句

- 角色目光朝向卡片，卡片绕垂直轴连续翻转。
- 卡片变窄到近线状后再展开，表达透视旋转。
- 卡片承担能力象征，短句说明能力，流程保持简洁。

## 内容替换

- 可换支付凭证或权限卡；保留角色凝视与卡片展示关系。
- 只适合一条能力声明。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "xAI / Grok",
  "id": "V313",
  "palette": [
    "#fcfcfb",
    "#181918",
    "#87bda8",
    "#c7ddd2",
    "#e3e7e2"
  ],
  "typography": "白底黑色圆脸与绿色银行卡、简短声明",
  "sample": "Bot can buy",
  "objects": [
    "黑色圆脸",
    "绿色卡片",
    "眼睛",
    "功能短句"
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
      "timeSeconds": 1.0,
      "frameId": "K0002",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 4.0,
      "frameId": "K0008",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 5.0,
      "frameId": "K0012",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 8.0,
      "frameId": "K0021",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 9.0,
      "frameId": "K0022",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "角色与卡片",
      "end": 1,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1,
      "label": "卡片转向",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "卡片正面",
      "end": 5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5,
      "label": "功能声明",
      "end": 8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8,
      "label": "图形收束",
      "end": 9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9,
      "label": "品牌",
      "end": 11.333333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 11.333333,
  "fontFamily": "Arial, sans-serif"
}
```
