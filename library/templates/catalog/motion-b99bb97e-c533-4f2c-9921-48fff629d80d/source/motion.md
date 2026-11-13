# Model Council in Perplexity.

一个问题分给多个模型，再合并成共识、分歧和来源详情。视觉重点是并行与比较，避免把多个模型演成先后接力。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 41.72,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 8,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Model Council",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#2c8587"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Model Council",
        "accent": "#2c8587"
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

## 从一个问题分出三条回答

模式与模型先完成选择，提交同一个问题后，同时出现三条处理状态。每条状态独立推进，名称和位置保持不变；回答合流后才进入对照视图。

## 共识与分歧分开阅读

共识表先给稳定结论，分歧表再展示各模型立场。两张表沿用相同列宽和模型顺序，让切换时无需重新寻找来源。

| 信息层 | 画面安排 |
| --- | --- |
| 并行回答 | 三行状态并列，模型名称固定 |
| 共识 | 突出共同结论，减少重复内容 |
| 分歧 | 按同一比较项逐列对照 |
| 详情 | 保留来源模型并展开完整回答 |

## 详情页仍保留来路

从表格进入单模型回答时，维持模型标记与选中关系。详情增加内容密度，表格退到辅助位置；回到比较层时恢复原先的列序。

![36.00s · 构图参考](https://r.open-design.ai/files/83d1470ffcccbb66ab8926ee4a7e915eb2109683e5ca787a612b055260a9fac4)

## 用克制配色区分层次

浅底、深字、青绿色选中态为主。主张标题可用衬线字，表格与模型标签用无衬线字；不用三套大面积品牌色竞争，颜色只标记当前操作与比较结果。

## 可换模型，也可换成方案评审

替换模型名称、问题和回答内容时，同时更新比较维度。迁移成三个方案或三个团队的评审也成立，但要保留“共同输入→并行结果→对照→来源详情”。

## 配色与字形

衬线主张标题搭配无衬线界面文字；大留白、细边框。

#fafaf7 · #171917 · #2c8587 · #dbe4df · #ffffff

## 元素与制作规则

模式菜单 / 模型列表 / 并行状态行 / 共识表 / 分歧表 / 回答详情

- 多模型从同一问题分叉，完成后合流为对照表；不能简化为三个串行步骤。
- 共识与分歧是两个独立信息层，最后仍能查看来源回答。

## 内容替换

- 可迁移为多方案比较；保留并行生成→对照→详情追溯。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Perplexity",
  "id": "V082",
  "palette": [
    "#fafaf7",
    "#171917",
    "#2c8587",
    "#dbe4df",
    "#ffffff"
  ],
  "typography": "衬线主张标题搭配无衬线界面文字；大留白、细边框",
  "sample": "Model Council",
  "objects": [
    "模式菜单",
    "模型列表",
    "并行状态行",
    "共识表",
    "分歧表",
    "回答详情"
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
      "frameId": "K0023",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 11.0,
      "frameId": "K0026",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 21.0,
      "frameId": "K0040",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/98eb372a58ba1c9b50adf3bda6a9087e1cc41b014fb26526b1ec99bceb08c4ef",
      "timeSeconds": 25.0,
      "frameId": "K0048",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/83d1470ffcccbb66ab8926ee4a7e915eb2109683e5ca787a612b055260a9fac4",
      "timeSeconds": 36.0,
      "frameId": "K0066",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "棱镜标题",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "选择模式",
      "end": 8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8,
      "label": "选三个模型",
      "end": 11,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11,
      "label": "提问",
      "end": 15,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15,
      "label": "并行回答",
      "end": 21,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 21,
      "label": "共识表",
      "end": 25,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 25,
      "label": "分歧表",
      "end": 29,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 29,
      "label": "单模型详情",
      "end": 36,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 36,
      "label": "收尾",
      "end": 41.72,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 41.72,
  "fontFamily": "Georgia, serif"
}
```
