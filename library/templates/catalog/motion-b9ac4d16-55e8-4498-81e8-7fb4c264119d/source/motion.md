# Linear — merge queue status in diffs

一条稳定的排队状态，用悬停补充更详细的等待信息。整个动作只需要局部出现与消失。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 6.133333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 1.7,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Queued",
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
        "title": "Queued",
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

## 悬停补充信息，不改变状态

指针移到预计时长附近后出现说明浮层，离开后收起。Queued 和预计时长一直留在原位；浮层贴近触发区域，不能挡住正在解释的文字。

```motion-demo
{
  "id": "clip-1",
  "title": "悬停补充信息，不改变状态",
  "src": "demos/clip-1.html",
  "duration": 3.4000000000000004,
  "status": "authored",
  "description": "1.3–4.7 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 预计时长与已等待时长分层

主行显示当前状态和预计耗时，浮层显示已经等待多久，两者使用不同表述。深色背景、浅色无衬线、冷紫状态点与稍亮浮层即可建立层次；只对浮层使用短促淡入淡出，避免整行抖动。

## 可用于下载、渲染或发布队列

替换状态名、预计时间与详细说明时，保留这两层信息的区别。若没有额外信息，直接移除浮层；不需要为一个 hover 补充标题片或全片分镜。

## 配色与字形

无衬线中粗主标题；细边框界面与小号功能文字。

#090a0c · #e9e9e8 · #6970c6 · #30333c · #ffffff

## 元素与制作规则

状态行 / 预计时长 / 指针 / 说明浮层

- 短片只有局部 hover：主状态保持，悬停补充已经等待的时长，离开后隐藏。
- 预计完成与已等待时长是不同信息，不能互换。

## 内容替换

- 可迁移下载、渲染或发布队列；保留状态与说明分层。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Linear",
  "id": "V114",
  "palette": [
    "#090a0c",
    "#e9e9e8",
    "#6970c6",
    "#30333c",
    "#ffffff"
  ],
  "typography": "无衬线中粗主标题；细边框界面与小号功能文字",
  "sample": "Queued",
  "objects": [
    "状态行",
    "预计时长",
    "指针",
    "说明浮层"
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
      "timeSeconds": 1.0,
      "frameId": "K0002",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 2.0,
      "frameId": "K0003",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 4.0,
      "frameId": "K0005",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 5.0,
      "frameId": "K0006",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "排队状态",
      "end": 1.3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.3,
      "label": "指针悬停",
      "end": 1.7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.7,
      "label": "提示出现",
      "end": 4.2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.2,
      "label": "指针离开",
      "end": 4.7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.7,
      "label": "提示消失",
      "end": 6.133333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 6.133333,
  "fontFamily": "Arial, sans-serif"
}
```
