# 把重复工作设成自动任务

把自动化讲成一组明确的条件和行动。先配置“什么时候发生什么”，再用通知与结果说明任务确实走到了下一步。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 27.033333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 5.0,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Automations",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#538cbe"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Automations",
        "accent": "#538cbe"
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

## 左右两栏承担因果

左侧写触发条件，右侧写执行动作，短句中保留具体对象、条件与结果。连线从条件指向行动，不把两个面板当成独立功能卡。

用浅色底、白色面板与少量强调色；WHEN、THEN 可略粗，具体条件使用常规无衬线字体。条件过长时换行，不压成密集小字。

## 配置完成后再出现通知

先输入条件，再填写行动并确认；之后切到手机通知或任务结果。结果文字应能直接对应刚才的条件，通知只承担“已触发”的信息，完整成果另留阅读空间。

| 示例条件 | 对应行动的写法 |
| --- | --- |
| 价格低于阈值 | 通知明确对象与价格 |
| 某类资料更新 | 产生对应摘要或清单 |
| 指定事件发生 | 执行具体任务并返回结果 |

## 同一结构可以装下不同工作

第二个例子沿用左右布局，只替换条件和行动，省去重复教学。换主题时把通知、结果和条件一起重写；保留先配置、后触发、再交付的顺序。

## 配色与字形

无衬线界面文字与清晰大小层级。

#f7f8f6 · #222522 · #538cbe · #b6cbb9 · #ffffff

## 元素与制作规则

触发条件 / 执行动作 / 连接箭头 / 手机通知 / 结果卡

- 条件与动作成对出现，填完两部分才能执行
- 设定发生在桌面，结果以手机通知到达，区分配置时间与触发时间
- 后段用同一双卡语法替换不同场景

## 内容替换

- 换主题保留如果发生X→执行Y→反馈结果关系
- 触发条件应具体可判断，结果与动作一一对应

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Manus",
  "id": "V046",
  "palette": [
    "#f7f8f6",
    "#222522",
    "#538cbe",
    "#b6cbb9",
    "#ffffff"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "Automations",
  "objects": [
    "触发条件",
    "执行动作",
    "连接箭头",
    "手机通知",
    "结果卡"
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
      "timeSeconds": 4.0,
      "frameId": "K0013",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/e2d9e0cdd3d66cbf81b70877350d4ddbad4a4ab41036b3be1696e7823b3c12cf",
      "timeSeconds": 6.533333333333333,
      "frameId": "K0021",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 11.0,
      "frameId": "K0036",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/e2cfbe5512af3168557f08d4d957148299121cf3e24000e1369bc5f45471e66d",
      "timeSeconds": 14.0,
      "frameId": "K0045",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 23.0,
      "frameId": "K0074",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "条件与动作卡",
      "end": 2.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.0,
      "label": "自动化输入",
      "end": 4.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.0,
      "label": "输入触发条件",
      "end": 6.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6.5,
      "label": "输入执行动作",
      "end": 8.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8.0,
      "label": "提交",
      "end": 11.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11.0,
      "label": "手机通知",
      "end": 14.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 14.0,
      "label": "结果链接",
      "end": 17.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 17.0,
      "label": "其他条件动作",
      "end": 23.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 23.0,
      "label": "品牌",
      "end": 27.033333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 27.033333,
  "fontFamily": "Arial, sans-serif"
}
```
