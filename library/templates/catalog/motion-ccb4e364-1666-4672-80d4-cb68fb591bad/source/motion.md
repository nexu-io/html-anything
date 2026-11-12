# Figma × Codex · 设计与实现交接

将选中的设计和批注交给实现代理，再用对应屏幕的运行结果完成交接。重点是让人看清“传了什么”。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 40.0,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 8,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Design to implementation",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#96d93c"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Design to implementation",
        "accent": "#96d93c"
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

## 设计与批注先准备好

从代理入口进入设计工具，展示多帧设计与批注。选中时保留清楚的外框和计数，提交按钮附近再次显示引用对象，避免选择在切镜时丢失。

```motion-demo
{
  "id": "clip-1",
  "title": "设计与批注先准备好",
  "src": "demos/clip-1.html",
  "duration": 17,
  "status": "authored",
  "description": "4–21 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 实现结果对应选中的屏幕

提交请求后依次交代设计变量、组件和运行结果。预览中使用相同的页面结构与核心文本，让选择的三帧与最终结果能够逐一对应。

| 时间 | 段落 |
|---|---|
| 0.00–4.00s | 代理侧栏 |
| 4.00–8.00s | 打开设计工具 |
| 8.00–11.00s | 多帧设计 |
| 11.00–17.00s | 批注 |
| 17.00–21.00s | 选中三帧 |
| 21.00–25.00s | 提交实现请求 |
| 25.00–29.00s | 设计变量与组件 |
| 29.00–35.00s | 运行结果 |
| 35.00–40.00s | 品牌联名 |

## 把交接焦点放大

深灰外层和明亮画布保持层次，绿、紫、橙用于选中、批注和界面示例。标题用中粗无衬线，计数和引用用清楚的小号字；选择数、批注和提交动作采用局部近景。

## 可换工具，不能丢掉上下文

替换开发代理、设计帧、批注和实现结果时保持同一套页面。请求文字明确引用选中对象，联名结束页只负责说明工具关系，不替代实际交接过程。

## 配色与字形

无衬线中粗主标题；细边框界面与小号功能文字。

#161616 · #f6f6ef · #96d93c · #8d56d7 · #f56c3d

## 元素与制作规则

代理入口 / 设计帧 / 批注 / 选择计数 / 实现请求 / 运行预览

- 先带着批注选择设计帧，再把选中上下文交给实现代理；实现结果对应选中的屏幕。
- 近景突出选择数与引用，避免观众不知道传了什么。

## 内容替换

- 可换开发工具；保留设计对象与实现产物一一对应。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Figma",
  "id": "V273",
  "palette": [
    "#161616",
    "#f6f6ef",
    "#96d93c",
    "#8d56d7",
    "#f56c3d"
  ],
  "typography": "无衬线中粗主标题；细边框界面与小号功能文字",
  "sample": "Design to implementation",
  "objects": [
    "代理入口",
    "设计帧",
    "批注",
    "选择计数",
    "实现请求",
    "运行预览"
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
      "path": "https://r.open-design.ai/files/4f57bd3e65d75ca094611486e8be5abcf0410b1f9fac16fa78b8d69d92aaa489",
      "timeSeconds": 8.0,
      "frameId": "K0027",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/72310ec3fb4a4e7cf533b24f9ce1dfe75192475fdfb6b488a8f566b9639c0651",
      "timeSeconds": 11.0,
      "frameId": "K0037",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 21.0,
      "frameId": "K0071",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 25.0,
      "frameId": "K0085",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 35.0,
      "frameId": "K0121",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "代理侧栏",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "打开设计工具",
      "end": 8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8,
      "label": "多帧设计",
      "end": 11,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11,
      "label": "批注",
      "end": 17,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 17,
      "label": "选中三帧",
      "end": 21,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 21,
      "label": "提交实现请求",
      "end": 25,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 25,
      "label": "设计变量与组件",
      "end": 29,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 29,
      "label": "运行结果",
      "end": 35,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 35,
      "label": "品牌联名",
      "end": 40.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 40.0,
  "fontFamily": "Arial, sans-serif"
}
```
