# Telegram managed bots (AI bots) — On Telegram, anyone…

用一台固定手机走完机器人创建、测试与查看资料，点击反馈连接每个状态。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 12.0,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 7.3,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Create your agent",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#13b7ed"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Create your agent",
        "accent": "#13b7ed"
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

## 创建需要完整的字段与确认

入口按钮点击后弹出表单，填写名称和用户名，再确认创建。触点只在点击瞬间放大，不能一直遮住按钮；成功页沿用刚填的名称。

```motion-demo
{
  "id": "clip-1",
  "title": "创建需要完整的字段与确认",
  "src": "demos/clip-1.html",
  "duration": 3.6999999999999997,
  "status": "authored",
  "description": "1.6–5.3 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 创建成功之后再开始对话

Start 进入聊天，用户消息先出现，机器人回复后出现；打开资料页时保留同一头像与名称。深蓝界面配亮青按钮和紫色身份区，无衬线小字保持足够行距。

## 换成另一种账户或助手创建

名称、用户名、头像、欢迎语和资料页一起替换。保留创建—确认—测试—查看身份的闭环，设备外框与背景位置固定。

## 配色与字形

无衬线移动端界面；按钮、输入字段和消息气泡分层。

#0b2131 · #f5f8ff · #13b7ed · #706cf6 · #18394b

## 元素与制作规则

手机边框 / 创建按钮 / 命名表单 / 聊天气泡 / 资料页

- 用一台固定手机走完机器人创建、测试与查看资料，点击反馈连接每个状态。
- 入口按钮点击后弹出表单，填写名称和用户名，再确认创建。触点只在点击瞬间放大，不能一直遮住按钮；成功页沿用刚填的名称。
- Start 进入聊天，用户消息先出现，机器人回复后出现；打开资料页时保留同一头像与名称。深蓝界面配亮青按钮和紫色身份区，无衬线小字保持足够行距。

## 内容替换

- 名称、用户名、头像、欢迎语和资料页一起替换。保留创建—确认—测试—查看身份的闭环，设备外框与背景位置固定。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Telegram",
  "id": "V215",
  "palette": [
    "#0b2131",
    "#f5f8ff",
    "#13b7ed",
    "#706cf6",
    "#18394b"
  ],
  "typography": "无衬线移动端界面；按钮、输入字段和消息气泡分层",
  "sample": "Create your agent",
  "objects": [
    "手机边框",
    "创建按钮",
    "命名表单",
    "聊天气泡",
    "资料页"
  ],
  "frames": [
    {
      "path": "https://r.open-design.ai/files/af31f0b5953cc4ced5cad784d4ae40559225d1a8b8ad0e7414062837658dc297",
      "timeSeconds": 0.0,
      "frameId": "K0001",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/bbacb74f25b92b9b9b720fe65454d07ce7d11627780840fb812489b67e2668f2",
      "timeSeconds": 2.5,
      "frameId": "K0011",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/e1b58d51e44e7ef2a37340f549707b1f6c06d8934ab1f0df6df4279584daea99",
      "timeSeconds": 4.5,
      "frameId": "K0015",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/8bf7cb34f1327b0ae431627c03e70c748f6584b8a1c9f675c8067577d775b1ec",
      "timeSeconds": 6.0,
      "frameId": "K0020",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/1ce871d669cd53c7dc8570d10d256a7e5938e4107260a6d8e497aecb01196384",
      "timeSeconds": 7.0,
      "frameId": "K0024",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/9dadcfa120bec03b0d2fe77a41701fa991040f4f266a38bf98a46cb304e64c96",
      "timeSeconds": 11.5,
      "frameId": "K0038",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "入口",
      "end": 1.7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.7,
      "label": "点击创建",
      "end": 2.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.5,
      "label": "命名表单",
      "end": 4.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.5,
      "label": "确认创建",
      "end": 5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5,
      "label": "创建成功",
      "end": 6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6,
      "label": "开始对话",
      "end": 7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7,
      "label": "机器人回复",
      "end": 9.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9.5,
      "label": "资料页",
      "end": 11.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11.5,
      "label": "返回入口",
      "end": 12.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 12.0,
  "fontFamily": "Arial, sans-serif"
}
```
