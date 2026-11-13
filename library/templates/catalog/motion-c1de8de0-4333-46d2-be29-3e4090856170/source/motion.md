# Flows Agent — describe it, the agent wires the workflow

让自然语言长成一张可编辑的媒体工作流。节点代表真实产物，连线代表依赖，后续修改只替换相关部分。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 48.666667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 10.2,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Flows Agent",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#d9763b"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Flows Agent",
        "accent": "#d9763b"
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

## 输入先形成任务，再形成节点

简短提示框出现后，先列出图像、视频、配音或编辑任务，再按依赖顺序放入画布。节点标题与状态保持清楚，尚未完成的结果不要提前显示为成品。

浅色节点与细线保持可读，橙色流体或柔光留在工作区外围。标题用清晰无衬线字，媒体类型、状态和参数以较小层级排列。

## 连线表达素材怎么流动

图像可以成为运动节点的输入，配音进入编辑，编辑输出成片。节点完成后才点亮下游，复杂图需要沿内容方向布置，尽量减少穿过文字的交叉线。

| 节点关系 | 制作约束 |
| --- | --- |
| 参考→图像 | 主体身份要延续 |
| 图像→视频 | 运动围绕已有主体展开 |
| 声音→编辑 | 时长与画面段落对应 |
| 编辑→成片 | 等待所需媒体就绪 |

## 局部修改保留其余工作

更换产品、改变画幅或挑选配音时，突出相关节点，保留不受影响的节点和连线。随后呈现对应变体，观众能看出改动影响了哪里。

```motion-demo
{
  "id": "clip-3",
  "title": "局部修改保留其余工作",
  "src": "demos/clip-3.html",
  "duration": 15,
  "status": "authored",
  "description": "20–35 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 最后看作品，也看工作流

先展示一段完整广告成果，再拉远到节点全景。换主题时一起替换产品、提示、媒体与声音；保留计划到依赖，再到局部修改和最终输出的结构。

## 配色与字形

无衬线界面文字与清晰大小层级。

#f7f6f0 · #161616 · #d9763b · #7fb7ae · #d9d6c9

## 元素与制作规则

输入条 / 任务列表 / 图像节点 / 视频节点 / 音频节点 / 依赖连线 / 变体组 / 成品

- 自然语言先转为节点依赖，输出节点应等待上游素材完成
- 后续修改替换局部节点并保留其余连线，表现可编辑性
- 画幅与声音选择在成品之前，结尾拉远展示整体工作流

## 内容替换

- 可替换产品广告主题，保留计划→依赖→局部修改→成品结构
- 节点种类应与真正媒体依赖一致，不能仅画装饰连线

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "ElevenLabs",
  "id": "V300",
  "palette": [
    "#f7f6f0",
    "#161616",
    "#d9763b",
    "#7fb7ae",
    "#d9d6c9"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "Flows Agent",
  "objects": [
    "输入条",
    "任务列表",
    "图像节点",
    "视频节点",
    "音频节点",
    "依赖连线",
    "变体组",
    "成品"
  ],
  "frames": [
    {
      "path": "https://r.open-design.ai/files/dc5821c64d9b98f750f4df8a82e17ddb24d9addd87311ca3091953ae08686a5e",
      "timeSeconds": 0.0,
      "frameId": "K0001",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-2.webp",
      "timeSeconds": 9.0,
      "frameId": "K0035",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 17.0,
      "frameId": "K0063",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 28.0,
      "frameId": "K0105",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 35.0,
      "frameId": "K0128",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/d9568cba387cb4bf90ab6ef972f4a6bc52e83af9c0adebe0a28e0c572eaa5740",
      "timeSeconds": 44.0,
      "frameId": "K0167",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "橙色入口",
      "end": 3.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.0,
      "label": "自然语言输入",
      "end": 9.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9.0,
      "label": "任务分解",
      "end": 13.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13.0,
      "label": "节点生成",
      "end": 17.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 17.0,
      "label": "结果与连线",
      "end": 20.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 20.0,
      "label": "修改创意",
      "end": 24.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 24.0,
      "label": "替换产品",
      "end": 28.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 28.0,
      "label": "画幅选择",
      "end": 31.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 31.0,
      "label": "配音选择",
      "end": 35.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 35.0,
      "label": "广告成果",
      "end": 39.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 39.0,
      "label": "工作流全景",
      "end": 44.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 44.0,
      "label": "入口与品牌",
      "end": 48.666667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 48.666667,
  "fontFamily": "Arial, sans-serif"
}
```
