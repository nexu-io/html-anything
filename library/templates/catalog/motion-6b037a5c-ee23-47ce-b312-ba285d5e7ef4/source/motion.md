# Krea Nodes 多人协作

多支彩色光标描出字母曲线，黑色节点端点留在字形上。完整标题随后收成单张空白节点，把图形隐喻接入真实操作。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 23.866667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 15,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Multiplayer Nodes",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#f52e92"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Multiplayer Nodes",
        "accent": "#f52e92"
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

## 标题本身就是节点系统

多支彩色光标描出字母曲线，黑色节点端点留在字形上。完整标题随后收成单张空白节点，把图形隐喻接入真实操作。

## 每条分支属于一位协作者

从同一源节点拉线，光标名称和线条颜色一一对应。新节点出现后再显示生成图片，继续从结果节点派生。

```motion-demo
{
  "id": "clip-2",
  "title": "每条分支属于一位协作者",
  "src": "demos/clip-2.html",
  "duration": 6.0,
  "status": "authored",
  "description": "11.5–17.5 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 拉远展示共同成果

图谱扩展时适度缩小整体，让多个结果同时可见；结束时只保留成果缩略图和一句发布结论。更换主题时沿用同源多分支。

| 时间 | 段落 |
|---|---|
| 0.00–4.80s | 彩色线条书写 |
| 4.80–7.00s | 节点字标题 |
| 7.00–9.00s | 收成空节点 |
| 9.00–11.50s | 输入素材 |
| 11.50–15.00s | 拉出分支 |
| 15.00–19.00s | 继续派生 |
| 19.00–21.00s | 拉远结果 |
| 21.00–23.87s | 结论 |

## 配色与字形

浅色点阵画布、黑色节点线条、多用户光标使用粉蓝紫橙。。

#f9f9f9 · #161616 · #f52e92 · #3289fc · #a055d5 · #ff9b0a

## 元素与制作规则

节点字母 / 彩色光标 / 源素材节点 / 曲线连线 / 派生节点

- 多支彩色光标描出字母曲线，黑色节点端点留在字形上。完整标题随后收成单张空白节点，把图形隐喻接入真实操作。
- 从同一源节点拉线，光标名称和线条颜色一一对应。新节点出现后再显示生成图片，继续从结果节点派生。
- 图谱扩展时适度缩小整体，让多个结果同时可见；结束时只保留成果缩略图和一句发布结论。更换主题时沿用同源多分支。

## 内容替换

- 替换素材与协作者，保留连接先于结果、源节点持续存在。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Krea",
  "id": "V127",
  "palette": [
    "#f9f9f9",
    "#161616",
    "#f52e92",
    "#3289fc",
    "#a055d5",
    "#ff9b0a"
  ],
  "typography": "浅色点阵画布、黑色节点线条、多用户光标使用粉蓝紫橙。",
  "sample": "Multiplayer Nodes",
  "objects": [
    "节点字母",
    "彩色光标",
    "源素材节点",
    "曲线连线",
    "派生节点"
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
      "timeSeconds": 4.8,
      "frameId": "K0022",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 9.0,
      "frameId": "K0033",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 11.533333333333333,
      "frameId": "K0038",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 19.0,
      "frameId": "K0064",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 21.0,
      "frameId": "K0066",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "彩色线条书写",
      "end": 4.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.8,
      "label": "节点字标题",
      "end": 7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7,
      "label": "收成空节点",
      "end": 9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9,
      "label": "输入素材",
      "end": 11.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11.5,
      "label": "拉出分支",
      "end": 15,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15,
      "label": "继续派生",
      "end": 19,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 19,
      "label": "拉远结果",
      "end": 21,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 21,
      "label": "结论",
      "end": 23.866667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 23.866667,
  "fontFamily": "Arial, sans-serif"
}
```
