# Notion Skills — export to local coding agents

先用名称轮换说明兼容范围，再用一条完整路径说明技能如何生成、导出和调用。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 32.383333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 8,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Notion Skills",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#2f91cb"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Notion Skills",
        "accent": "#2f91cb"
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

## 名称轮换只负责建立范围

开场保持标题基线和字号，快速替换代理名称。变化集中在名称槽位，其他文字不跳位；展示足够的代表后立即进入操作。

## 生成、下载、调用接成一件事

技能请求之后展开文档，再打开下载弹窗和连接确认。导出完成后切到终端，用对应名称的命令调用；文档名与命令参数保持一致。

## 用字体区分文档和命令

主标题采用中粗无衬线，文档和菜单采用清晰的小号无衬线，终端采用等宽字。浅底界面和黑底终端形成阶段区分，蓝色强调当前选择，淡杏与紫色可用于外围背景。

## 替换可共享的知识包

主题可改成品牌指南、测试规则或写作方法。先确定可导出的包名，再同步生成文档、下载选项和终端命令；代理名称轮换对应实际适用对象。

## 配色与字形

无衬线中粗主标题；细边框界面与小号功能文字。

#ffffff · #191919 · #2f91cb · #f2e1bb · #aea0ce

## 元素与制作规则

标题 / 代理名 / 技能文档 / 下载弹窗 / 终端命令

- 多代理名称先快速切换说明兼容范围，再用一次完整导出与调用证明。
- 下载选项选择后才出现终端 slash 命令。

## 内容替换

- 换知识包主题时保留生成→导出→独立工具调用。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Notion",
  "id": "V089",
  "palette": [
    "#ffffff",
    "#191919",
    "#2f91cb",
    "#f2e1bb",
    "#aea0ce"
  ],
  "typography": "无衬线中粗主标题；细边框界面与小号功能文字",
  "sample": "Notion Skills",
  "objects": [
    "标题",
    "代理名",
    "技能文档",
    "下载弹窗",
    "终端命令"
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
      "timeSeconds": 3.0,
      "frameId": "K0007",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 13.0,
      "frameId": "K0027",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 17.0,
      "frameId": "K0036",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 25.0,
      "frameId": "K0055",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 30.0,
      "frameId": "K0064",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "标题",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "代理名称轮换",
      "end": 8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8,
      "label": "技能请求",
      "end": 13,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13,
      "label": "文档生成",
      "end": 17,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 17,
      "label": "下载弹窗",
      "end": 22,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 22,
      "label": "连接确认",
      "end": 25,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 25,
      "label": "终端调用",
      "end": 30,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 30,
      "label": "品牌",
      "end": 32.383333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 32.383333,
  "fontFamily": "Arial, sans-serif"
}
```
