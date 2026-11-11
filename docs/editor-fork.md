# OpenDesign 编辑器开发

当前产品能力与维护规则见 [产品架构](product/architecture.md) 和 [文档中心](README.md)。

编辑器前端完整迁入本仓库，上游为 Hyperframes 0.9.7，commit `3baf81f9a92615507f76fe8de33e489034ee77ec`。`studio/` 包含原版 `src`、`public`、测试和测试素材，Apache-2.0 许可保存在 `studio/LICENSE`。运行时使用本地源码构建的编辑器。

## 功能与集成边界

The Motion host now exposes an MVP editor. `StudioHost.mvpEditor` gates product entry points without deleting native editing, source, history or MCP services. The root route resolves the active project before mounting `ArtifactViewer`; home, conversation and browser-tab components are not mounted. `WorkspaceFrame` lists searchable projects, waits for pending saves before switching, and opens the project drawer on demand, including embedded views.

The visible panels are Compositions, Assets, Catalog, Preview, Design, Layers and Timeline. `Dock.Root` uses fixed positions and `motion.mvp.dock.v1` preferences; resizing dividers and restoring their sizes remain supported. Newly enabled fixed panels are added to saved layouts without resetting divider sizes. Panel close/move/reset controls and layout presets are hidden. Side headers offer a collapse toggle; collapsed groups retain their panels in 48px icon rails and give the released space to preview. The toggle restores the last tab and width; rail icons expand their target module. Both sides start collapsed, with the timeline at 30% of dock height; shrinking the host below 900px collapses the sides again. Collapsed sizes are not persisted, and the preview stays mounted. Preview also supports temporary expansion within the editor. The allowed-panel list also rejects programmatic reopening of excluded panels.

The header retains rename, transient save/error status, templates, undo/redo, a version-history button and native export. MVP undo/redo use plain curved arrows and name-plus-shortcut tooltips. The MVP playback row omits browser fullscreen and its keyboard target, with volume, speed and loop controls aligned right. Save status is not a history action and disappears when idle. The sidebar footer keeps theme/language. Integration/model setup, Capture, Inspector toggle and preview/slideshow controls are hidden. The history button opens a right-aligned popover below the trigger, with an independently scrolling version list and the existing restore action. The MVP omits version-pinning buttons, filters and badges. The popover footer contains only the restore button; file-change details and explanatory copy are omitted. History is not a dock tab. Existing native history and Agent version APIs remain unchanged. MVP track headers omit clip-count badges and provide one speaker before visibility for audio and audible video clips (click to mute, hover or focus to adjust volume); batch saves preserve per-clip gain when toggling mute and create one undo step per operation. Video visibility and preview-monitor volume stay independent.

The inspector retains text, font, size, color, three alignments, solid fill and opacity. The MVP hides the Layout section, including X/Y/W/H inputs. The element Ask Agent footer and its empty-state hint are hidden. Advanced animation/style controls, recording, rotation, variables and blur are hidden. Opening an authored project must not remove its existing animations, gradients, effects or styles. Canvas selection, drag, resize, crop, text editing and context actions remain; canvas snapping stays enabled without guide/grid controls.

Timeline editing, snapping, zoom/Fit, imports, track visibility, clip clipboard/delete/split remain. Clip/range Ask Agent entry points are hidden. Generation/image replacement, advanced clip tools, lower undo/redo, keyframes, linked/ripple controls and beats are hidden; thumbnails stay enabled. Keyboard editing and native save/reload guards remain in place.

Undo/redo availability is filtered by the workspace host using history metadata and readable native blob/aside files, without loading media contents. Missing contents, pruned steps and known later file conflicts disable the matching visible undo/redo control; keyboard shortcuts do not dispatch an unavailable step. Adding media can still be undone and redone through the native aside store. Native execution retains its final validation for concurrent changes and I/O failures. This does not change history budgets, pin behavior or MCP retained-version storage.

Hosts passing a custom `editHistory` handle to `useEditHistoryActions` must supply `canUndo` and `canRedo` from their history view, alongside the step functions. `usePersistentEditHistory` already supplies these flags.

The sidebar language menu offers English, Simplified Chinese, Japanese, Korean, German, French, Russian, Spanish, Brazilian Portuguese, Italian and Turkish. The first launch still defaults to Simplified Chinese; `motion.studio.locale` stores the preference in browser localStorage and synchronizes it between same-origin windows. Unsupported or removed preferences fall back to Chinese. `studio/src/i18n/messages.ts` owns the supported languages, English message keys, dictionaries, interpolation and locale-aware plural forms; `I18n.tsx` provides the React context and Intl date/number formatting. Missing messages fall back to the English source.

Simplified Chinese interface copy uses “项目” for a project throughout the editor and connection pages. This display terminology leaves English message keys, API fields, project identifiers and local directory names unchanged.

