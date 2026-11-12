# Think｜大会字标

立体字母从分散朝向归到同一阅读方向，短促完成后保留安静的字标。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 2.166667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 0.85,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "think",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#7658ed"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "think",
        "accent": "#7658ed"
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

## 旋转归位比整体缩放更重要

开始能看见字母部件的侧面与曲面，归位后形成完整 think。相邻字母使用轻微错峰，最终字距与基线统一；镜头拉远给完整字形留空间。

```motion-demo
{
  "id": "clip-1",
  "title": "旋转归位比整体缩放更重要",
  "src": "demos/clip-1.html",
  "duration": 0.9,
  "status": "authored",
  "description": "0–0.9 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 浅地面与冷色侧面形成体积

浅灰舞台衬托浅色字面，蓝紫色侧面提供深度，阴影落向一致。使用小写无衬线字，字母圆弧与直线的厚度协调，停留段不要持续摇摆。

## 适合短会议名或产品名

替换字形时重新安排部件朝向与归位顺序。保留“局部材质→完整可读字标”，名称长时优先减小字间距变化而非压窄每个字。

## 配色与字形

无衬线小写字标；字面浅色、侧面蓝紫，整体居中。

#dfdfe0 · #f6f4ff · #7658ed · #344ded · #b8acf3

## 元素与制作规则

立体字母部件 / 蓝紫侧面 / 浅灰地面 / 软阴影

- 立体字母从分散朝向归到同一阅读方向，短促完成后保留安静的字标。
- 开始能看见字母部件的侧面与曲面，归位后形成完整 think。相邻字母使用轻微错峰，最终字距与基线统一；镜头拉远给完整字形留空间。
- 浅灰舞台衬托浅色字面，蓝紫色侧面提供深度，阴影落向一致。使用小写无衬线字，字母圆弧与直线的厚度协调，停留段不要持续摇摆。

## 内容替换

- 替换字形时重新安排部件朝向与归位顺序。保留“局部材质→完整可读字标”，名称长时优先减小字间距变化而非压窄每个字。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "IBM",
  "id": "V368",
  "palette": [
    "#dfdfe0",
    "#f6f4ff",
    "#7658ed",
    "#344ded",
    "#b8acf3"
  ],
  "typography": "无衬线小写字标；字面浅色、侧面蓝紫，整体居中",
  "sample": "think",
  "objects": [
    "立体字母部件",
    "蓝紫侧面",
    "浅灰地面",
    "软阴影"
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
      "timeSeconds": 0.5098039215686275,
      "frameId": "K0003",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 0.7647058823529412,
      "frameId": "K0005",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 0.9877450980392157,
      "frameId": "K0007",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "字形立体部件",
      "end": 0.45,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.45,
      "label": "构件转向",
      "end": 0.76,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.76,
      "label": "完整单词",
      "end": 1,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1,
      "label": "停留",
      "end": 2.166667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 2.166667,
  "fontFamily": "Arial, sans-serif"
}
```
