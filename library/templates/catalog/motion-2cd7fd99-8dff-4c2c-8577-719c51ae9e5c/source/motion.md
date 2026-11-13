# Apple｜Spotlight 界面动效

一条搜索胶囊从查找命令变成填写命令。动作选择前后，输入区域承担不同职责。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 5.5,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 1,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Send a message",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#62c4d7"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Send a message",
        "accent": "#62c4d7"
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

## 搜索、建议、参数连续切换

关键词出现后展开建议列表，选中动作后收起列表，并把胶囊改成参数化输入。新内容只写入消息槽位，收件人等占位符保留清晰边界。

## 把状态变化限制在胶囊附近

圆角容器位置稳定，列表从其下方出现；收起后回到同一个输入基线。指针与选中高亮说明当前操作，文本不随背景运动。

## 半透明浅面板浮在蓝色背景上

用蓝与青色渐层衬托浅色胶囊，输入与列表文字用清楚的无衬线。动作标签、占位符和已输入内容要有对比层级，标签宽度随文本适配。

## 可迁移为任意命令面板

替换查询词、建议项和参数名称。保留“查找→确定动作→补全参数”的语法，确保每个占位符能在最终输入中找到对应内容。

## 配色与字形

无衬线中粗主标题；细边框界面与小号功能文字。

#1478c5 · #f7fbf9 · #62c4d7 · #a4d9e3 · #214be0

## 元素与制作规则

搜索胶囊 / 联想列表 / 动作标签 / 参数占位符

- 搜索词触发建议列表，选中操作后列表收起、胶囊转为参数化命令。
- 新输入只改变消息槽位，收件人占位符持续可辨。

## 内容替换

- 可换任意命令面板操作；保留搜索→选择→填参数。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Apple",
  "id": "V287",
  "palette": [
    "#1478c5",
    "#f7fbf9",
    "#62c4d7",
    "#a4d9e3",
    "#214be0"
  ],
  "typography": "无衬线中粗主标题；细边框界面与小号功能文字",
  "sample": "Send a message",
  "objects": [
    "搜索胶囊",
    "联想列表",
    "动作标签",
    "参数占位符"
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
      "timeSeconds": 0.8666666666666667,
      "frameId": "K0002",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 1.0,
      "frameId": "K0003",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 2.2666666666666666,
      "frameId": "K0006",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 3.0,
      "frameId": "K0007",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "搜索胶囊",
      "end": 0.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.5,
      "label": "输入关键词",
      "end": 1,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1,
      "label": "建议列表展开",
      "end": 2.3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.3,
      "label": "选择动作",
      "end": 2.6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.6,
      "label": "消息字段",
      "end": 3.3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.3,
      "label": "继续输入内容",
      "end": 5.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 5.5,
  "fontFamily": "Arial, sans-serif"
}
```
