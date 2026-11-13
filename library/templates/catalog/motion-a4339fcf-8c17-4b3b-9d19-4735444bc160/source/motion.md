# Cybersecurity Data

标题左对齐，Cybersecurity Data 使用橙色；下方点阵从局部亮起。随后整屏转橙色，白色大数字快速增长，再出现 vulnerabilities。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 21.683333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 4,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Cybersecurity Data",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#ff5e12"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Cybersecurity Data",
        "accent": "#ff5e12"
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

## 先让规模成为视觉冲击

标题左对齐，Cybersecurity Data 使用橙色；下方点阵从局部亮起。随后整屏转橙色，白色大数字快速增长，再出现 vulnerabilities。

```motion-demo
{
  "id": "clip-1",
  "title": "先让规模成为视觉冲击",
  "src": "demos/clip-1.html",
  "duration": 4.4,
  "status": "authored",
  "description": "1.4–5.8 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 把抽象数据接到扫描结果

输入请求后列出扫描步骤，完成时换成风险表。使用浅色面板与清晰状态点，风险等级通过标签区分。

## 最后把一个数据源放回来源库

来源标签由少变多铺开，再聚焦当前来源，收回品牌。换数据集时同时替换规模数字、任务与结果字段。

| 时间 | 段落 |
|---|---|
| 0.00–1.50s | 能力标题 |
| 1.50–3.30s | 点阵 |
| 3.30–6.10s | 数据规模 |
| 6.10–9.00s | 输入扫描请求 |
| 9.00–13.00s | 扫描步骤 |
| 13.00–15.00s | 风险结果 |
| 15.00–20.00s | 来源网络 |
| 20.00–21.68s | 品牌 |

## 配色与字形

白底黑字，橙色能力名与满屏数字冲击，细灰点阵作辅助。。

#ffffff · #202020 · #ff5e12 · #e3e3e3 · #f3f3f3

## 元素与制作规则

标题 / 点阵信号 / 数字计数 / 输入框 / 扫描列表 / 风险表 / 来源标签

- 标题左对齐，Cybersecurity Data 使用橙色；下方点阵从局部亮起。随后整屏转橙色，白色大数字快速增长，再出现 vulnerabilities。
- 输入请求后列出扫描步骤，完成时换成风险表。使用浅色面板与清晰状态点，风险等级通过标签区分。
- 来源标签由少变多铺开，再聚焦当前来源，收回品牌。换数据集时同时替换规模数字、任务与结果字段。

## 内容替换

- 保留规模—任务—结果—来源生态的次序，数字需与目标数据一致。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Firecrawl",
  "id": "V121",
  "palette": [
    "#ffffff",
    "#202020",
    "#ff5e12",
    "#e3e3e3",
    "#f3f3f3"
  ],
  "typography": "白底黑字，橙色能力名与满屏数字冲击，细灰点阵作辅助。",
  "sample": "Cybersecurity Data",
  "objects": [
    "标题",
    "点阵信号",
    "数字计数",
    "输入框",
    "扫描列表",
    "风险表",
    "来源标签"
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
      "timeSeconds": 1.5,
      "frameId": "K0007",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 6.166666666666667,
      "frameId": "K0023",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 9.0,
      "frameId": "K0029",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 15.0,
      "frameId": "K0039",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 20.0,
      "frameId": "K0050",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "能力标题",
      "end": 1.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.5,
      "label": "点阵",
      "end": 3.3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.3,
      "label": "数据规模",
      "end": 6.1,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6.1,
      "label": "输入扫描请求",
      "end": 9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9,
      "label": "扫描步骤",
      "end": 13,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13,
      "label": "风险结果",
      "end": 15,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15,
      "label": "来源网络",
      "end": 20,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 20,
      "label": "品牌",
      "end": 21.683333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 21.683333,
  "fontFamily": "Arial, sans-serif"
}
```
