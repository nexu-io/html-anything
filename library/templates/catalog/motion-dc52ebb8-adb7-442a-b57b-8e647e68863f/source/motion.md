# Apple｜跨设备剪贴板

通过同一段文字在两台设备中的出现，说明跨端衔接。设备稳定，操作变化集中在选择、焦点与粘贴。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 5.0,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 2,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Across devices",
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
        "title": "Across devices",
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

## 来源和目标同时可见

手机与电脑保持各自清楚的阅读区，先在手机选择文字，再把注意力转向电脑的目标输入框。选择高亮与目标插入点承担视觉引导。

## 复制之后才出现目标文本

复制动作结束后，电脑输入区获得焦点，再出现相同内容。文本长度、关键词和断句保持对应；通过清楚的先后顺序建立联系，设备外框只需轻微调整构图。

## 少装饰，突出两处文字

使用浅底、深色无衬线和克制的选中高亮。设备边框与窗口线条轻量，文字大小足以在双设备构图里阅读；蓝、杏或紫色只用于焦点和辅助环境。

## 换内容时保留一眼能认出的关键词

可以换笔记、邮件或设计需求。选择一段短文本，让来源和目标都能容纳；同步更换两端应用名称与内容，避免粘贴结果和来源不一致。

## 配色与字形

无衬线中粗主标题；细边框界面与小号功能文字。

#ffffff · #191919 · #2f91cb · #f2e1bb · #aea0ce

## 元素与制作规则

手机 / 电脑 / 选中文本 / 目标文本框

- 手机文本为输入来源，电脑文档为目标；核心变化在文本选择与粘贴，设备外框基本稳定。
- 不应为强调跨端而编造大幅飞行轨迹。

## 内容替换

- 换内容和应用可复用；保留同一文本从来源到目标的对应。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Apple",
  "id": "V289",
  "palette": [
    "#ffffff",
    "#191919",
    "#2f91cb",
    "#f2e1bb",
    "#aea0ce"
  ],
  "typography": "无衬线中粗主标题；细边框界面与小号功能文字",
  "sample": "Across devices",
  "objects": [
    "手机",
    "电脑",
    "选中文本",
    "目标文本框"
  ],
  "frames": [
    {
      "path": "https://r.open-design.ai/files/92779af717ff4da0ad4c1e3ba60de6318b42cabf992dd0a7fe78aff70ab57677",
      "timeSeconds": 0.0,
      "frameId": "K0001",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/3042dc15f144f9d0aa5ce0cf97b1255d088820836fa23dad8275ca002818d533",
      "timeSeconds": 1.0,
      "frameId": "K0002",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/f1451295a2c21e3f92b724de8a31fff5a9490587a46cf26a69ab2da45898ea8f",
      "timeSeconds": 2.0,
      "frameId": "K0003",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/cda3d0e0b01a838ffb71ff6083bec696c814255ac2d673f6c9137c8c4538d95c",
      "timeSeconds": 3.0,
      "frameId": "K0004",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/4086d3c3415f3419ed6410cd54bf3740ca16fe579f70374f664ca8cc3132fff4",
      "timeSeconds": 4.733333333333333,
      "frameId": "K0006",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "双设备",
      "end": 0.7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.7,
      "label": "手机文本选择",
      "end": 2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2,
      "label": "复制操作",
      "end": 3.3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.3,
      "label": "桌面编辑焦点",
      "end": 4.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.5,
      "label": "文本出现",
      "end": 5.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 5.0,
  "fontFamily": "Arial, sans-serif"
}
```
