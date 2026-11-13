# Cursor · 从手机控制电脑代理

用手机与电脑并排说明远程协作：先建立授权，再同步上下文，最后从手机发起下一项工作。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 38.8,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 7.2,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Agents from your phone",
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
        "title": "Agents from your phone",
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

## 先配对，再共享内容

手机和电脑分别占据稳定位置，授权框出现在电脑端或明确的接收端。确认后显示连接状态，再让同一条消息和图片出现在两边。

紫色外围承托深色双端界面，重要文字用浅色无衬线。手机更窄，只保留当前上下文；电脑更宽，展示执行与成果。

## 同步靠相同内容，不靠两边乱动

结果图片在电脑端出现后，再进入手机端。名称、内容和任务标题保持一致，滚动只服务当前阅读对象，不要求两边同时以同样速度滚动。

```motion-demo
{
  "id": "clip-2",
  "title": "同步靠相同内容，不靠两边乱动",
  "src": "demos/clip-2.html",
  "duration": 7,
  "status": "authored",
  "description": "14–21 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 从手机发出的追问，电脑来处理

手机键盘或输入框出现，发送追问后电脑进入处理状态，结果更新再回到两端。用这一轮方向明确的往返结束演示。

换场景时可替换成果为设计图、报告或代码结果，保留授权、共享上下文和远程发起三种关系。

## 配色与字形

无衬线界面文字与清晰大小层级。

#f5f5f1 · #202122 · #9966cc · #f1ba8a · #9ab8ad

## 元素与制作规则

手机聊天 / 电脑代理 / 授权框 / 配对状态 / 共享图片 / 追问 / 键盘

- 先授权配对，随后同一消息和结果出现在两端
- 手机输入发出后电脑开始执行，最后双方更新，方向明确
- 图像出现顺序说明同步关系，不需要每帧同步滚动

## 内容替换

- 迁移到远程控制场景时保留授权→共享上下文→远程发起→反馈
- 两端角色和消息身份保持一致，品牌内容可换

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Cursor",
  "id": "V274",
  "palette": [
    "#f5f5f1",
    "#202122",
    "#9966cc",
    "#f1ba8a",
    "#9ab8ad"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "Agents from your phone",
  "objects": [
    "手机聊天",
    "电脑代理",
    "授权框",
    "配对状态",
    "共享图片",
    "追问",
    "键盘"
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
      "timeSeconds": 6.0,
      "frameId": "K0011",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 14.0,
      "frameId": "K0026",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 21.0,
      "frameId": "K0039",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 28.0,
      "frameId": "K0050",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 36.0,
      "frameId": "K0061",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "移动控制主张",
      "end": 3.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.0,
      "label": "手机与电脑并列",
      "end": 6.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6.0,
      "label": "电脑授权",
      "end": 10.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10.0,
      "label": "接入成功",
      "end": 14.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 14.0,
      "label": "消息同步",
      "end": 18.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18.0,
      "label": "结果图片同步",
      "end": 21.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 21.0,
      "label": "手机输入",
      "end": 25.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 25.0,
      "label": "发送追问",
      "end": 28.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 28.0,
      "label": "电脑处理",
      "end": 33.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 33.0,
      "label": "双端更新",
      "end": 36.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 36.0,
      "label": "品牌",
      "end": 38.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 38.8,
  "fontFamily": "Arial, sans-serif"
}
```
