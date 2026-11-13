# Notion Skills — teach agents how your team works

从已有工作中生成技能，再分别展示团队共享与本地导出。两条分发路径围绕同一份文档展开。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 36.750217,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 7,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Turn your best work into a skill",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#2f91cb"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Turn your best work into a skill",
        "accent": "#2f91cb"
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

## 技能来源留在画面里

菜单与首次调用后打开技能文档，让名称和内容成为后续操作的共同参照。共享弹窗覆盖在文档上方，关闭后仍回到原内容。

![13.00s · 构图参考](assets/reference-3.webp)

## 共享与下载各讲清一个动作

先交代共享设置，再进入下载选项与确认。菜单选中态、弹窗标题和完成提示逐项接力；不要把权限设置与本地导出混在同一个难读的窗口里。

```motion-demo
{
  "id": "clip-2",
  "title": "共享与下载各讲清一个动作",
  "src": "demos/clip-2.html",
  "duration": 16,
  "status": "authored",
  "description": "13–29 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 终端调用承接刚刚导出的包

切到终端后使用同一技能名称。浅色文档与黑底终端之间保持短暂停顿，命令完成后结束，不再引入新文件或新工作流。

## 工具演示保持直白

白色工作区、细边框、中粗无衬线标题和小号菜单文字构成主风格。淡蓝、杏黄、紫色背景用于章节变化，深色等宽文字用于命令；始终把当前选择放在清楚的局部近景里。

## 换成另一份可分发内容

将技能名称、文档正文、共享对象、下载文件和命令一起替换。规则包、研究模板或设计指南都可以使用这一结构，但要保留清楚的编辑源与消费入口。

## 配色与字形

无衬线中粗主标题；细边框界面与小号功能文字。

#ffffff · #191919 · #2f91cb · #f2e1bb · #aea0ce

## 元素与制作规则

技能菜单 / 输入框 / 文档 / 共享弹窗 / 下载菜单 / 终端

- 团队共享与本地导出是两条分发路径，分别用弹窗说明后再汇合到使用。
- 交互近景跟随当前设置，保持文档作为来源。

## 内容替换

- 可换规则包；保留编辑源、共享权限与消费入口。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Notion",
  "id": "V307",
  "palette": [
    "#ffffff",
    "#191919",
    "#2f91cb",
    "#f2e1bb",
    "#aea0ce"
  ],
  "typography": "无衬线中粗主标题；细边框界面与小号功能文字",
  "sample": "Turn your best work into a skill",
  "objects": [
    "技能菜单",
    "输入框",
    "文档",
    "共享弹窗",
    "下载菜单",
    "终端"
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
      "timeSeconds": 7.000041335978836,
      "frameId": "K0011",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 13.000076766817838,
      "frameId": "K0025",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 16.00009448223734,
      "frameId": "K0029",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 26.000153533635675,
      "frameId": "K0049",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 35.00020667989418,
      "frameId": "K0067",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "主张",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "技能菜单",
      "end": 7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7,
      "label": "发起调用",
      "end": 10,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10,
      "label": "共享主张",
      "end": 13,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13,
      "label": "技能文档",
      "end": 16,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 16,
      "label": "共享设置",
      "end": 20,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 20,
      "label": "下载选项",
      "end": 26,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 26,
      "label": "下载确认",
      "end": 29,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 29,
      "label": "终端调用",
      "end": 35,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 35,
      "label": "品牌",
      "end": 36.750217,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 36.750217,
  "fontFamily": "Arial, sans-serif"
}
```
