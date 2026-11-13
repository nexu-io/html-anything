# 幕后内容上线｜The making of Claude Code

让历史资料逐层占据画面，最后放入主标题。标题停留时，周围窗口保留少量内部运动；结尾逐层撤去，回到档案。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 9.216667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 2.1,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "THE MAKING\nOF CLAUDE CODE",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#cc7863"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "THE MAKING\nOF CLAUDE CODE",
        "accent": "#cc7863"
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

## 主标题占据最上层

等宽档案文字、像素标题、深色窗口；竖屏中心堆叠。

窗口按先后层叠，中央标题最后覆盖上层；外围内容维持可辨认边缘。

![3.00s · 构图参考](https://r.open-design.ai/files/e2d09732499dfd0fc3df91710cae3c0c16776ce5a36dea37de95953b5ee5c39b)

## 窗口进出，内容继续播放

主标题停留期间，角色与访谈等内部内容继续变化；窗口外框与内容动画分开描述。

退出时撤去上层窗口，露出起始文档，让片段闭环。

```motion-demo
{
  "id": "clip-2",
  "title": "窗口进出，内容继续播放",
  "src": "demos/clip-2.html",
  "duration": 3.2,
  "status": "authored",
  "description": "0.3–3.5 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 从密集叠入到稳定留读

前 3 秒连续叠入窗口，3–8 秒保持主标题留读；末段按相反次序撤窗，回到档案底板。

| 时间 | 段落 |
|---|---|
| 0.00–0.30s | 文档底板 |
| 0.30–1.20s | 历史素材窗口叠入 |
| 1.20–1.90s | 像素角色窗口 |
| 1.90–3.00s | 中央标题窗口 |
| 3.00–8.10s | 多窗口保持与局部内容变化 |
| 8.10–8.80s | 窗口反向退场 |
| 8.80–9.22s | 回到档案底板 |

## 换一组项目档案

可用于产品幕后或项目回顾：替换历史截图、访谈和标题，保留证据堆叠关系。

主标题最多两行；外围素材至少三类，避免全是同一种截图。

## 配色与字形

等宽档案文字、像素标题、深色窗口；竖屏中心堆叠。

#f5f4ee · #242421 · #cc7863 · #dbf34b · #ffffff

## 元素与制作规则

档案页面 / 外围证据窗口 / 角色窗口 / 主标题窗口 / 访谈窗口

- 窗口按先后层叠，中央标题最后覆盖上层；外围内容维持可辨认边缘。
- 主标题停留期间，角色与访谈等内部内容继续变化；窗口外框与内容动画分开描述。
- 退出时撤去上层窗口，露出起始文档，让片段闭环。

## 内容替换

- 可用于产品幕后或项目回顾：替换历史截图、访谈和标题，保留证据堆叠关系。
- 主标题最多两行；外围素材至少三类，避免全是同一种截图。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Anthropic",
  "id": "V004",
  "palette": [
    "#f5f4ee",
    "#242421",
    "#cc7863",
    "#dbf34b",
    "#ffffff"
  ],
  "typography": "等宽档案文字、像素标题、深色窗口；竖屏中心堆叠",
  "sample": "THE MAKING\nOF CLAUDE CODE",
  "objects": [
    "档案页面",
    "外围证据窗口",
    "角色窗口",
    "主标题窗口",
    "访谈窗口"
  ],
  "frames": [
    {
      "path": "https://r.open-design.ai/files/57561e8bf42248951800d35aefa18ca8a8f44f584da8da61b0780f3301394803",
      "timeSeconds": 0.0,
      "frameId": "K0001",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/f6e759e77ccd3a240de858600919326ca510c25f8d0bd4e30ba598534267a454",
      "timeSeconds": 0.4666666666666667,
      "frameId": "K0002",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/c8ddbf8bdbc7d3c3b030dfe8bdf98ef4cf5f712615cc2970144746310756f46b",
      "timeSeconds": 1.25,
      "frameId": "K0005",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/e2d09732499dfd0fc3df91710cae3c0c16776ce5a36dea37de95953b5ee5c39b",
      "timeSeconds": 3.0,
      "frameId": "K0012",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/5307de95b4b61e7659436510d7a73e61e9113a0a0d2f403c632db92aeb1e2686",
      "timeSeconds": 8.133333333333333,
      "frameId": "K0024",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/ae3ef2c286dd00d87708baf6631a4bb160401b080a7ef748bd0c0683c3c06296",
      "timeSeconds": 8.75,
      "frameId": "K0028",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "文档底板",
      "end": 0.3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.3,
      "label": "历史素材窗口叠入",
      "end": 1.2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.2,
      "label": "像素角色窗口",
      "end": 1.9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.9,
      "label": "中央标题窗口",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "多窗口保持与局部内容变化",
      "end": 8.1,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8.1,
      "label": "窗口反向退场",
      "end": 8.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8.8,
      "label": "回到档案底板",
      "end": 9.216667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 9.216667,
  "fontFamily": "ui-monospace, monospace"
}
```
