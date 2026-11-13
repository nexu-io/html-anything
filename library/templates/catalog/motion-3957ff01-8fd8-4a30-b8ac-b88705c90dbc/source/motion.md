# Linear Diffs — code review inside Linear

把评审演成四个有因果的动作：选择变更、比较差异、留下评论、提交评审。代码归属和评论位置必须清楚。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 51.883333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 10,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Experience the diff",
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
        "title": "Experience the diff",
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

## 先选变更，再进入差异

变更列表建立文件范围，点击后进入对应代码。文件名与选中状态持续可见，差异近景突出关键行，不同时滚动多个无关区域。

```motion-demo
{
  "id": "clip-1",
  "title": "先选变更，再进入差异",
  "src": "demos/clip-1.html",
  "duration": 14,
  "status": "authored",
  "description": "5–19 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 说明与代码并排，评论贴着目标行

说明文档位于代码旁边，解释当前变化。评论入口与相关代码行对齐，输入时保留被评论行；完成评论后再提交整次评审。

```motion-demo
{
  "id": "clip-2",
  "title": "说明与代码并排，评论贴着目标行",
  "src": "demos/clip-2.html",
  "duration": 21,
  "status": "authored",
  "description": "19–40 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 红绿颜色承担明确语义

红色表示删除，绿色表示新增，其余界面维持黑灰与冷紫层级。代码采用等宽字，说明和按钮使用无衬线；斜视镜头与缩放不改变文件和行的对应关系。

## 提交之后再给产品主张

提交按钮与完成状态是评审链条的终点。动作完成后收掉细节，让主张和品牌获得单独停留；不要在尾段又打开新文件。

## 也可以迁移到文稿或设计评审

保留对象选择、前后比较、定点评论和明确提交。替换差异内容时同步更换文件名、说明、评论和完成状态；不同颜色继续表达稳定的比较含义。

## 配色与字形

无衬线中粗主标题；细边框界面与小号功能文字。

#090a0c · #e9e9e8 · #6970c6 · #30333c · #ffffff

## 元素与制作规则

评审列表 / 代码差异 / 说明文档 / 评论 / 提交按钮

- 先选变更再看差异，评论定位到代码行，最后明确提交评审。
- 红绿差异色保留添加与删除语义，斜镜头不改变代码归属。

## 内容替换

- 可迁移审稿、设计差异或配置评审；保留选择→比较→评论→提交。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Linear",
  "id": "V249",
  "palette": [
    "#090a0c",
    "#e9e9e8",
    "#6970c6",
    "#30333c",
    "#ffffff"
  ],
  "typography": "无衬线中粗主标题；细边框界面与小号功能文字",
  "sample": "Experience the diff",
  "objects": [
    "评审列表",
    "代码差异",
    "说明文档",
    "评论",
    "提交按钮"
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
      "path": "https://r.open-design.ai/files/a02f05ef54478b95e71a76ab095cdd56611176cce444b60a9df7db08a00cd9c5",
      "timeSeconds": 10.0,
      "frameId": "K0031",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 19.0,
      "frameId": "K0067",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 28.0,
      "frameId": "K0103",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 40.0,
      "frameId": "K0128",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 50.0,
      "frameId": "K0149",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "评审入口",
      "end": 5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5,
      "label": "变更列表",
      "end": 10,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10,
      "label": "代码差异",
      "end": 15,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15,
      "label": "指南标签",
      "end": 19,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 19,
      "label": "说明与代码并置",
      "end": 28,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 28,
      "label": "变更近景",
      "end": 32,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 32,
      "label": "评论输入",
      "end": 40,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 40,
      "label": "提交评审",
      "end": 45,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 45,
      "label": "主张",
      "end": 50,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 50,
      "label": "品牌",
      "end": 51.883333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 51.883333,
  "fontFamily": "Arial, sans-serif"
}
```
