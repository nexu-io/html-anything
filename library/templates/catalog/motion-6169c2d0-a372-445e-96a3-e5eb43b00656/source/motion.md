# Manus Skills｜工作流技能

用一套技能库说明工作流如何被保存、导入和再次使用。多种入口最终都落到同一种可启用能力。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 32.666667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 5.2,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Manus Skills",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#538cbe"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Manus Skills",
        "accent": "#538cbe"
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

## 技能库是固定落点

技能卡显示名称、简短用途与启用状态，卡片尺寸和开关位置一致。用白色卡片、浅灰背景与单一强调色组织界面；名称略粗，说明字重常规。

## 不同导入方式，回到同一个结果

从会话整理、文件上传、链接或仓库导入时，各入口可以使用不同对话框。完成后都返回技能库，新增或更新同一张技能卡，而不是停在上传成功提示。

| 入口 | 中间动作 | 最终落点 |
| --- | --- | --- |
| 已有会话 | 整理为可复用步骤 | 技能卡 |
| 本地文件 | 选择文件并导入 | 技能卡 |
| 链接或仓库 | 填写来源并确认 | 技能卡 |

## 开关与再次使用要连起来

启用时让开关变化明确，再回到任务入口使用这项能力。若展示多项技能，不必重复完整导入，只保留不同来源的关键动作。

换业务时替换技能名称、用途和任务结果。保留导入、入库、启用、复用这条路径，不能只做一个漂亮的卡片列表。

## 配色与字形

无衬线界面文字与清晰大小层级。

#f7f8f6 · #222522 · #538cbe · #b6cbb9 · #ffffff

## 元素与制作规则

技能列表 / 开关 / 会话成果 / 导入弹窗 / 复用结果

- 好会话先成为技能条目，再进入可启用列表
- 多种导入方式共享同一目录，入口变化不改变对象角色
- 末段输出多种结果说明一条技能可重复使用

## 内容替换

- 可迁移为可复用工作流库，保留创建→归档→调用
- 替换技能名与成果，不把导入弹窗误当最终成果

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Manus",
  "id": "V233",
  "palette": [
    "#f7f8f6",
    "#222522",
    "#538cbe",
    "#b6cbb9",
    "#ffffff"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "Manus Skills",
  "objects": [
    "技能列表",
    "开关",
    "会话成果",
    "导入弹窗",
    "复用结果"
  ],
  "frames": [
    {
      "path": "https://r.open-design.ai/files/47d65a31d9806ee1aa371ac3c5096f3e74bcf96f63e2b5ca607f5c48911d3f16",
      "timeSeconds": 0.0,
      "frameId": "K0001",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-2.jpg",
      "timeSeconds": 4.0,
      "frameId": "K0012",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 10.0,
      "frameId": "K0023",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 12.0,
      "frameId": "K0029",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 22.0,
      "frameId": "K0061",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 30.0,
      "frameId": "K0086",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "技能列表",
      "end": 2.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.0,
      "label": "启用技能",
      "end": 4.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.0,
      "label": "会话转技能",
      "end": 7.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7.0,
      "label": "添加入口",
      "end": 10.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10.0,
      "label": "技能入库",
      "end": 12.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12.0,
      "label": "文件导入",
      "end": 15.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15.0,
      "label": "链接添加",
      "end": 22.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 22.0,
      "label": "仓库导入",
      "end": 26.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 26.0,
      "label": "重复使用",
      "end": 30.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 30.0,
      "label": "品牌",
      "end": 32.666667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 32.666667,
  "fontFamily": "Arial, sans-serif"
}
```
