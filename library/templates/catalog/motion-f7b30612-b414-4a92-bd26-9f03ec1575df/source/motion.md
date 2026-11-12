# design mode 新增 Annotate

围绕同一个网页完成选择、批注、样式调整、草图补充和多尺寸检查。每个修改都要有明确的目标位置与反馈。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 43.566667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 9.8,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Annotate",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#9966cc"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Annotate",
        "accent": "#9966cc"
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

## 网页保持稳定，修改点轮流成为焦点

先打开完整页面，再点亮 Annotate 入口。批注附着在标题、按钮或具体区域上，编号与评论一一对应；页面结构不要在批注时整体漂移。

浅色浏览器与米白网页提供安静背景，编号标记用单一强调色，草图用独立的红色。网页标题可有品牌字形，编辑工具仍用统一无衬线字体。

## 即时样式与新增布局分开处理

颜色、间距等即时修改用属性面板直接反馈，目标元素保持在原位。新增布局先画草图或写评论，再提交生成，最终用真实组件替换草图区域。

| 操作 | 焦点 | 反馈 |
| --- | --- | --- |
| 点选评论 | 具体元素或区域 | 编号与评论出现 |
| 调整样式 | 选中的单个元素 | 颜色或尺寸即时变化 |
| 绘制草图 | 新增内容位置 | 提交后生成布局 |
| 切换尺寸 | 完整页面 | 内容按宽度重排 |

## 草图要留出足够的空间

画框、线条和箭头只表达结构与方向，不追求精致插画。提交之后保留同一位置锚点，让读者看清草图怎样变成表单或内容区。

```motion-demo
{
  "id": "clip-3",
  "title": "草图要留出足够的空间",
  "src": "demos/clip-3.html",
  "duration": 10,
  "status": "authored",
  "description": "24–34 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 完成修改后再检查窄屏

桌面改稿稳定后切到手机和平板宽度。内容身份、按钮文案和新增区域保持一致，排版随空间变化。

换主题时替换网页素材与修改要求，但每条批注都必须仍能对应一个明确目标。

## 配色与字形

无衬线界面文字与清晰大小层级。

#f5f5f1 · #202122 · #9966cc · #f1ba8a · #9ab8ad

## 元素与制作规则

浏览器 / 原页面 / 选框 / 编号批注 / 属性面板 / 草图 / 生成区域 / 尺寸选择

- 标注附着在目标元素上，编号和批注保持一一对应
- 样式修改可直接预览，草图新增需先提交再出现真实组件
- 响应式检查发生在修改完成后，保持同一页面内容

## 内容替换

- 可迁移到视觉编辑工具，保留选择→局部输入→反馈→多尺寸检查
- 替换页面主题时保持原位置锚点和修改作用域

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Cursor",
  "id": "V072",
  "palette": [
    "#f5f5f1",
    "#202122",
    "#9966cc",
    "#f1ba8a",
    "#9ab8ad"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "Annotate",
  "objects": [
    "浏览器",
    "原页面",
    "选框",
    "编号批注",
    "属性面板",
    "草图",
    "生成区域",
    "尺寸选择"
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
      "timeSeconds": 9.0,
      "frameId": "K0018",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 16.0,
      "frameId": "K0037",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 27.0,
      "frameId": "K0055",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 35.0,
      "frameId": "K0070",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 41.0,
      "frameId": "K0086",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "发布标题",
      "end": 5.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5.0,
      "label": "打开网页",
      "end": 9.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9.0,
      "label": "标注主张",
      "end": 11.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11.0,
      "label": "点选与批注",
      "end": 16.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 16.0,
      "label": "实时样式",
      "end": 20.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 20.0,
      "label": "修改按钮颜色",
      "end": 24.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 24.0,
      "label": "草图需求",
      "end": 27.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 27.0,
      "label": "画框与连线",
      "end": 31.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 31.0,
      "label": "应用修改",
      "end": 35.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 35.0,
      "label": "多屏检查",
      "end": 39.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 39.0,
      "label": "平板版",
      "end": 41.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 41.0,
      "label": "品牌",
      "end": 43.566667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 43.566667,
  "fontFamily": "Arial, sans-serif"
}
```
