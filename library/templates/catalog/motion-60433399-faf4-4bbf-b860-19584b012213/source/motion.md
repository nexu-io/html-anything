# Computer — effort controls in the model selector

围绕一个强度滑杆演示四个档位。填充、档名和说明同步变化，其他界面保持稳定。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 11.0,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 3,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Effort controls",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#2e8c8a"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Effort controls",
        "accent": "#2e8c8a"
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

## 把注意力留在同一控件

输入栏出现后打开强度菜单，镜头只需容纳菜单、指针和必要上下文。滑杆轨道固定，指针逐档移动；每到一档，立即更新名称与模型说明。

```motion-demo
{
  "id": "clip-1",
  "title": "把注意力留在同一控件",
  "src": "demos/clip-1.html",
  "duration": 5.5,
  "status": "authored",
  "description": "3–8.5 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 档位要有可读的停顿

Light、Standard、High、Ultra 依次经过，每档留出短暂停顿。激活标记、已填充长度和文字属于同一个状态，不能先后错开成三个独立动画。

| 变化项 | 约束 |
| --- | --- |
| 轨道与菜单 | 位置和尺寸固定 |
| 滑块与填充 | 落在同一档位 |
| 名称与说明 | 随档位同时替换 |
| 指针 | 负责移动和选择，不遮住档名 |

## 深色舞台与浅色菜单

深蓝背景承接浅色控件，青绿只标记当前档位。品牌标题使用衬线，菜单与解释文字用无衬线；轨道附近保持留白，标签对齐各档中心。

## 也可以演示质量、预算或速度

替换四个档名和解释即可迁移，但每个档位必须有明确语义。若改成连续数值控制，应改用连续读数，不保留误导性的分档停顿。

## 配色与字形

衬线主张标题搭配无衬线界面文字；大留白、细边框。

#121727 · #f5f7f6 · #2e8c8a · #d19e75 · #ffffff

## 元素与制作规则

输入栏 / 强度菜单 / 分档滑杆 / 模型说明 / 指针

- 一个滑杆逐档增加，档名、模型说明与填充长度同步变化。
- 先打开菜单再调节，变化范围局限于同一控件。

## 内容替换

- 可改成质量、速度或预算档位；保留分档映射而非只改颜色。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Perplexity",
  "id": "V269",
  "palette": [
    "#121727",
    "#f5f7f6",
    "#2e8c8a",
    "#d19e75",
    "#ffffff"
  ],
  "typography": "衬线主张标题搭配无衬线界面文字；大留白、细边框",
  "sample": "Effort controls",
  "objects": [
    "输入栏",
    "强度菜单",
    "分档滑杆",
    "模型说明",
    "指针"
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
      "frameId": "K0009",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 4.0,
      "frameId": "K0017",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 5.0,
      "frameId": "K0021",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 7.0,
      "frameId": "K0029",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 8.5,
      "frameId": "K0035",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "品牌标记",
      "end": 2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2,
      "label": "输入栏",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "打开强度菜单",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "Light",
      "end": 5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5,
      "label": "Standard",
      "end": 6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6,
      "label": "High",
      "end": 7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7,
      "label": "Ultra",
      "end": 8.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8.5,
      "label": "品牌收尾",
      "end": 11.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 11.0,
  "fontFamily": "Georgia, serif"
}
```
