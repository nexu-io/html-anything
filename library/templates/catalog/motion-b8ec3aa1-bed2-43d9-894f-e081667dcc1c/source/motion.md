# Loops 能按星期跑

一次设置依次确定周期、星期和时间，最后用自然语言确认结果。重点是表单状态的持续与组合。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 15.966667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 4,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Engineering meeting prep",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#6970c6"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Engineering meeting prep",
        "accent": "#6970c6"
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

## 选了周期，再出现对应日期选项

先打开周期菜单并选周周期，再展示星期多选。已选星期持续高亮，新增选择不清掉已有项；时间菜单在日期确定后进入。

```motion-demo
{
  "id": "clip-1",
  "title": "选了周期，再出现对应日期选项",
  "src": "demos/clip-1.html",
  "duration": 10,
  "status": "authored",
  "description": "2–12 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 保存总览把规则读成一句话

保存后收起设置面板，用一句自然语言概括周期、星期和时刻。摘要使用与控件一致的值，任务名称仍保留在父容器内，说明这些设置属于哪项工作。

| 控件 | 摘要需要承接的信息 |
| --- | --- |
| 周期 | 每隔多少周 |
| 星期集合 | 选择哪些工作日 |
| 时间 | 具体时刻 |
| 启用状态 | 规则是否生效 |

## 深色表单中只强调选择

暗灰面板、浅色无衬线文字与冷紫选中态组成界面。星期按钮等距排布，菜单靠近触发控件；任务标题略重于字段，选择颜色不要被背景装饰重复使用。

## 更换任务时保留设置依赖

可改成报告、提醒或例行检查。任务名称、频率、日期和最终摘要一起更新；若改成每日或每月，日期控件也应随周期变化。

## 配色与字形

无衬线中粗主标题；细边框界面与小号功能文字。

#090a0c · #e9e9e8 · #6970c6 · #30333c · #ffffff

## 元素与制作规则

任务父容器 / 周期菜单 / 星期按钮 / 时间菜单 / 启用状态

- 先选周周期，才显示星期多选，再设时间；完成后总览用自然语言总结规则。
- 已选星期必须持续高亮，不能当普通装饰圆点。

## 内容替换

- 可换定时任务；保留周期→日期集合→时刻→摘要。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Linear",
  "id": "V113",
  "palette": [
    "#090a0c",
    "#e9e9e8",
    "#6970c6",
    "#30333c",
    "#ffffff"
  ],
  "typography": "无衬线中粗主标题；细边框界面与小号功能文字",
  "sample": "Engineering meeting prep",
  "objects": [
    "任务父容器",
    "周期菜单",
    "星期按钮",
    "时间菜单",
    "启用状态"
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
      "timeSeconds": 2.0,
      "frameId": "K0003",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 4.0,
      "frameId": "K0006",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 9.0,
      "frameId": "K0012",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 12.0,
      "frameId": "K0016",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "任务设置",
      "end": 2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2,
      "label": "周期菜单",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "选择星期",
      "end": 9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9,
      "label": "时间菜单",
      "end": 12,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12,
      "label": "保存总览",
      "end": 15.966667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 15.966667,
  "fontFamily": "Arial, sans-serif"
}
```
