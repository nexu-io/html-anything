# Supabase — connector in Gemini Enterprise

一次启用动作把数据源接入对话：打开菜单、开启连接器、输入针对该数据源的问题，再以双品牌组合结束。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 16.3,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 6.9,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Supabase × Gemini",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#49d599"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Supabase × Gemini",
        "accent": "#49d599"
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

## 新增连接器从菜单底部进入

现有搜索项先出现，Supabase 项从下方加入并对齐。开关从灰变绿后菜单收起，输入框回到全景；指针只在操作时出现，不持续遮挡名称。

```motion-demo
{
  "id": "clip-1",
  "title": "新增连接器从菜单底部进入",
  "src": "demos/clip-1.html",
  "duration": 4,
  "status": "authored",
  "description": "4–8 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 提问必须明确引用已连接数据

输入框逐步填入表名和问题，发送按钮最后触发。深色界面、低亮蓝光和绿色启用状态相互区分，文本保留足够字号。

## 两种身份在落版保持平衡

结束时两个图标并排，中间小乘号，蓝绿背光各归一侧。更换合作品牌时同时改菜单名称、图标、问题中的数据源与最后锁定，不只替换落版。

## 配色与字形

无衬线中心短句与输入文字；连接器名称小号，双品牌标识尺寸接近。

#060708 · #edf3ef · #49d599 · #6c8ee5 · #202321

## 元素与制作规则

中心标题 / 输入框 / 连接器菜单 / 开关 / 发送按钮 / 双品牌标识

- 一次启用动作把数据源接入对话：打开菜单、开启连接器、输入针对该数据源的问题，再以双品牌组合结束。
- 现有搜索项先出现，Supabase 项从下方加入并对齐。开关从灰变绿后菜单收起，输入框回到全景；指针只在操作时出现，不持续遮挡名称。
- 输入框逐步填入表名和问题，发送按钮最后触发。深色界面、低亮蓝光和绿色启用状态相互区分，文本保留足够字号。

## 内容替换

- 结束时两个图标并排，中间小乘号，蓝绿背光各归一侧。更换合作品牌时同时改菜单名称、图标、问题中的数据源与最后锁定，不只替换落版。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Supabase",
  "id": "V387",
  "palette": [
    "#060708",
    "#edf3ef",
    "#49d599",
    "#6c8ee5",
    "#202321"
  ],
  "typography": "无衬线中心短句与输入文字；连接器名称小号，双品牌标识尺寸接近",
  "sample": "Supabase × Gemini",
  "objects": [
    "中心标题",
    "输入框",
    "连接器菜单",
    "开关",
    "发送按钮",
    "双品牌标识"
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
      "timeSeconds": 2.75,
      "frameId": "K0013",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 5.85,
      "frameId": "K0024",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 8.0,
      "frameId": "K0034",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 12.9,
      "frameId": "K0043",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 16.0,
      "frameId": "K0054",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "黑场",
      "end": 0.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.5,
      "label": "标题展开",
      "end": 2.7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.7,
      "label": "输入框",
      "end": 4.2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.2,
      "label": "插件菜单",
      "end": 5.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5.8,
      "label": "连接器加入",
      "end": 6.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6.8,
      "label": "启用开关",
      "end": 8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8,
      "label": "回到输入",
      "end": 10,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10,
      "label": "提问",
      "end": 12.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12.8,
      "label": "发送",
      "end": 13.3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13.3,
      "label": "双品牌锁定",
      "end": 16,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 16,
      "label": "退出",
      "end": 16.3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 16.3,
  "fontFamily": "Arial, sans-serif"
}
```
