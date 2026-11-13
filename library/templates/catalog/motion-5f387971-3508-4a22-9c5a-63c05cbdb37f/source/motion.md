# Linear — coding sessions on mobile

在手机上保留代码上下文，并完成一次评论与回复。键盘出现和退出负责交代输入阶段的开始与结束。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 20.833333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 9,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Coding sessions on mobile",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#6970c6"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Coding sessions on mobile",
        "accent": "#6970c6"
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

## 上方看代码，下方写评论

手机窗口居中，代码变化保留在上半部，输入框和键盘位于下方。键盘进入时调整可用高度，让目标代码与当前输入都留在可见区域。

```motion-demo
{
  "id": "clip-1",
  "title": "上方看代码，下方写评论",
  "src": "demos/clip-1.html",
  "duration": 11,
  "status": "authored",
  "description": "0–11 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 提交后用处理状态接替键盘

评论提交后键盘退出，输入区切换为执行状态；回复晚于处理状态出现，并继续引用同一段代码上下文。不要通过整体换图跳过提交与等待。

```motion-demo
{
  "id": "clip-2",
  "title": "提交后用处理状态接替键盘",
  "src": "demos/clip-2.html",
  "duration": 9,
  "status": "authored",
  "description": "9–18 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 窄屏信息要比桌面更精简

暗色手机界面、浅色无衬线正文与冷紫强调构成层次，代码采用等宽字。每行长度适应窄屏，键盘与输入框保持足够区分；手机外侧只留少量标题，不堆满额外说明。

## 换成移动端审阅或任务反馈

替换代码、评论和回复时保持一致问题。可以用于设计审阅或发布处理，但始终保留“上下文→输入→提交→处理→回复”的依赖；缩短片长时压缩等待，不删除状态。

## 配色与字形

无衬线中粗主标题；细边框界面与小号功能文字。

#090a0c · #e9e9e8 · #6970c6 · #30333c · #ffffff

## 元素与制作规则

手机窗口 / 代码变化 / 输入框 / 软键盘 / 处理状态 / 回复

- 代码上下文保持在上方，输入与软键盘位于下方；提交后键盘退出、处理状态接替。
- 回复显示晚于执行状态，不通过整体截图替换掩盖时序。

## 内容替换

- 可换移动端评审主题；保留上下文引用与回复依赖。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Linear",
  "id": "V255",
  "palette": [
    "#090a0c",
    "#e9e9e8",
    "#6970c6",
    "#30333c",
    "#ffffff"
  ],
  "typography": "无衬线中粗主标题；细边框界面与小号功能文字",
  "sample": "Coding sessions on mobile",
  "objects": [
    "手机窗口",
    "代码变化",
    "输入框",
    "软键盘",
    "处理状态",
    "回复"
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
      "timeSeconds": 3.0,
      "frameId": "K0008",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 9.0,
      "frameId": "K0029",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 11.0,
      "frameId": "K0036",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 14.0,
      "frameId": "K0039",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 18.0,
      "frameId": "K0048",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "手机代码页",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "评论输入",
      "end": 9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9,
      "label": "提交评论",
      "end": 11,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11,
      "label": "执行状态",
      "end": 14,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 14,
      "label": "回复内容",
      "end": 18,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18,
      "label": "品牌",
      "end": 20.833333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 20.833333,
  "fontFamily": "Arial, sans-serif"
}
```
