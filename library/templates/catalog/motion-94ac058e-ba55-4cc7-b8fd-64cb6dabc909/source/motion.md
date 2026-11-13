# Grok Bot · 对话内填表与登录

让代理在需要用户输入时停下来，得到输入后继续完成任务。等待和成功是两个有明确边界的状态。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 19.166667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 4.3,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Sign in to continue",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#ef9768"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Sign in to continue",
        "accent": "#ef9768"
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

## 橙色表示等待，绿色表示完成

白手机置于暖橙光晕里，表单文字用高对比无衬线。任务请求、待操作卡与 Continue 按钮沿竖向排列，成功回执改用绿色。

## 把认证步骤完整交给用户

待操作卡展开成登录表单，再唤起密码管理器选项。选定后回填占位账号和掩码密码，提交动作结束后才显示成功。

```motion-demo
{
  "id": "clip-2",
  "title": "把认证步骤完整交给用户",
  "src": "demos/clip-2.html",
  "duration": 9,
  "status": "authored",
  "description": "4–13 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 回执回应最初那件事

成功卡概括完成的任务和关键结果。任务名、日期或对象在请求与回执之间保持一致，最后才切到品牌。

## 适配其他需要授权的工作流

可换成支付确认、资源访问或发布审批。更换表单字段和回执内容，保留暂停、用户输入、恢复执行的次序。

## 配色与字形

橙色光晕、白手机、认证表单与绿色提交状态。

#fff6ee · #1f2021 · #ef9768 · #65bc83 · #e4e4e4

## 元素与制作规则

请求 / 待操作卡 / 继续按钮 / 登录表单 / 密码管理器 / 提交回执

- 代理遇到认证才转给用户；用户提供输入后流程恢复。
- 橙色等待态转为绿色完成态，信息内容持续对应同一任务。
- 不得展示真实密码，迁移使用占位输入。

## 内容替换

- 适用于需要授权的工作流；保留停下→用户确认→恢复→回执。
- 认证表单内容替换，成功态不能早于提交动作。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "xAI / Grok",
  "id": "V025",
  "palette": [
    "#fff6ee",
    "#1f2021",
    "#ef9768",
    "#65bc83",
    "#e4e4e4"
  ],
  "typography": "橙色光晕、白手机、认证表单与绿色提交状态",
  "sample": "Sign in to continue",
  "objects": [
    "请求",
    "待操作卡",
    "继续按钮",
    "登录表单",
    "密码管理器",
    "提交回执"
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
      "frameId": "K0004",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 7.0,
      "frameId": "K0018",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 9.0,
      "frameId": "K0025",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 13.0,
      "frameId": "K0035",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 16.0,
      "frameId": "K0041",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "完成结果预告",
      "end": 1,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1,
      "label": "提出任务",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "需要用户操作",
      "end": 7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7,
      "label": "打开登录表单",
      "end": 9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9,
      "label": "密码管理器选项",
      "end": 11,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11,
      "label": "填写与提交",
      "end": 13,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13,
      "label": "绿色回执",
      "end": 16,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 16,
      "label": "品牌",
      "end": 19.166667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 19.166667,
  "fontFamily": "Arial, sans-serif"
}
```
