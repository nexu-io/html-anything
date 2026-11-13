# GPT-Live-1.1 语音更新

把不同声音编排成一场点名：镜头寻找手机组，字幕给出回应，最后一台单独出现。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 40.733333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 10.3,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "ChatGPT Voice",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#8d8be7"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "ChatGPT Voice",
        "accent": "#8d8be7"
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

## 手机像演员一样站位

暖色台面上成对摆放手机，顶部和底部用舞台色块框住画面。不同语音球采用独立颜色，字幕用小号无衬线，固定在下方。

![0.00s · 构图参考](assets/reference-1.webp)

## 每次横移只介绍一组

镜头先到位，再让当前手机回应。下一组回应前做同方向横移，手机与字幕同步切换；其余组保持安静。

```motion-demo
{
  "id": "clip-2",
  "title": "每次横移只介绍一组",
  "src": "demos/clip-2.html",
  "duration": 19,
  "status": "authored",
  "description": "4–23 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 最后一台改变重复节奏

前面的成对排列建立预期，末段改成单台，给它单独的停留，再收束为功能名。

## 角色和对白可以替换

可改为多种助手、服务或人物介绍。先安排每次问答和最后的特殊角色，再配字幕与声音；保持每一组的颜色和身份一致。

## 配色与字形

暖色舞台俯视、手机成对排列、底部对话字幕。

#f3d4c3 · #28211f · #8d8be7 · #c2decf · #7d2426

## 元素与制作规则

舞台台面 / 手机对 / 彩色语音球 / 字幕 / 横移镜头

- 通过重复横移寻找不同手机组，像演员点名一样介绍声音。
- 各手机球体颜色对应不同声音组，字幕体现轮流回应。
- 末段从成对到单台形成节奏反差，再切白底落版。

## 内容替换

- 可用于多角色／多功能介绍；保留轮流回应和最后特别角色。
- 字幕须与声音时序另行对齐。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "OpenAI",
  "id": "V014",
  "palette": [
    "#f3d4c3",
    "#28211f",
    "#8d8be7",
    "#c2decf",
    "#7d2426"
  ],
  "typography": "暖色舞台俯视、手机成对排列、底部对话字幕",
  "sample": "ChatGPT Voice",
  "objects": [
    "舞台台面",
    "手机对",
    "彩色语音球",
    "字幕",
    "横移镜头"
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
      "timeSeconds": 4.0,
      "frameId": "K0005",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 10.0,
      "frameId": "K0021",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 23.0,
      "frameId": "K0068",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 30.0,
      "frameId": "K0090",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 35.0,
      "frameId": "K0109",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "两台手机建立",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "开始点名",
      "end": 10,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10,
      "label": "横移寻找下一对",
      "end": 16,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 16,
      "label": "更多声音回应",
      "end": 23,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 23,
      "label": "发现缺席者",
      "end": 30,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 30,
      "label": "单台手机回应",
      "end": 35,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 35,
      "label": "功能与品牌落版",
      "end": 40.733333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 40.733333,
  "fontFamily": "Arial, sans-serif"
}
```
