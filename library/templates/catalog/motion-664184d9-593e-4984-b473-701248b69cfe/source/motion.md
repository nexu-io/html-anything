# Bolt Skills｜团队能力展示

把重复交代的要求变成可调用的技能；用一次配色变化证明技能真正作用于页面。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 42.966667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 8.8,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "/skills",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#228eff"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "/skills",
        "accent": "#228eff"
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

## 先从菜单找到技能

深色输入框上展开两级菜单，Skills 项高亮后再出现技能列表。游标路径跟随菜单层级，选中项回到输入框成为标签。

```motion-demo
{
  "id": "clip-1",
  "title": "先从菜单找到技能",
  "src": "demos/clip-1.html",
  "duration": 4,
  "status": "authored",
  "description": "7–11 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 创建、导入和上传是三个入口

先示意技能名称、说明与规则正文，再分别展示仓库地址和文件上传。每个入口留一个清楚的完成状态，随后才进入调用。

## 规则生效要在同一页面比较

调用前后保持页面布局与内容不变，只改变技能负责的配色。蓝黑背景和白字承担产品框架，网站保留自己的内容风格。

```motion-demo
{
  "id": "clip-3",
  "title": "规则生效要在同一页面比较",
  "src": "demos/clip-3.html",
  "duration": 6,
  "status": "authored",
  "description": "33–39 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 新主题选择可见的规则

可替换为排版、品牌色或组件规范；准备规则文本与对应的前后页面，避免仅展示文件导入成功。

## 配色与字形

无衬线口语短句；表单正文按输入层级排列。

#061325 · #ffffff · #228eff · #1c2028 · #777f91

## 元素与制作规则

输入框 / 嵌套菜单 / 技能表单 / 仓库输入 / 文件标签 / 网站结果

- 深色输入框上展开两级菜单，Skills 项高亮后再出现技能列表。游标路径跟随菜单层级，选中项回到输入框成为标签。
- 先示意技能名称、说明与规则正文，再分别展示仓库地址和文件上传。每个入口留一个清楚的完成状态，随后才进入调用。
- 调用前后保持页面布局与内容不变，只改变技能负责的配色。蓝黑背景和白字承担产品框架，网站保留自己的内容风格。
- 可替换为排版、品牌色或组件规范；准备规则文本与对应的前后页面，避免仅展示文件导入成功。

## 内容替换

- 替换技能规则与前后页面；保留录入、保存、调用、生效。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Bolt",
  "id": "V374",
  "palette": [
    "#061325",
    "#ffffff",
    "#228eff",
    "#1c2028",
    "#777f91"
  ],
  "typography": "无衬线口语短句；表单正文按输入层级排列",
  "sample": "/skills",
  "objects": [
    "输入框",
    "嵌套菜单",
    "技能表单",
    "仓库输入",
    "文件标签",
    "网站结果"
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
      "timeSeconds": 7.0,
      "frameId": "K0030",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 16.0,
      "frameId": "K0064",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 26.0,
      "frameId": "K0103",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 33.0,
      "frameId": "K0133",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 40.0,
      "frameId": "K0155",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "反复输入问题",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "技能介绍",
      "end": 7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7,
      "label": "菜单选择",
      "end": 12,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12,
      "label": "应用初始风格",
      "end": 16,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 16,
      "label": "创建技能",
      "end": 22,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 22,
      "label": "导入仓库",
      "end": 26,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 26,
      "label": "上传文件",
      "end": 29,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 29,
      "label": "精选技能",
      "end": 33,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 33,
      "label": "调用技能",
      "end": 35,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 35,
      "label": "应用新配色",
      "end": 40,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 40,
      "label": "品牌收束",
      "end": 42.966667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 42.966667,
  "fontFamily": "Arial, sans-serif"
}
```
