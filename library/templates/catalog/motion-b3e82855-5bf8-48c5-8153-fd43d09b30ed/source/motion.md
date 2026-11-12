# Linear Agent — ask anything, command everything

让代理在项目上下文里回答问题，再走到具体操作结果。镜头在项目、依据和对话之间移动，而不是不断更换工作场景。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 54.85,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 13,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "At your command",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#6970c6"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "At your command",
        "accent": "#6970c6"
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

## 项目先成为稳定背景

先建立项目容器，再进入代理输入和回答。斜视构图保持一致方向，镜头靠近当前操作区时仍保留项目标题或一部分侧栏，说明对话属于同一工作区。

![0.00s · 构图参考](assets/reference-1.jpg)

## 追问之后展示依据

回答列表之后进入追问，再给项目说明和关系视图。文档与关系图分别承担内容与连接依据，镜头切换让当前问题和对应材料保持相邻。

```motion-demo
{
  "id": "clip-2",
  "title": "追问之后展示依据",
  "src": "demos/clip-2.html",
  "duration": 25,
  "status": "authored",
  "description": "13–38 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 由回答走到实际动作

拉回工作区全景后，展示执行结果清单。结果晚于相关问答与依据出现，完成项用稳定状态承接，尾段再落产品主张。

| 时间 | 段落 |
|---|---|
| 0.00–5.00s | 项目界面 |
| 5.00–13.00s | 代理输入 |
| 13.00–21.00s | 回答列表 |
| 21.00–25.00s | 追问 |
| 25.00–30.00s | 项目说明 |
| 30.00–38.00s | 关系视图 |
| 38.00–43.00s | 工作区全景 |
| 43.00–48.00s | 动作结果 |
| 48.00–52.00s | 主张 |
| 52.00–54.85s | 品牌 |

## 暗色空间靠明暗分出前后

黑灰背景、较亮的工作面板与冷紫局部强调构成层次。主标题用中粗无衬线，列表与文档正文用常规字重；斜角和景深只辅助焦点，内容区域不能因此失去可读性。

## 迁移到另一种项目系统

替换项目、知识材料、问题和动作结果，让它们属于同一业务。关系图节点与文档名称对应实际项目对象，最后的结果清单承接开头任务。

## 配色与字形

无衬线中粗主标题；细边框界面与小号功能文字。

#090a0c · #e9e9e8 · #6970c6 · #30333c · #ffffff

## 元素与制作规则

项目容器 / 代理对话 / 知识文档 / 关系图 / 结果清单

- 斜视镜头在项目和代理之间移动，用文档与关系图作为回答依据。
- 末尾列出执行结果，强调从问答到操作完成。

## 内容替换

- 可换产品管理系统；保留上下文→提问→依据→动作结果。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Linear",
  "id": "V240",
  "palette": [
    "#090a0c",
    "#e9e9e8",
    "#6970c6",
    "#30333c",
    "#ffffff"
  ],
  "typography": "无衬线中粗主标题；细边框界面与小号功能文字",
  "sample": "At your command",
  "objects": [
    "项目容器",
    "代理对话",
    "知识文档",
    "关系图",
    "结果清单"
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
      "path": "assets/reference-2.jpg",
      "timeSeconds": 13.0,
      "frameId": "K0023",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 25.0,
      "frameId": "K0056",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 30.0,
      "frameId": "K0076",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 43.0,
      "frameId": "K0113",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 52.0,
      "frameId": "K0127",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "项目界面",
      "end": 5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5,
      "label": "代理输入",
      "end": 13,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13,
      "label": "回答列表",
      "end": 21,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 21,
      "label": "追问",
      "end": 25,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 25,
      "label": "项目说明",
      "end": 30,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 30,
      "label": "关系视图",
      "end": 38,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 38,
      "label": "工作区全景",
      "end": 43,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 43,
      "label": "动作结果",
      "end": 48,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 48,
      "label": "主张",
      "end": 52,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 52,
      "label": "品牌",
      "end": 54.85,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 54.85,
  "fontFamily": "Arial, sans-serif"
}
```
