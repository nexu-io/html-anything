# Claude Code｜Agent View

用角色把散落的终端收拢成任务列表，让“管理多个代理”成为一个看得懂的动作。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 38.791667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 4.3,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Agent view",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#c87b60"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Agent view",
        "accent": "#c87b60"
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

## 散开的终端先形成问题

黑色终端分散在薄荷背景上，留出角色和套索的活动空间。角色用珊瑚像素色，套索用金色细线；任务文字保持等宽、短行。

## 套索牵动哪一个窗口，哪个窗口才移动

绳线端点跟随窗口，窗口朝统一集合点收拢。角色先做牵引，窗口随后响应，聚拢后再切换成列表。

```motion-demo
{
  "id": "clip-2",
  "title": "套索牵动哪一个窗口，哪个窗口才移动",
  "src": "demos/clip-2.html",
  "duration": 13,
  "status": "authored",
  "description": "6–19 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 从状态分组进入具体任务

列表先按 Needs input、Working、Completed 建立顺序，再进入一条需要回复的任务。处理完回到列表，让局部操作保留全局位置。

## 替换任务与角色

可更换任务名称、角色造型和状态配色。保留散落、聚合、分组、处理这四种关系；列表文案变长时增高行距，不压缩状态标签。

## 配色与字形

薄荷底、黑色终端、珊瑚像素角色与金色套索。

#b5ccc3 · #161815 · #c87b60 · #b99052 · #ecece4

## 元素与制作规则

终端窗口群 / 像素角色 / 套索路径 / 聚合列表 / 任务状态

- 角色牵引散落终端收拢，表达多任务进入同一视图。
- 聚合后按 Needs input、Working、Completed 分类，状态先于详情。
- 列表进入局部回复后返回全局，保持上下文。

## 内容替换

- 保留散落→聚合→分组→局部处理的结构。
- 替换任务名与角色，套索连接目标必须对应被收拢窗口。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Anthropic",
  "id": "V245",
  "palette": [
    "#b5ccc3",
    "#161815",
    "#c87b60",
    "#b99052",
    "#ecece4"
  ],
  "typography": "薄荷底、黑色终端、珊瑚像素角色与金色套索",
  "sample": "Agent view",
  "objects": [
    "终端窗口群",
    "像素角色",
    "套索路径",
    "聚合列表",
    "任务状态"
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
      "timeSeconds": 2.0,
      "frameId": "K0007",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 4.0,
      "frameId": "K0014",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 15.0,
      "frameId": "K0053",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 19.0,
      "frameId": "K0066",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 31.0,
      "frameId": "K0083",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "单会话终端",
      "end": 2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2,
      "label": "多个终端散开",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "角色与标题",
      "end": 6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6,
      "label": "角色用套索聚合",
      "end": 15,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15,
      "label": "统一任务列表",
      "end": 19,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 19,
      "label": "进入任务与回复",
      "end": 31,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 31,
      "label": "发布落版",
      "end": 38.791667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 38.791667,
  "fontFamily": "Arial, sans-serif"
}
```
