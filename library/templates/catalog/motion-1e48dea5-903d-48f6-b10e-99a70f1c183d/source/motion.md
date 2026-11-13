# Magic Share

同一份工作在桌面、平板与手机之间流动；把文档、图表和协作者保留在转场中，最后收成品牌纸飞机。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 36.6,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 21,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Lark",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#5d6de8"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Lark",
        "accent": "#5d6de8"
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

## 换设备，工作内容继续

显示器转向平板时保留项目名称、列表和头像。设备可转动，界面区域跟随设备平面；浅蓝空间承托白色屏幕，粉色只用于设备或局部材质。

```motion-demo
{
  "id": "clip-1",
  "title": "换设备，工作内容继续",
  "src": "demos/clip-1.html",
  "duration": 6,
  "status": "authored",
  "description": "0–6 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 把文档拆成可协作的层

长文档展开，图片、工具、图表和头像从同一页面分出。层间留距离，头像沿编辑目标移动，手势或游标只在需要指明操作时出现。

```motion-demo
{
  "id": "clip-2",
  "title": "把文档拆成可协作的层",
  "src": "demos/clip-2.html",
  "duration": 6,
  "status": "authored",
  "description": "9–15 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 多人参与后再收回项目总览

图表编辑与视频窗口叠合成群，最后回到项目表格。让同一头像在不同视图继续出现，避免把协作写成陌生窗口的连续堆积。

| 时间 | 段落 |
|---|---|
| 0.00–3.00s | 桌面协作 |
| 3.00–8.00s | 跨到平板 |
| 8.00–12.00s | 文档展开 |
| 12.00–15.00s | 工具与内容 |
| 15.00–19.00s | 手机项目 |
| 19.00–23.00s | 共同编辑 |
| 23.00–29.00s | 窗口群 |
| 29.00–32.00s | 项目总览 |
| 32.00–36.00s | 纸飞机 |
| 36.00–36.60s | 品牌 |

## 用折叠动作结束

窗口与文档逐渐减少，几何纸片合成飞机，飞到品牌位置。新主题可换协作内容和设备，但结束符号应从前面用过的形状产生。

## 配色与字形

界面使用简洁无衬线；头像与窗口标题比正文更醒目。

#eceeff · #302d57 · #5d6de8 · #efb9d8 · #82cde1 · #efa653

## 元素与制作规则

显示器 / 平板 / 文档 / 协作者头像 / 手机 / 图表 / 共享窗口 / 纸飞机

- 显示器转向平板时保留项目名称、列表和头像。设备可转动，界面区域跟随设备平面；浅蓝空间承托白色屏幕，粉色只用于设备或局部材质。
- 长文档展开，图片、工具、图表和头像从同一页面分出。层间留距离，头像沿编辑目标移动，手势或游标只在需要指明操作时出现。
- 图表编辑与视频窗口叠合成群，最后回到项目表格。让同一头像在不同视图继续出现，避免把协作写成陌生窗口的连续堆积。
- 窗口与文档逐渐减少，几何纸片合成飞机，飞到品牌位置。新主题可换协作内容和设备，但结束符号应从前面用过的形状产生。

## 内容替换

- 替换项目、协作者与终端，保留同一内容跨设备及最后折叠。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Lark",
  "id": "V366",
  "palette": [
    "#eceeff",
    "#302d57",
    "#5d6de8",
    "#efb9d8",
    "#82cde1",
    "#efa653"
  ],
  "typography": "界面使用简洁无衬线；头像与窗口标题比正文更醒目",
  "sample": "Lark",
  "objects": [
    "显示器",
    "平板",
    "文档",
    "协作者头像",
    "手机",
    "图表",
    "共享窗口",
    "纸飞机"
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
      "timeSeconds": 8.0,
      "frameId": "K0028",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 15.0,
      "frameId": "K0059",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 19.0,
      "frameId": "K0071",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/35b72f0e3fce577c79bc23e23ef51eed22ce0988f837722e2dbb2a059e7f2783",
      "timeSeconds": 29.0,
      "frameId": "K0109",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 36.0,
      "frameId": "K0125",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "桌面协作",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "跨到平板",
      "end": 8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8,
      "label": "文档展开",
      "end": 12,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12,
      "label": "工具与内容",
      "end": 15,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15,
      "label": "手机项目",
      "end": 19,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 19,
      "label": "共同编辑",
      "end": 23,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 23,
      "label": "窗口群",
      "end": 29,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 29,
      "label": "项目总览",
      "end": 32,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 32,
      "label": "纸飞机",
      "end": 36,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 36,
      "label": "品牌",
      "end": 36.6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 36.6,
  "fontFamily": "Arial, sans-serif"
}
```