Localization covers editor labels, tooltips, placeholders, empty/error states and the embedded MCP/template dialog. The DOM fragment updates bound labels in place, preserving the selected client, searches and live media. Switching language does not remount the editor, change Dock layout, modify property values or translate authored text, project/template titles, source paths and protocol identifiers. Property sections receive English source titles and translate them only for display, so duplicate translations cannot change their internal IDs. README/Skill/installer translations, third-party template descriptions, copied Agent instructions and long connection guides are outside this interface change. MVP audit additions live in `mvp-zh-CN.json` and currently cover Chinese/English; the other nine locales retain English fallback for these additions, while their shared vocabulary remains intact. New locale dictionaries include machine-translated text; automated key/placeholder checks do not replace native-speaker review.

Header Export opens a compact, right-aligned popover below the button with settings and task history, replacing the MVP Renders tab. Opening it does not start a render; its Export action continues using the native render queue, retaining MP4/MOV/WebM/GIF, resolution, frame rate, quality, cancellation, progress, render history and download. GIF retains native loop-count controls and the 30 fps limit. Composition-row render actions and GPU controls are hidden. 一期插件 `motion_export_request` 仍提供独立的后台快照渲染，供 Agent 使用；不会替代界面的原生导出。

品牌宿主隐藏上游桌面下载推广与反馈邀约，相关上游组件仍保留在源码中。Studio 的原生暗色/浅色偏好由 `hf-studio-ui-preferences` 管理；`data-theme="paper"` 为浅色，无属性为暗色。设计系统变量映射到这一机制，不再使用第二套编辑器主题状态。

前端可以直接修改。CLI 服务、core、parsers、player、SDK 与渲染器使用锁定的 0.9.7 npm 包，并未复制整个 monorepo。桌面端的宿主功能以开源 Studio 的实际能力为准。

## 修改入口

