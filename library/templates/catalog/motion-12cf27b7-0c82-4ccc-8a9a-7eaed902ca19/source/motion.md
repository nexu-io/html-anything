# 适配 iPhone Duo

竖屏手机居中进入，转向并展开为横向双栏；列表留在一侧，详情进入另一侧。保持同一条笔记内容贯穿两个画幅。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 17.016667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 6,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Let the conversation unfold.",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#afce39"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Let the conversation unfold.",
        "accent": "#afce39"
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

## 用设备展开解释布局变化

竖屏手机居中进入，转向并展开为横向双栏；列表留在一侧，详情进入另一侧。保持同一条笔记内容贯穿两个画幅。

```motion-demo
{
  "id": "clip-1",
  "title": "用设备展开解释布局变化",
  "src": "demos/clip-1.html",
  "duration": 3.7,
  "status": "authored",
  "description": "2.3–6 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 纸上拼贴围绕设备，不压住界面

奶灰背景用小块彩色纸片与手绘箭头点缀四周，黑色设备边框突出屏幕。宣传短句用细衬线，与 UI 小字区分。

## 折回设备时保留使用状态

完整笔记后展示折叠设备的录音波形，随后切到绿色品牌页。迁移到其他设备时，把折叠几何和屏幕响应一起设计。

| 时间 | 段落 |
|---|---|
| 0.00–2.50s | 竖屏设备升起 |
| 2.50–4.50s | 展开横屏 |
| 4.50–8.00s | 笔记列表与详情 |
| 8.00–10.50s | 展开短句 |
| 10.50–12.00s | 回到竖屏 |
| 12.00–13.60s | 折叠录音 |
| 13.60–17.02s | 品牌 |

## 配色与字形

浅纸色、手绘箭头与小块拼贴；手机屏幕保留黑框和淡色界面。。

#e9e9e1 · #1a1b17 · #afce39 · #d4c5cf · #7c8a78

## 元素与制作规则

折叠设备 / 列表与详情 / 手绘箭头 / 边缘拼贴 / 衬线短句

- 竖屏手机居中进入，转向并展开为横向双栏；列表留在一侧，详情进入另一侧。保持同一条笔记内容贯穿两个画幅。
- 奶灰背景用小块彩色纸片与手绘箭头点缀四周，黑色设备边框突出屏幕。宣传短句用细衬线，与 UI 小字区分。
- 完整笔记后展示折叠设备的录音波形，随后切到绿色品牌页。迁移到其他设备时，把折叠几何和屏幕响应一起设计。

## 内容替换

- 更换设备和笔记，维持展开与双栏布局同步。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Granola",
  "id": "V138",
  "palette": [
    "#e9e9e1",
    "#1a1b17",
    "#afce39",
    "#d4c5cf",
    "#7c8a78"
  ],
  "typography": "浅纸色、手绘箭头与小块拼贴；手机屏幕保留黑框和淡色界面。",
  "sample": "Let the conversation unfold.",
  "objects": [
    "折叠设备",
    "列表与详情",
    "手绘箭头",
    "边缘拼贴",
    "衬线短句"
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
      "timeSeconds": 2.5,
      "frameId": "K0011",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 4.5,
      "frameId": "K0019",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 10.5,
      "frameId": "K0041",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 12.0,
      "frameId": "K0048",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 13.6,
      "frameId": "K0055",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "竖屏设备升起",
      "end": 2.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.5,
      "label": "展开横屏",
      "end": 4.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.5,
      "label": "笔记列表与详情",
      "end": 8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8,
      "label": "展开短句",
      "end": 10.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10.5,
      "label": "回到竖屏",
      "end": 12,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12,
      "label": "折叠录音",
      "end": 13.6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13.6,
      "label": "品牌",
      "end": 17.016667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 17.016667,
  "fontFamily": "Arial, sans-serif"
}
```
