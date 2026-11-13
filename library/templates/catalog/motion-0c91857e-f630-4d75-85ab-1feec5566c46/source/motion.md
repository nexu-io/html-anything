# Higgsfield API｜多模型接口

把一个接口的价值讲成连接关系：从统一入口接到模型，再接到产品。接入步骤和价格信息各有自己的段落。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 48.416667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 10.2,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Higgsfield API",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#c7ff2a"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Higgsfield API",
        "accent": "#c7ff2a"
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

## 先画清入口与去向

接口核心保持在视觉中心，模型在一侧或外围，应用成果在另一层。连线有明确方向，节点出现后再接通；不要给没有依赖关系的对象任意连线。

深色底、荧光绿核心与白色短标签构成技术感。接口与命令可用等宽字体，说明标题用无衬线粗体，节点名称保持简短。

## 能力展示与价格比较分开

模型与成果用网络结构说明覆盖范围，价格段改用统一基线的柱或数字。比较对象、币种、计价单位和折扣条件放在同一组，不把价格柱当成性能柱。

## 接入步骤要能按顺序读

申请、取得密钥、选择模型、调用、部署按实际产品流程排列。每完成一步再点亮下一步，最后让多个应用围绕同一入口展开。

| 时间 | 段落 |
|---|---|
| 0.00–4.00s | 接口与连线 |
| 4.00–9.00s | 模型与成果 |
| 9.00–14.00s | 生成按钮 |
| 14.00–19.00s | 价格比较 |
| 19.00–25.00s | 折扣 |
| 25.00–32.00s | 接入步骤 |
| 32.00–39.00s | 应用实例 |
| 39.00–44.00s | 应用网络 |
| 44.00–48.42s | 接口收尾 |

## 迁移为新的开发平台

先列出真正支持的模型或服务，再选与它们对应的应用例子。接口地址、命令、接入条件与商业信息一并更换；保留单入口到多能力再到多成果的结构。

## 配色与字形

无衬线界面文字与清晰大小层级。

#090a08 · #ffffff · #c7ff2a · #dc028a · #8f74d7

## 元素与制作规则

API核心 / 模型名称 / 成果卡 / 价格柱 / 步骤清单 / 应用连线

- 从单入口连接多个模型，再接到多个产品成果
- 价格对比与折扣单独成段，不能把价格动画当使用体验
- 接入步骤逐项打勾，结尾多实例沿线路聚合

## 内容替换

- 迁移为多服务平台介绍，保留入口→能力→接入→应用结构
- 商业数字必须用新主题自己的可核实数据

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Higgsfield",
  "id": "V319",
  "palette": [
    "#090a08",
    "#ffffff",
    "#c7ff2a",
    "#dc028a",
    "#8f74d7"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "Higgsfield API",
  "objects": [
    "API核心",
    "模型名称",
    "成果卡",
    "价格柱",
    "步骤清单",
    "应用连线"
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
      "timeSeconds": 9.0,
      "frameId": "K0032",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 14.0,
      "frameId": "K0052",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/fbcf051e448ac66d0c5ac2b3be8740f63928d0eb0aa66529fdfa8b75ded28688",
      "timeSeconds": 25.0,
      "frameId": "K0093",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 32.0,
      "frameId": "K0121",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 44.0,
      "frameId": "K0176",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "接口与连线",
      "end": 4.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.0,
      "label": "模型与成果",
      "end": 9.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9.0,
      "label": "生成按钮",
      "end": 14.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 14.0,
      "label": "价格比较",
      "end": 19.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 19.0,
      "label": "折扣",
      "end": 25.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 25.0,
      "label": "接入步骤",
      "end": 32.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 32.0,
      "label": "应用实例",
      "end": 39.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 39.0,
      "label": "应用网络",
      "end": 44.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 44.0,
      "label": "接口收尾",
      "end": 48.416667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 48.416667,
  "fontFamily": "Arial, sans-serif"
}
```
