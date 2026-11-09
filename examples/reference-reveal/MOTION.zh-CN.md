# 二十秒 · Motion MD

[English](MOTION.md) · [打开可编辑工程源码](index.html) · [播放 5 秒成片](film.mp4)

## 参考片与拍法

Firecrawl 的 5 秒片段先用「1,000,000 Developers」占住画面，随后让一圈标志围绕火焰旋转，最后把两个标志并排，右侧出现阶梯形图案。参考片段在 Firecrawl 联合创始人 Eric Ciarla 发布的 X 原帖中对应 00:21–00:26。[作者原帖](https://x.com/ericciarla/status/2093375835679977570) · [观看参考片](https://static.heygen.ai/hyperframes-oss/desktop/moments/v5/M945/clip.mp4)

沿用这三个动作，介绍 OpenMotion 的 Product Promo 模板。开场的 20 秒指模板的真实时长，这支示范短片本身长 5 秒。[Product Promo 模板源码](../../template-library/product-promo/index.html)

## 品牌与镜头节奏

画幅 1280 × 720，每秒 30 帧。使用 [OpenDesign 原标志](assets/mark.svg)、绿色数字、浅色网格和[为这支片做的提示音](assets/cues.wav)。环绕标志的文字来自工程里的输入和输出。改编版画面和声音均来自本项目。

| 时段 | 保留的拍法 | 本片使用的内容 |
| --- | --- | --- |
| 0–1.5 秒 | 推近一个大数字，从左到右逐步揭开，下方的小标题停住。 | `00:00:20` 和 Product Promo |
| 1.5–4 秒 | 拉开画面让卡片形成圆环，中央标志落定后，外围继续旋转。 | 九个可编辑标签围绕 OpenDesign 标志。 |
| 4–5 秒 | 把中央标志带到收尾画面，左边出现输入，右边揭晓输出。 | Motion MD → OpenMotion → MP4 |

## 用同一份说明改第二版

将本文件和 HTML 明确交给 Codex，保留五秒时间线、旋转轨迹、声音和标志，只把开场数字换成 `00:00:15`、小标题换成「NYT Graph」。两个字段分别在 `index.html` 的开场数字和下方标签中。15 秒来自 [NYT Graph 模板](../../template-library/nyt-graph/index.html)。

对照 [Product Promo 版](film.mp4)和 [NYT Graph 版](graph-cut.mp4)。在 0.8 秒能读到改过的数字和标题。在 2.65 秒，两版的卡片应处在相同位置。在 4.62 秒，中央标志应沿相同轨迹走向片尾。两版均由插件实际导出。[本地渲染方法](../README.md#render-a-source-file-locally)
