# Linear — The product development system for teams and…

从一条任务支线拉远到整个开发网络，再回到清楚的共同主干。局部与整体的切换说明工作如何汇聚。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 30.0,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 11,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Product development system",
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
        "title": "Product development system",
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

## 让支线先有明确归属

开场先看问题编号与分支，标签贴近自己的节点。镜头拉远时保留分支方向，逐渐揭示它们汇入同一主干；不要让编号与线路分离漂浮。

## 系统视角之后补一个局部例子

多个工作区出现后回到分支细节，说明网络由可理解的任务组成。收拢段减少细节，保留汇聚方向，为品牌结束页形成自然中心。

## 细线网络要有主次

接近黑色的舞台上，普通支线用暗灰，主干和当前节点提高亮度，冷紫只作小范围强调。编号采用小号等宽或紧凑无衬线，主张用较大无衬线；线条密集区减少标签，避免全部等亮。

## 可换成任何有汇聚关系的流程

将问题编号、工作区和节点替换为目标业务。先确定共同主干，再安排分支与层级；品牌收尾沿用汇聚中心，避免突然切到另一个视觉坐标。

## 配色与字形

无衬线中粗主标题；细边框界面与小号功能文字。

#090a0c · #e9e9e8 · #6970c6 · #30333c · #ffffff

## 元素与制作规则

主干路径 / 支线 / 问题编号 / 工作区面板

- 多条任务支线汇入共同主干；镜头拉远让局部关系成为整体网络。
- 问题标签附着在节点上，不能脱离支线漂浮。

## 内容替换

- 可换流程网络；保留聚合方向与节点归属。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Linear",
  "id": "V244",
  "palette": [
    "#090a0c",
    "#e9e9e8",
    "#6970c6",
    "#30333c",
    "#ffffff"
  ],
  "typography": "无衬线中粗主标题；细边框界面与小号功能文字",
  "sample": "Product development system",
  "objects": [
    "主干路径",
    "支线",
    "问题编号",
    "工作区面板"
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
      "timeSeconds": 5.0,
      "frameId": "K0013",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 11.0,
      "frameId": "K0020",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 17.0,
      "frameId": "K0037",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 22.0,
      "frameId": "K0056",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 25.0,
      "frameId": "K0059",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "分支近景",
      "end": 5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5,
      "label": "网络拉远",
      "end": 11,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11,
      "label": "系统主张",
      "end": 13,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13,
      "label": "多个工作区",
      "end": 17,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 17,
      "label": "分支细节",
      "end": 22,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 22,
      "label": "收拢",
      "end": 25,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 25,
      "label": "品牌",
      "end": 30.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 30.0,
  "fontFamily": "Arial, sans-serif"
}
```
