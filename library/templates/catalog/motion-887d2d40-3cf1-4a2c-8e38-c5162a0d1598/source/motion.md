# EliseAI｜官网产品界面

用一次完整的预约对话说明助理价值：用户提出时间需求，助理给出两个选择，用户确认其中一个。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 9.983333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 6,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Elise",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#2478ed"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Elise",
        "accent": "#2478ed"
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

## 固定手机，按对话顺序添加气泡

手机轻微倾斜但聊天坐标跟随屏幕。用户蓝色气泡右对齐，助理深灰气泡左对齐；前一条稳定后才加入下一条。

```motion-demo
{
  "id": "clip-1",
  "title": "固定手机，按对话顺序添加气泡",
  "src": "demos/clip-1.html",
  "duration": 5.3,
  "status": "authored",
  "description": "0.5–5.8 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 三个消息足够形成闭环

第一条提出看房请求，第二条给两段可选时间，第三条确认。最后整体淡出回到空会话；不要在循环结束时倒放消息。

## 迁移到预约类产品

更换品牌头像、地点与两个时段。保持一问、一组选择、一次确认的容量，长消息先改写成两行以内。

## 配色与字形

手机聊天正文采用清楚的无衬线；不增加画外大标题。

#050609 · #f4f5f7 · #2478ed · #6553d9 · #303238

## 元素与制作规则

手机边框 / 助手头像 / 用户气泡 / 助理气泡 / 输入栏

- 手机轻微倾斜但聊天坐标跟随屏幕。用户蓝色气泡右对齐，助理深灰气泡左对齐；前一条稳定后才加入下一条。
- 第一条提出看房请求，第二条给两段可选时间，第三条确认。最后整体淡出回到空会话；不要在循环结束时倒放消息。
- 更换品牌头像、地点与两个时段。保持一问、一组选择、一次确认的容量，长消息先改写成两行以内。

## 内容替换

- 替换预约业务、可选时间与头像；保留三条消息的因果。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "EliseAI",
  "id": "V183",
  "palette": [
    "#050609",
    "#f4f5f7",
    "#2478ed",
    "#6553d9",
    "#303238"
  ],
  "typography": "手机聊天正文采用清楚的无衬线；不增加画外大标题",
  "sample": "Elise",
  "objects": [
    "手机边框",
    "助手头像",
    "用户气泡",
    "助理气泡",
    "输入栏"
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
      "timeSeconds": 5.0,
      "frameId": "K0007",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 9.0,
      "frameId": "K0012",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "等待消息",
      "end": 0.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.8,
      "label": "用户提问",
      "end": 2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2,
      "label": "给出时段",
      "end": 5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5,
      "label": "用户确认",
      "end": 9.1,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9.1,
      "label": "消息淡出",
      "end": 9.983333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 9.983333,
  "fontFamily": "Arial, sans-serif"
}
```
