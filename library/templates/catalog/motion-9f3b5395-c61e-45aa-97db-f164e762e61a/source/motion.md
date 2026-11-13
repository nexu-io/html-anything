# Claude Design — prototypes and slides by chat

需求、成果和修改始终保持对应。镜头先交代工作区，再靠近当前操作，最后用成果墙展示覆盖范围。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 81.5,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 12.25,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Design",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#c4755c"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Design",
        "accent": "#c4755c"
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

## 让工具始终围绕成果展开

大标题衬线与界面无衬线分工；暖白工作区、浅灰工具栏、陶土色操作按钮。

先让用户输入意图，再展示成果，最后演示局部修改与导出；成果出现必须晚于提交动作。

![59.00s · 构图参考](https://r.open-design.ai/files/1b8a4aaf2790fd73ca0b5c7bd74fff663687d740ac7d82a22671e3a798ecb25e)

## 用镜头推近当前操作

缩放镜头跟随当前操作区域：全局布局→工具按钮→结果细节；指针与镜头不同时大幅移动。

参数面板附着在成果画布一侧，修改参数影响同一对象；成果墙只用于段落交接，不把不同工程关联为同一对象。

```motion-demo
{
  "id": "clip-2",
  "title": "用镜头推近当前操作",
  "src": "demos/clip-2.html",
  "duration": 9.8,
  "status": "authored",
  "description": "14.7–24.5 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 用短操作回合组成长片

按需求输入、生成成果、参数调整、批注修改、导出组织。每次放大一个操作，成果墙只在阶段结束后出现。

| 时间 | 段落 |
|---|---|
| 0.00–2.00s | 入口标题 |
| 2.00–8.30s | 输入需求 |
| 8.30–14.70s | 发送与成果出现 |
| 14.70–21.00s | 添加参数控制 |
| 21.00–28.00s | 调整地球组件 |
| 28.00–31.00s | 成果墙 |
| 31.00–39.00s | 移动端原型 |
| 39.00–47.00s | 批注与修改 |
| 47.00–59.00s | 工具栏功能巡览 |
| 59.00–70.00s | 批注与导出 |
| 70.00–77.00s | 成果回顾 |
| 77.00–81.50s | 品牌收尾 |

## 替换成果，保留操作因果

迁移到其他创作工具时保留输入→生成→修改→导出的证据链。

成果图、输入文案、按钮标签可替换；每个结果须对应前一条请求。

长片以多个短操作回合组成；不要把全部 81 秒压成一个弹窗动画。

## 配色与字形

大标题衬线与界面无衬线分工；暖白工作区、浅灰工具栏、陶土色操作按钮。

#f4f2eb · #20201d · #c4755c · #d8d8cd · #ffffff

## 元素与制作规则

工作区容器 / 对话面板 / 成果画布 / 控件工具栏 / 参数面板 / 指针

- 先让用户输入意图，再展示成果，最后演示局部修改与导出；成果出现必须晚于提交动作。
- 缩放镜头跟随当前操作区域：全局布局→工具按钮→结果细节；指针与镜头不同时大幅移动。
- 参数面板附着在成果画布一侧，修改参数影响同一对象；成果墙只用于段落交接，不把不同工程关联为同一对象。

## 内容替换

- 迁移到其他创作工具时保留输入→生成→修改→导出的证据链。
- 成果图、输入文案、按钮标签可替换；每个结果须对应前一条请求。
- 长片以多个短操作回合组成；不要把全部 81 秒压成一个弹窗动画。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Anthropic",
  "id": "V002",
  "palette": [
    "#f4f2eb",
    "#20201d",
    "#c4755c",
    "#d8d8cd",
    "#ffffff"
  ],
  "typography": "大标题衬线与界面无衬线分工；暖白工作区、浅灰工具栏、陶土色操作按钮",
  "sample": "Design",
  "objects": [
    "工作区容器",
    "对话面板",
    "成果画布",
    "控件工具栏",
    "参数面板",
    "指针"
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
      "path": "https://r.open-design.ai/files/6db4a4790b1ead7c9331885767a282d3f1cf3d1668593cd1ed0f93b999cd9ac1",
      "timeSeconds": 8.333333333333334,
      "frameId": "K0024",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 21.0,
      "frameId": "K0070",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 39.0,
      "frameId": "K0129",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/1b8a4aaf2790fd73ca0b5c7bd74fff663687d740ac7d82a22671e3a798ecb25e",
      "timeSeconds": 59.0,
      "frameId": "K0201",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 77.0,
      "frameId": "K0265",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "入口标题",
      "end": 2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2,
      "label": "输入需求",
      "end": 8.3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8.3,
      "label": "发送与成果出现",
      "end": 14.7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 14.7,
      "label": "添加参数控制",
      "end": 21,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 21,
      "label": "调整地球组件",
      "end": 28,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 28,
      "label": "成果墙",
      "end": 31,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 31,
      "label": "移动端原型",
      "end": 39,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 39,
      "label": "批注与修改",
      "end": 47,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 47,
      "label": "工具栏功能巡览",
      "end": 59,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 59,
      "label": "批注与导出",
      "end": 70,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 70,
      "label": "成果回顾",
      "end": 77,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 77,
      "label": "品牌收尾",
      "end": 81.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 81.5,
  "fontFamily": "Georgia, serif"
}
```
