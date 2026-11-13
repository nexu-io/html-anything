# Branch｜分支会话

在同一段对话上打开第二条思路。分支出现之前，让观众明确它继承了什么；分支出现之后，再展示不同的继续方式。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 16.433333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 5.8,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Branch",
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
        "title": "Branch",
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

## 先完整看到原会话

原会话中保留任务、已完成成果和分支入口。文字使用清晰无衬线，浅色底与低对比消息块保持阅读秩序，强调色只落在新分支或新回复。

## 分叉时保留共同部分

点击分支后，将原会话留在一侧，新会话在另一侧展开。共同上下文的文本与顺序保持一致，新请求和新结果再逐步出现。

两栏宽度可以重分配，但不要同时重排两边全部内容。用一条短连接或共同标题交代来源，随后让新分支成为阅读中心。

## 替换两种真正不同的方向

例如同一品牌视频改为横版与方版，同一方案改为两个风格方向。共享部分不变，新增请求与成果分别对应各分支；不要只把两个窗口的标题换掉。

## 配色与字形

无衬线界面文字与清晰大小层级。

#f7f8f6 · #222522 · #538cbe · #b6cbb9 · #ffffff

## 元素与制作规则

原会话 / 分支节点 / 副本会话 / 继续输入

- 先显示可分支的历史位置，再复制共享上下文
- 两份会话并排短暂比较，选中一份后推近继续
- 标题重复呼应内容分叉，不用无关装饰

## 内容替换

- 可换为设计方案分支，保留共同起点与后续差异
- 替换分支内容，明确哪份是原始与新分支

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Manus",
  "id": "V234",
  "palette": [
    "#f7f8f6",
    "#222522",
    "#538cbe",
    "#b6cbb9",
    "#ffffff"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "Branch",
  "objects": [
    "原会话",
    "分支节点",
    "副本会话",
    "继续输入"
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
      "timeSeconds": 3.0,
      "frameId": "K0008",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 5.0,
      "frameId": "K0010",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 9.5,
      "frameId": "K0016",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 11.0,
      "frameId": "K0018",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 13.566666666666666,
      "frameId": "K0022",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "标题重复分身",
      "end": 3.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.0,
      "label": "原会话",
      "end": 5.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5.0,
      "label": "选择分支",
      "end": 7.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7.0,
      "label": "分成两份",
      "end": 9.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9.5,
      "label": "进入新分支",
      "end": 11.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11.0,
      "label": "继续输入",
      "end": 13.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13.5,
      "label": "品牌",
      "end": 16.433333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 16.433333,
  "fontFamily": "Arial, sans-serif"
}
```
