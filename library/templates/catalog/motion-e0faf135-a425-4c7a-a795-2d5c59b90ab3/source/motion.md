# Zapier Motion Library

用复制失控的桌面表现繁杂工作，再让一个开关把所有噪声整理成少量完成的流程。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 11.959333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 6.6,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "OFF → ON",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#4d16ed"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "OFF → ON",
        "accent": "#4d16ed"
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

## 复制不仅增加数量，也增加遮挡

一个窗口引出代码和文件，随后沿对角线形成层层残影。文件名越加越长，窗口互相压住；指针穿行，饱和粉紫背景逐渐加入橙色。

```motion-demo
{
  "id": "clip-1",
  "title": "复制不仅增加数量，也增加遮挡",
  "src": "demos/clip-1.html",
  "duration": 5.2,
  "status": "authored",
  "description": "1–6.2 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 开关是全片唯一的整理动作

OFF 状态让画面维持拥挤，切到 ON 后整体清空，三条流程在中心按行对齐。流程再合成一条，留下图标、短线与完成勾；不继续保留混乱桌面的碎片。

## 复古边框与平滑渐变同时保留

窗口标题条用深紫细框，内容可用浅绿或渐变填充，代码用等宽。完成态回到薄荷绿到紫的纵向渐变，勾号与图标清楚，闪光点只作短暂强调。

## 迁移时更换混乱内容和流程目标

适合自动化或工作整理主题。替换文件、代码、应用图标与最终流程，保留数量失控—总开关—对齐收束的节奏；最终一条流程必须能概括前面的杂事。

## 配色与字形

等宽代码和文件名配复古系统窗口；硬边细框、强饱和渐变与像素符号。

#e983f2 · #25124c · #4d16ed · #dfffa5 · #f47a4e

## 元素与制作规则

复古窗口 / 重复文件 / 代码片段 / 情绪图形 / 总开关 / 任务条

- 用复制失控的桌面表现繁杂工作，再让一个开关把所有噪声整理成少量完成的流程。
- 一个窗口引出代码和文件，随后沿对角线形成层层残影。文件名越加越长，窗口互相压住；指针穿行，饱和粉紫背景逐渐加入橙色。
- OFF 状态让画面维持拥挤，切到 ON 后整体清空，三条流程在中心按行对齐。流程再合成一条，留下图标、短线与完成勾；不继续保留混乱桌面的碎片。

## 内容替换

- 适合自动化或工作整理主题。替换文件、代码、应用图标与最终流程，保留数量失控—总开关—对齐收束的节奏；最终一条流程必须能概括前面的杂事。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Zapier",
  "id": "V392",
  "palette": [
    "#e983f2",
    "#25124c",
    "#4d16ed",
    "#dfffa5",
    "#f47a4e"
  ],
  "typography": "等宽代码和文件名配复古系统窗口；硬边细框、强饱和渐变与像素符号",
  "sample": "OFF → ON",
  "objects": [
    "复古窗口",
    "重复文件",
    "代码片段",
    "情绪图形",
    "总开关",
    "任务条"
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
      "path": "https://r.open-design.ai/files/0baa12dca9031c8e89b0c9e8e34896aaf91fb0f932777179c5e98df9ae78e89f",
      "timeSeconds": 1.7855949074074073,
      "frameId": "K0004",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/215fc9b50655a0282a5060c46484a2095cf7ff7a91ffcd1a34747fe6bbec532b",
      "timeSeconds": 3.986444444444444,
      "frameId": "K0010",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/968f58c8efbe6356db5f2e84850b213933aebf01b6d4480cfec1348380feb98a",
      "timeSeconds": 6.561023148148148,
      "frameId": "K0022",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 7.972888888888888,
      "frameId": "K0026",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 11.91780787037037,
      "frameId": "K0035",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "渐变空场",
      "end": 1,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1,
      "label": "单窗口",
      "end": 1.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.8,
      "label": "代码与文件",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "窗口复制",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "多任务拥挤",
      "end": 5.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5.5,
      "label": "焦虑图像",
      "end": 6.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6.5,
      "label": "OFF 开关",
      "end": 7.3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7.3,
      "label": "开启",
      "end": 8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8,
      "label": "三条流程",
      "end": 9.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9.5,
      "label": "合为一条",
      "end": 11.9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11.9,
      "label": "停留",
      "end": 11.959333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 11.959333,
  "fontFamily": "ui-monospace, monospace"
}
```
