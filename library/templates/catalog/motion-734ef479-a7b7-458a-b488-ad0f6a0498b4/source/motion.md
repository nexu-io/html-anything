# Suno Studio 预告

红色录音按钮启动后，波形从左到右增长；切入声音列表，继续展开为多条彩色轨道。录制进度和播放头同向运动。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 18.133333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 10,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "SUNO Studio",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#ff6630"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "SUNO Studio",
        "accent": "#ff6630"
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

## 先录一段，再拆成可编辑声部

红色录音按钮启动后，波形从左到右增长；切入声音列表，继续展开为多条彩色轨道。录制进度和播放头同向运动。

```motion-demo
{
  "id": "clip-1",
  "title": "先录一段，再拆成可编辑声部",
  "src": "demos/clip-1.html",
  "duration": 2.8,
  "status": "authored",
  "description": "0–2.8 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 轨道颜色表示角色，不表示装饰

每条声部保持自己的颜色，片段的起止位置形成节奏。时间轴横向移动时，标签与播放头有稳定参照。

## 最后离开界面，保留音乐气氛

多轨快速浏览后切到红粉渐变背景和小型 SUNO Studio 字标。换工具时仍保留录音、分轨、编辑这条路径。

| 时间 | 段落 |
|---|---|
| 0.00–3.00s | 录制波形 |
| 3.00–4.50s | 生成设置 |
| 4.50–8.20s | 拆分声部 |
| 8.20–14.80s | 多轨编排 |
| 14.80–18.13s | 渐变品牌页 |

## 配色与字形

深色音频编辑器，多轨道用饱和橙绿粉蓝黄分组。。

#151515 · #ffffff · #ff6630 · #d51e8c · #26c461 · #1b9fdf · #d5c20d

## 元素与制作规则

录音按钮 / 延长波形 / 声部分轨列表 / 彩色时间轨 / 播放头 / 品牌页

- 红色录音按钮启动后，波形从左到右增长；切入声音列表，继续展开为多条彩色轨道。录制进度和播放头同向运动。
- 每条声部保持自己的颜色，片段的起止位置形成节奏。时间轴横向移动时，标签与播放头有稳定参照。
- 多轨快速浏览后切到红粉渐变背景和小型 SUNO Studio 字标。换工具时仍保留录音、分轨、编辑这条路径。

## 内容替换

- 替换音轨数量和标签，片段长度需与目标音乐结构对应。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Suno",
  "id": "V143",
  "palette": [
    "#151515",
    "#ffffff",
    "#ff6630",
    "#d51e8c",
    "#26c461",
    "#1b9fdf",
    "#d5c20d"
  ],
  "typography": "深色音频编辑器，多轨道用饱和橙绿粉蓝黄分组。",
  "sample": "SUNO Studio",
  "objects": [
    "录音按钮",
    "延长波形",
    "声部分轨列表",
    "彩色时间轨",
    "播放头",
    "品牌页"
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
      "timeSeconds": 2.9944953577981654,
      "frameId": "K0015",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 4.458470866055046,
      "frameId": "K0018",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/7217fe229eb0f2ca75a19dee8523de9f2a9d47e1284d0bfdc617510cd973db9c",
      "timeSeconds": 8.251498319266055,
      "frameId": "K0032",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 14.972476788990827,
      "frameId": "K0059",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "录制波形",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "生成设置",
      "end": 4.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.5,
      "label": "拆分声部",
      "end": 8.2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8.2,
      "label": "多轨编排",
      "end": 14.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 14.8,
      "label": "渐变品牌页",
      "end": 18.133333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 18.133333,
  "fontFamily": "Arial, sans-serif"
}
```
