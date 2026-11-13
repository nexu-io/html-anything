# Glass.

玻璃本身固定，手和容器从后方经过；细密方格把轮廓分成错位的小段。全景交代框架，近景让纹理与失真关系清楚可见。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 10.04,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 2.3,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Glass",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#a17561"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Glass",
        "accent": "#a17561"
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

## 用移动物体显出玻璃的折射

玻璃本身固定，手和容器从后方经过；细密方格把轮廓分成错位的小段。全景交代框架，近景让纹理与失真关系清楚可见。

```motion-demo
{
  "id": "clip-1",
  "title": "用移动物体显出玻璃的折射",
  "src": "demos/clip-1.html",
  "duration": 2.4,
  "status": "authored",
  "description": "1–3.4 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 照明柔和，背景保持单纯

灰白空间与侧向软光凸显凹凸玻璃，金属竖杆提供稳定边界。移动速度较慢，避免动作模糊掩盖压纹。

## 替换物体时选清晰轮廓

可以换成瓶、花、手部或彩色几何体；玻璃网格始终不动，失真随后方对象的位置变化。结尾停在安静的物体状态。

## 配色与字形

中性灰白摄影空间，细密压纹玻璃，棕肤色只作为玻璃后的移动参照。。

#e4e4df · #4d4f4b · #a17561 · #f6f6f1 · #a8aaa5

## 元素与制作规则

压纹玻璃 / 金属支架 / 后方手部 / 透明容器 / 地面投影

- 玻璃本身固定，手和容器从后方经过；细密方格把轮廓分成错位的小段。全景交代框架，近景让纹理与失真关系清楚可见。
- 灰白空间与侧向软光凸显凹凸玻璃，金属竖杆提供稳定边界。移动速度较慢，避免动作模糊掩盖压纹。
- 可以换成瓶、花、手部或彩色几何体；玻璃网格始终不动，失真随后方对象的位置变化。结尾停在安静的物体状态。

## 内容替换

- 迁移的是固定纹理对移动背景的折射关系，需要目标材质或位移图。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Nothing",
  "id": "V160",
  "palette": [
    "#e4e4df",
    "#4d4f4b",
    "#a17561",
    "#f6f6f1",
    "#a8aaa5"
  ],
  "typography": "中性灰白摄影空间，细密压纹玻璃，棕肤色只作为玻璃后的移动参照。",
  "sample": "Glass",
  "objects": [
    "压纹玻璃",
    "金属支架",
    "后方手部",
    "透明容器",
    "地面投影"
  ],
  "frames": [
    {
      "path": "https://r.open-design.ai/files/f89617af350085fb27ab0b898247246f3318bd119d40f7977cb7616ed84e15a3",
      "timeSeconds": 0.0,
      "frameId": "K0001",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/9f3df64df469e58c50f1f482bc408f00be600a5d9336dabfedd1dda1e1e1d260",
      "timeSeconds": 1.0,
      "frameId": "K0005",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/733c7fd5c19942fac396ace5896e3b0b18274fb61da2783877e81cee1f96a327",
      "timeSeconds": 3.6,
      "frameId": "K0017",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/9452009c6f42a38ba219e60f6fffc3303f8cd5861fd354639a4370f831e605e1",
      "timeSeconds": 5.0,
      "frameId": "K0023",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/5d6635b2c4d644661a8b9dc46c3dad8fedec4c4255adc868350ae338a3c08edc",
      "timeSeconds": 6.84,
      "frameId": "K0034",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "玻璃全景",
      "end": 1,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1,
      "label": "压纹近景",
      "end": 3.6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.6,
      "label": "手移动容器",
      "end": 5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5,
      "label": "手部近景",
      "end": 6.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6.8,
      "label": "全景落定",
      "end": 10.04,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 10.04,
  "fontFamily": "Arial, sans-serif"
}
```
