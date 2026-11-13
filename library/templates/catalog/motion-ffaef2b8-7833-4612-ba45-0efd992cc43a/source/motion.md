# Emergent｜手机端构建应用

从增长背景引出一个新的使用场景：把原先在电脑上完成的构建，带到手机上。数据负责开场，实际移动操作负责后半段。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 59.366667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 12.2,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Build from your phone",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#67f0b1"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Build from your phone",
        "accent": "#67f0b1"
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

## 开场数字要交代时间关系

用两组增长里程碑和一条曲线交代变化，数字、指标名与对应时间放在同一阅读组。深色底与薄荷绿突出增长，标题用大号无衬线粗体，单位和时间采用较轻字重。

## 设备切换保持同一件工作

从笔记本转到手机时，沿用任务文案或应用主体。手机稳定后再出现输入，随后显示构建状态、平台支持和部署完成；不要在设备变化中丢掉任务身份。

## 完成之后再展开应用合集

单个手机任务走完后，多个成果围绕手机展开，画面从聚焦变为丰富。数量与平台标记作为补充信息，最后再回到品牌或发布日期。

| 时间 | 段落 |
|---|---|
| 0.00–6.00s | 品牌光形 |
| 6.00–11.00s | 收入里程碑 |
| 11.00–18.00s | 增长曲线 |
| 18.00–25.00s | 发布主张 |
| 25.00–28.00s | 笔记本 |
| 28.00–31.00s | 切换手机 |
| 31.00–38.00s | 手机输入 |
| 38.00–41.00s | 构建状态 |
| 41.00–44.00s | 双平台 |
| 44.00–48.00s | 部署成功 |
| 48.00–52.00s | 应用合集 |
| 52.00–59.37s | 时间与品牌 |

## 换主题的两套材料

准备新的增长背景与一项能在新设备上完成的任务。分别更新里程碑口径和产品操作，保留从商业背景到使用场景的转折；应用合集中的内容也要属于新主题。

## 配色与字形

无衬线界面文字与清晰大小层级。

#0b171b · #ffffff · #67f0b1 · #82abdf · #fafbfa

## 元素与制作规则

品牌立体形 / 收入数字 / 增长曲线 / 电脑 / 手机 / 输入框 / 部署状态 / 应用墙

- 先用增长建立背景，再把构建入口从电脑移到手机
- 手机中的输入、构建、上线依次发生，完成反馈后才显示多应用墙
- 深色数据段与明亮移动端段形成分界

## 内容替换

- 可用于产品从旧载体迁移到新载体，保留同一任务身份
- 增长数字与上线承诺必须替换为新品牌可核实信息

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Emergent",
  "id": "V056",
  "palette": [
    "#0b171b",
    "#ffffff",
    "#67f0b1",
    "#82abdf",
    "#fafbfa"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "Build from your phone",
  "objects": [
    "品牌立体形",
    "收入数字",
    "增长曲线",
    "电脑",
    "手机",
    "输入框",
    "部署状态",
    "应用墙"
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
      "timeSeconds": 10.993827222222222,
      "frameId": "K0043",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 24.985970959595956,
      "frameId": "K0087",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 37.97867585858586,
      "frameId": "K0130",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 43.97530888888889,
      "frameId": "K0151",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 51.97081959595959,
      "frameId": "K0185",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "品牌光形",
      "end": 6.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6.0,
      "label": "收入里程碑",
      "end": 11.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11.0,
      "label": "增长曲线",
      "end": 18.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18.0,
      "label": "发布主张",
      "end": 25.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 25.0,
      "label": "笔记本",
      "end": 28.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 28.0,
      "label": "切换手机",
      "end": 31.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 31.0,
      "label": "手机输入",
      "end": 38.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 38.0,
      "label": "构建状态",
      "end": 41.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 41.0,
      "label": "双平台",
      "end": 44.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 44.0,
      "label": "部署成功",
      "end": 48.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 48.0,
      "label": "应用合集",
      "end": 52.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 52.0,
      "label": "时间与品牌",
      "end": 59.366667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 59.366667,
  "fontFamily": "Arial, sans-serif"
}
```
