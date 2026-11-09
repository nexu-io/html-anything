# @odsuite/cli · private workspace

本仓唯一工具入口 `odsuite`，由 suites/cli 构建并通过 workspace 接入。Node24 / pnpm11.13.0；先安装并显式构建，再执行：

```sh
pnpm exec odsuite guard
pnpm exec odsuite guard --root /path/to/repo --json
```

没有独立 guard 或 Daemon 命令。配置只读取 repo/odsuite.yaml，完整扫描文件系统；退出码 0 通过、1 规范发现、2 操作错误。版本/构建/发布子命令的已有实现属于工程参考，不表示 Motion 的 Codex/standalone 发布已经支持。

本套件是私有仓内模块，只由本仓 workspace 提供、不单独发布。职责与当前状态见 [AGENTS](../../AGENTS.md) 和 [运维](../../docs/operations.md)。
