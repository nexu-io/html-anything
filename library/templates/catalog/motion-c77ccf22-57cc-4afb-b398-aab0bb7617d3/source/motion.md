# Cursor — start a web app and deploy to Vercel

从没有仓库的空白开始，生成一个网站，检查它，再保存和发布。每个阶段都围绕同一份作品展开。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 24.633333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 4.8,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Prompt, preview, publish",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#9966cc"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Prompt, preview, publish",
        "accent": "#9966cc"
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

## 先说明起点可以为空

仓库选择器先出现，再切到从零开始的请求。输入中交代网站行业和设计方向，发送后显示构建状态，随后打开对应预览。

浅色界面置于粉色外围，任务与控件使用清晰无衬线字。作品可用更有编辑感的衬线标题，但工具外壳保持统一。

## 预览可滚动，内容要连续

先看到页面首屏，再滚动到后续内容。文字、图像和配色延续输入方向，侧边任务区保持稳定，避免把成果展示误看成另一个应用。

```motion-demo
{
  "id": "clip-2",
  "title": "预览可滚动，内容要连续",
  "src": "demos/clip-2.html",
  "duration": 6,
  "status": "authored",
  "description": "9–15 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 保存与发布是两个动作

创建仓库时给出确认反馈，发布时再交代目标平台。两者之间保留短停顿；链接或连线表达去向，不能代替实际入口。

末尾把作品局部围绕一句“输入、预览、发布”的总结排开，组成完整工作链的回顾。

## 换主题时连作品合集一起改

准备新的行业、提示词和页面内容，末尾拼贴从同一作品中选取。保留可选起点、预览检查、保存、发布四个环节。

## 配色与字形

无衬线界面文字与清晰大小层级。

#f5f5f1 · #202122 · #9966cc · #f1ba8a · #9ab8ad

## 元素与制作规则

仓库选择 / 提示框 / 构建状态 / 网站预览 / 保存按钮 / 发布连接 / 作品局部

- 先展示可选仓库，再强调从零创建；输入后才出现预览
- 预览内容可以滚动检查，随后保存为仓库并进入发布
- 末尾作品局部围绕一句三动作总结，呼应全流程

## 内容替换

- 适合创作发布链；保留起点选择→生成→预览→保存→发布
- 替换作品主题时也应替换请求与最终拼贴，保持一致

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Cursor",
  "id": "V262",
  "palette": [
    "#f5f5f1",
    "#202122",
    "#9966cc",
    "#f1ba8a",
    "#9ab8ad"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "Prompt, preview, publish",
  "objects": [
    "仓库选择",
    "提示框",
    "构建状态",
    "网站预览",
    "保存按钮",
    "发布连接",
    "作品局部"
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
      "timeSeconds": 4.0,
      "frameId": "K0011",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 9.0,
      "frameId": "K0020",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/28670f86397457c5ddfcbb82f0d395c3cb27d831b8cf45b08c95cccca9787d0a",
      "timeSeconds": 13.0,
      "frameId": "K0029",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 18.0,
      "frameId": "K0041",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 22.0,
      "frameId": "K0055",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "应用入口",
      "end": 1.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.0,
      "label": "选择仓库",
      "end": 4.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.0,
      "label": "无需仓库",
      "end": 6.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6.0,
      "label": "输入建站请求",
      "end": 9.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9.0,
      "label": "构建状态",
      "end": 11.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11.0,
      "label": "网站预览",
      "end": 13.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13.0,
      "label": "保存仓库",
      "end": 16.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 16.0,
      "label": "保存主张",
      "end": 18.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18.0,
      "label": "发布连接",
      "end": 20.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 20.0,
      "label": "作品拼贴",
      "end": 22.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 22.0,
      "label": "品牌",
      "end": 24.633333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 24.633333,
  "fontFamily": "Arial, sans-serif"
}
```
