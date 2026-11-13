# Grok Bot｜分享模板

让同一个助手从私人设置走到公开模板，再被另一个工作区接收。名称和头像是贯穿三处界面的锚点。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 16.566667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 3.3,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Sales Outbound",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#84adcf"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Sales Outbound",
        "accent": "#84adcf"
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

## 先看配置，再触发分享

浅蓝光晕后放白色桌面界面，侧栏和设置区分开。名称与头像留在显眼位置，无衬线正文说明助手用途，分享按钮用强调色。

## 公开页承接刚才的助手

点击分享后进入模板展示页，延续头像、名称和介绍。公开页减少后台控件，突出用途和 Open 按钮。

```motion-demo
{
  "id": "clip-2",
  "title": "公开页承接刚才的助手",
  "src": "demos/clip-2.html",
  "duration": 8,
  "status": "authored",
  "description": "3–11 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 在接收方留下一个新入口

打开后让同一助手出现在工作区侧栏或列表中。这里呈现的是添加成功，位置要能被再次找到。

## 为新模板准备内容

可换头像、助手职责、介绍和模板名称。发布方设置、公开详情和接收方入口使用同一身份；介绍长时分段，按钮保持单独一行。

## 配色与字形

淡蓝光晕桌面、白色设置页与公开模板卡。

#f4f9fe · #191d20 · #84adcf · #d5e3ed · #f5b78a

## 元素与制作规则

助手身份 / 设置菜单 / 分享按钮 / 公开模板卡 / 添加按钮 / 接收方侧栏

- 同一助手的名称和头像贯穿设置、公开页面和接收方。
- 分享后要展示可被别人打开的页面，再展示添加成功。
- 这是可复用配置的传播，不能仅做一张卡翻面。

## 内容替换

- 适用于模板或工作流分发；保留发布方→公开对象→接收方。
- 内容替换须维持同一身份。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "xAI / Grok",
  "id": "V312",
  "palette": [
    "#f4f9fe",
    "#191d20",
    "#84adcf",
    "#d5e3ed",
    "#f5b78a"
  ],
  "typography": "淡蓝光晕桌面、白色设置页与公开模板卡",
  "sample": "Sales Outbound",
  "objects": [
    "助手身份",
    "设置菜单",
    "分享按钮",
    "公开模板卡",
    "添加按钮",
    "接收方侧栏"
  ],
  "frames": [
    {
      "path": "https://r.open-design.ai/files/08343cebd2125e4fd94c74d3f2392f947880e2de53f98ebd13798e22d3bc8172",
      "timeSeconds": 0.0,
      "frameId": "K0001",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-2.webp",
      "timeSeconds": 2.0,
      "frameId": "K0005",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 3.0,
      "frameId": "K0010",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 9.0,
      "frameId": "K0025",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 11.0,
      "frameId": "K0031",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 14.0,
      "frameId": "K0040",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "现有助手",
      "end": 2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2,
      "label": "打开设置",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "分享为模板",
      "end": 6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6,
      "label": "公开展示页",
      "end": 9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9,
      "label": "模板详情",
      "end": 11,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11,
      "label": "添加到工作区",
      "end": 14,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 14,
      "label": "品牌",
      "end": 16.566667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 16.566667,
  "fontFamily": "Arial, sans-serif"
}
```