先用 [产品架构](product/architecture.md#职责分层与依赖方向) 判断需求归属；多模态入口、原图修改和后续属性面板接入遵循 [素材生成设计](product/media-generation-design.md)。该设计记录用户意图、候选采用、原生历史与过期目标的边界，本页维护实现位置。

Model configuration and media generation are hidden in the MVP editor. `MediaGatewayProvider` remains mounted for native import; the Gateway backend and external Agent tools are unchanged. Asset context menus expose rename/delete; drag-to-timeline and uploads keep their native paths.

`TimelineMediaBar` and the fallback range `EditPopover` are not mounted in the MVP, so selecting clips, the ruler or a Shift-range does not open an Agent prompt. The legacy generation and image replacement implementation is retained for non-MVP hosts. Existing source writes, revision checks and native history must not be bypassed.

`MediaRequest.anchor` 保存触发元素或时间轴虚拟锚点。`useMediaPopoverPosition` 共用实际浮层尺寸、滚动监听与 `ResizeObserver`：优先放在目标上方，空间不足时翻转或限制高度，保持 8px 间距与 12px 视口边距，不再轮询整个时间轴顶部。片段锚点读取可见片段的位置；范围/标尺锚点换算缩放与滚动后的坐标。空态引导在生成面板打开时隐藏且不可聚焦，保留布局以跟随按钮位置；文件拖入仍显示拖放反馈。是否切换到真实轨道继续由原生元素列表决定，不维护另一个“已插入”标记；关闭面板后仍为空或撤销至空轨道时恢复引导。

| 需求 | 入口 |
| --- | --- |
| Direct editor route and project sidebar | `studio/src/motion/MotionApp.tsx`、`MotionHome.tsx`、`WorkspaceFrame.tsx`、`workspace.css` |
| Save guards and template entry | `studio/src/motion/MotionStudioHost.tsx`、`WorkspaceFrame.tsx`、`useWorkspace.ts` |
| Retained browser runtime (hidden in MVP) | `browser.ts`、`shared/browser.ts`、`studio/src/motion/WebBrowser.tsx`；见 [浏览器架构](browser-runtime.md) |
| Retained session/conversation modules (hidden in MVP) | `studio/src/motion/MotionSessionFrame.tsx`、`ProjectConversation.tsx`、`artifactBrowser.ts`、`shared/session.ts`、`shared/conversation.ts` |
| Legacy home template UI (hidden in MVP) | `studio/src/motion/HomeTemplates.tsx` |
| 宿主插槽 | `studio/src/motion/StudioHost.tsx`、`studio/src/components/StudioHeader.tsx` |
| 模型设置、生成面板、时间轴桥接 | `studio/src/motion/ModelSettings.tsx`、`MediaGenerator.tsx`、`MediaGatewayContext.tsx`、`MotionTimelineMedia.tsx` |
| Legacy non-MVP timeline Agent and media actions | `studio/src/motion/TimelineMediaBar.tsx`、`timelineMediaSelection.ts`；挂载于 `Timeline.tsx` 的原生 Provider 内；定位共用 `mediaPopoverPosition.ts`、`useMediaPopoverPosition.ts` |
| 共享生成合约与服务 | `shared/gateway.ts`、`gateway/`、`server.ts`、`mcp.ts` |
| 原生 Capture、Inspector、Export | `studio/src/components/StudioHeader.tsx` |
| 模板画廊、视频预览、出处与热度 | `web/template-gallery.ts`、`web/template-gallery.css`、`template-catalog.ts` |
| 内置原生模板与工程副本 | `template-library.ts`、`template-library/` |
| MCP 与模板统一弹框、配置下载与 Agent 指引 | `studio/src/motion/ConnectionDialog.tsx`、`web/connect.*`、`shared/integration.ts` |
| 设计变量 | `web/design-system/tokens.json`，执行 `npm run design:tokens` |
| 编辑器主题 | `studio/src/motion/theme.css` |
| Dock 与面板注册 | `studio/src/components/dock/` |
| Legacy preview/layout presets (hidden in MVP) | `studio/src/motion/MotionLayoutControls.tsx` |
| Version-history popover and retained native history API | `studio/src/motion/MotionHistoryPopover.tsx`, `MotionHistoryPanel.tsx` |
| Editor language resources, formatting and language menu | `studio/src/i18n/` |
| 时间轴、片段、关键帧 | `studio/src/player/` |
| 画布、属性与动画编辑 | `studio/src/components/editor/` |
| 素材、合成、Catalog | `studio/src/components/sidebar/` |
| 原生导出队列 | `studio/src/components/renders/` |
| 保存、历史、预览刷新 | `studio/src/hooks/` |
| 浏览器 Agent 工具 | `studio/src/webmcp/` |
| 原生 API 转发 | `editor-server.ts` |
| 工程切换、模板与后台导出 | `server.ts`、`workspace.ts` |

## 服务与工程

`/motion-api/` 为产品 API，`/api/` 为原生 Studio API。流式代理保留文件版本头、上传体、媒体 Range、SSE 文件变化和渲染进度；只有通过本机 Host/Origin 检查的请求才会转发。

切换工程前等待原生保存队列完成，切换后重新加载文档以释放旧编辑会话。原生渲染、版本写入或写冲突期间，所有入口禁止新建、切换工程、返回首页或应用模板。空白项目和三个官方模板均创建为独立工程，原工程与素材保留。通过 URL 恢复工程时只验证工程及会话归属，再挂载对应 Studio 页面；不会切换其他页面。一个原生服务进程按工程请求复用原生宿主上下文，文件版本冲突仍拒绝覆盖。

新工程使用 CLI 默认的官方 Catalog。启动旧工程时，只移除先前版本误写的 `https://hyperframes.heygen.com/registry`，该地址返回 404；用户自定义 Registry 与其他配置不变。

UI 主题不会写入影片 HTML、CSS、GSAP 或 Studio 编辑数据，预览与导出均由原版播放器和渲染器处理。MCP 仍共享同一组原生文件与 revision。

## 构建与验证

```sh
npm ci
npm run dev
npm run build:studio
npm run typecheck:studio
npm run check
npm run test:studio
npm test
npm run package:plugin
```

生产页面使用 `studio/build/`，前端修改后重新构建并刷新。该目录不提交；插件 ZIP 包含运行时源码、构建产物、使用文档和许可证，不包含个人工程、依赖目录或 sourcemap。

`test:studio` 启用完整上游单元与 DOM 测试。迁移适配只涉及包路径、独立仓库样式入口、Happy DOM 21 的 iframe 开关、异步弹层收尾，以及由 jsdom 验证的 WebKit 文本填色。原版 Chrome bench 和 E2E 文件保留，`*.browser.test.ts` 不属于该单元命令。

`npm test` 覆盖原生 API/MCP 双向编辑、revision 冲突、路径隔离、上传、媒体 Range、SSE、工程切换、模板与真实音视频渲染。Registry 迁移测试保证自定义配置不被覆盖。宿主顶栏测试保证 Export 继续走原版回调，渲染中禁止替换当前工程。

MVP regressions cover fixed panels, excluded-panel guards, divider persistence, embedded sidebar state and hidden controls alongside retained edits/exports. Legacy Dock regressions still cover free layouts outside the MVP host. 历史集成测试使用真实服务验证保留版本在重启后仍存在，恢复不删除后续记录，并可撤销恢复。面板测试覆盖保存失败与原生恢复拒绝，确保失败时不重新加载或替换工程。

The editor template modal reuses the gallery controller but hides integration sections. The standalone integration page retains Codex, Claude Code, DeepSeek Harness and stdio configuration/guides. 配置中的数据目录、Node 路径和端口来自当前运行服务；ChatGPT 云端接入尚无远程端点。一期目录发现由 Studio 或指引链接提供，`motion_create_project` 的 template 类型只复制实际内置原生模板；旧目录/详情/应用 handler 仅作内部兼容，不能按一期 Tool 调用。外部参考由 Agent 分析后写入可编辑原生源文件。数据、封面与热度的维护见 [模板目录](template-catalog.md)。

Language regression tests cover all eleven preferences, unavailable storage, same-origin synchronization, interpolation, plural forms and complete dictionary keys. DOM tests check stable section IDs, native property values and label updates without recreating editor inputs, preview iframes or the connection gallery. Real-browser checks remain separate from native-speaker translation and cross-platform acceptance.
