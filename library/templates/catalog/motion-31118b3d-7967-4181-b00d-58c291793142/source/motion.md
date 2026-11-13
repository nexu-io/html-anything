# AI Gateway Virtual Models

一句话先说明能力，再给任务和模型的对应表或命令。避免连续堆叠说明句，每个概念后紧跟一个具体用法。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 41.06674,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 5,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Virtual Models",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#c1c1c1"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Virtual Models",
        "accent": "#c1c1c1"
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

## 短句与可执行例子交替出现

一句话先说明能力，再给任务和模型的对应表或命令。避免连续堆叠说明句，每个概念后紧跟一个具体用法。

| 时间 | 段落 |
|---|---|
| 0.00–4.00s | 发布短句 |
| 4.00–8.00s | 任务模型映射 |
| 8.00–11.00s | 调用命令 |
| 11.00–14.00s | 更新说明 |
| 14.00–18.00s | 编辑模型命令 |
| 18.00–24.00s | 传播到应用 |
| 24.00–28.00s | 费用信息 |
| 28.00–32.00s | 能力范围 |
| 32.00–39.00s | 创建流程 |
| 39.00–41.07s | 品牌 |

## 信息层级靠明暗与字体区分

主句亮白，解释句灰色；稳定路径、CLI 和数值用等宽字体。列表共享列宽，正在变化的一行提高亮度，其余行减弱。

## 把更新表现为局部字段变化

调用入口不变，只替换表格中的模型字段；命令逐字输入完成后，再看到映射更新。固定左侧名称能帮助理解稳定入口。

```motion-demo
{
  "id": "clip-3",
  "title": "把更新表现为局部字段变化",
  "src": "demos/clip-3.html",
  "duration": 4.5,
  "status": "authored",
  "description": "13–17.5 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 换主题时保留稳定键与可变值

可迁移到路由、别名或配置管理。更换命令与字段，同时保留“统一名称—局部更新—所有调用生效”的叙述。

## 配色与字形

黑白极简；说明用无衬线，模型路由和命令用等宽字。。

#000000 · #ffffff · #c1c1c1 · #737373 · #252525

## 元素与制作规则

发布文案 / 任务模型对应表 / 命令行 / 配置表单

- 一句话先说明能力，再给任务和模型的对应表或命令。避免连续堆叠说明句，每个概念后紧跟一个具体用法。
- 主句亮白，解释句灰色；稳定路径、CLI 和数值用等宽字体。列表共享列宽，正在变化的一行提高亮度，其余行减弱。
- 调用入口不变，只替换表格中的模型字段；命令逐字输入完成后，再看到映射更新。固定左侧名称能帮助理解稳定入口。

## 内容替换

- 使用目标产品真实命令与字段，保持一处更新的叙事逻辑。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Vercel",
  "id": "V279",
  "palette": [
    "#000000",
    "#ffffff",
    "#c1c1c1",
    "#737373",
    "#252525"
  ],
  "typography": "黑白极简；说明用无衬线，模型路由和命令用等宽字。",
  "sample": "Virtual Models",
  "objects": [
    "发布文案",
    "任务模型对应表",
    "命令行",
    "配置表单"
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
      "timeSeconds": 8.000014285714286,
      "frameId": "K0009",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 14.000025,
      "frameId": "K0017",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 18.000032142857144,
      "frameId": "K0023",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 28.00005,
      "frameId": "K0036",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 39.00006964285714,
      "frameId": "K0056",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "发布短句",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "任务模型映射",
      "end": 8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8,
      "label": "调用命令",
      "end": 11,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11,
      "label": "更新说明",
      "end": 14,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 14,
      "label": "编辑模型命令",
      "end": 18,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18,
      "label": "传播到应用",
      "end": 24,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 24,
      "label": "费用信息",
      "end": 28,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 28,
      "label": "能力范围",
      "end": 32,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 32,
      "label": "创建流程",
      "end": 39,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 39,
      "label": "品牌",
      "end": 41.06674,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 41.06674,
  "fontFamily": "Arial, sans-serif"
}
```
