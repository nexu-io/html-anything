# 四手机并列：应用生成能力演示

四个等高手机并排展示四类应用。外部布局稳定，内部各自操作，用不同信息类型说明同一构建方式的适用范围。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 17.875,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 7.2,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "TEXT-TO-APP AI AGENT TEST",
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
        "title": "TEXT-TO-APP AI AGENT TEST",
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

## 先把四列排稳

股票、新闻、健身和预算各占一列，标题置于手机上方或内部固定位置。手机尺寸、顶边、底边和间距统一，中央保留足够白地，避免设备外框成为最抢眼的内容。

浅色背景与黑色设备轮廓保持对照清楚，应用强调色可以不同；分类标题使用相同无衬线字重和字号层级。

## 四列使用不同的内部动作

股票用走势与指标切换，新闻用卡片滚动，健身用环形进度与活动记录，预算用列表、图表和数字输入。每列保留自己的操作顺序，错开切页时点，避免四台手机像同步幻灯片。

## 按信息类型选替换案例

换主题时优先挑四种不同的信息组织：曲线、信息流、进度和记录。保持相同外框与统一标题，把差异放到内部数据和操作上；无需为这段短演示再加长篇开场与收尾。

## 配色与字形

无衬线界面文字与清晰大小层级。

#f7f8f6 · #222522 · #538cbe · #b6cbb9 · #ffffff

## 元素与制作规则

统一标题 / 股票手机 / 新闻手机 / 健身手机 / 预算手机 / 各自导航

- 四个等高手机并列，共用背景而各自独立推进
- 标题与应用类别固定，内部滚动、切换、输入在不同拍点发生
- 多样性由内容类型而非四种外框表达

## 内容替换

- 保留并列对照结构，四个案例应展示不同信息与操作
- 四个类别应保留不同信息类型与不同操作，不把四台手机都变成相同列表。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Emergent",
  "id": "V058",
  "palette": [
    "#f7f8f6",
    "#222522",
    "#538cbe",
    "#b6cbb9",
    "#ffffff"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "TEXT-TO-APP AI AGENT TEST",
  "objects": [
    "统一标题",
    "股票手机",
    "新闻手机",
    "健身手机",
    "预算手机",
    "各自导航"
  ],
  "frames": [
    {
      "path": "https://r.open-design.ai/files/bbe2a4411cc20db2e91a829c8d5ac00285c2fa1fafda9a2f1569e06e00fa9166",
      "timeSeconds": 0.0,
      "frameId": "K0001",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/7c67c1a95edc260f828c35ead12f563dbb0e18a3c3f6f67bcfd39379caf2b5d6",
      "timeSeconds": 3.0000133850524477,
      "frameId": "K0013",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/5b20efd3824c74ad8c69f2e2341ff399bc91b42254d88557442c6e804f12ee56",
      "timeSeconds": 6.0000267701048955,
      "frameId": "K0025",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/36606d169c3aa6a57eedb3b65c816f9da75ebf63647e2cac1c1a490b8cfc97f3",
      "timeSeconds": 9.000040155157343,
      "frameId": "K0037",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/d61ae683f90bbcc27c056e99af7b7f80ef4f9e97a9e0988fa91cd91117a8bbf8",
      "timeSeconds": 12.000053540209791,
      "frameId": "K0049",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/6549056109054a47cb65070e111a4cbb907ee9abbf418e032d85f926421fe004",
      "timeSeconds": 15.000066925262239,
      "frameId": "K0067",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "四手机同时出现",
      "end": 3.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.0,
      "label": "各应用概览",
      "end": 6.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6.0,
      "label": "独立滚动",
      "end": 9.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9.0,
      "label": "筛选与切页",
      "end": 12.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12.0,
      "label": "图表与设置",
      "end": 15.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15.0,
      "label": "输入与主题",
      "end": 17.875,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 17.875,
  "fontFamily": "Arial, sans-serif"
}
```
