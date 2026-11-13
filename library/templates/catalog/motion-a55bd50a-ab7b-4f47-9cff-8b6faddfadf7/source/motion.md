# Build Live Apps

把一个临时生成的工具变成团队可以访问的应用。影片在预览之后继续走到权限、地址和真正打开的结果。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 24.266667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 6.2,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Build Live Apps",
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
        "title": "Build Live Apps",
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

## 一个请求，带出完整的准备过程

输入具体工具需求后，展示应用、数据库、访问控制、托管与检查等步骤。各项按顺序进入运行与完成，不能先出现成品再补一串装饰性勾选。

说明页用白底与简洁无衬线字，检查项可用深底和清楚的状态符号；进入应用预览后保留它自己的深色空间布局。

## 预览先说明应用能做什么

完整工具出现后，选一个与请求直接相关的功能，例如给新人安排座位。预览里的对象与任务结果保持一致，让发布的内容有明确含义。

```motion-demo
{
  "id": "clip-2",
  "title": "预览先说明应用能做什么",
  "src": "demos/clip-2.html",
  "duration": 5,
  "status": "authored",
  "description": "10–15 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 发布框要让地址和权限都看得见

点击发布后，地址、访问对象与确认按钮在同一个对话框中可读。确认后出现链接，再打开线上应用；前后使用同一名称和同一内容。

| 发布前 | 发布后 |
| --- | --- |
| 预览内容 | 同一应用正式打开 |
| 访问对象 | 对应的共享范围 |
| 应用地址 | 清楚的结果链接 |
| 确认动作 | 明确完成反馈 |

## 迁移到另一个团队工具

替换需求、应用数据和使用动作，并更新地址与权限文案。保留准备、预览、授权发布、链接打开的完整路径，不以一张成功提示代替最后结果。

## 配色与字形

无衬线界面文字与清晰大小层级。

#f5f5f1 · #202122 · #9966cc · #f1ba8a · #9ab8ad

## 元素与制作规则

请求框 / 检查步骤 / 应用预览 / 座位图 / 发布权限框 / 链接 / 线上应用

- 构建基础设施步骤先逐项完成，之后出现应用预览
- 发布对话框明确地址与可访问范围，确认后才出现可打开链接
- 同一座位图从预览进入线上应用，内容身份保持

## 内容替换

- 可迁移为团队工具发布，保留检查→预览→权限→链接→使用
- 应用内容可换，权限确认不可省略为装饰按钮

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Cursor",
  "id": "V284",
  "palette": [
    "#f5f5f1",
    "#202122",
    "#9966cc",
    "#f1ba8a",
    "#9ab8ad"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "Build Live Apps",
  "objects": [
    "请求框",
    "检查步骤",
    "应用预览",
    "座位图",
    "发布权限框",
    "链接",
    "线上应用"
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
      "timeSeconds": 5.0,
      "frameId": "K0008",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 10.0,
      "frameId": "K0021",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/39d985266aa32b3e23cfabd442fb937748250bfc85c1b81837902992c7cb9720",
      "timeSeconds": 15.0,
      "frameId": "K0036",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 18.0,
      "frameId": "K0042",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 22.0,
      "frameId": "K0053",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "任务输入",
      "end": 2.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.0,
      "label": "应用分享主张",
      "end": 5.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5.0,
      "label": "起点来源",
      "end": 8.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8.0,
      "label": "部署步骤",
      "end": 10.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10.0,
      "label": "任务完成",
      "end": 13.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13.0,
      "label": "预览座位图",
      "end": 15.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15.0,
      "label": "发布权限",
      "end": 17.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 17.0,
      "label": "确认发布",
      "end": 18.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18.0,
      "label": "链接反馈",
      "end": 20.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 20.0,
      "label": "线上成果",
      "end": 22.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 22.0,
      "label": "品牌",
      "end": 24.266667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 24.266667,
  "fontFamily": "Arial, sans-serif"
}
```
