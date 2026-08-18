# dsh-topbar-manager

DeepSeek Harness (DSH) Web 插件：检查并管理顶部工具栏中由其他插件添加的按钮显示/隐藏。

当前版本为 `0.3.0`。按钮显示设置保存在 DSH profile 中，刷新页面或重新打开 DSH 后仍会保留。

默认隐藏：

- `Diff`
- `对话管理`
- `删除本对话`

安装后可在 **设置 → 顶部按钮管理** 中：

- 点击 **检查** 扫描当前顶部栏中由插件添加的按钮；
- 使用 **ON/OFF 开关** 控制每个按钮是否显示。

## 目前明确支持管理的按钮

| 按钮 | 来源插件 | 默认状态 |
| --- | --- | --- |
| Diff | `dsh-checkpoint-diff` | 隐藏 |
| 对话管理 | `dsh-session-manager` | 隐藏 |
| 删除本对话 | `dsh-session-manager` | 隐藏 |
| 撤销/恢复/快照 | `dsh-undo-savepoint` | 显示 |
| 会话改动 | `dsh-what-changed` | 显示 |

> 点击 **检查** 时，同一个插件按钮只记录一次，并根据按钮或其插件容器识别来源。
> 原生 DSH 按钮（包括 `Session log`）和无法确认来源的按钮会被忽略，不会被记录或操作。

## 安装

在 DSH 的 `profiles/web/package.json` 中添加 GitHub 依赖：

```json
{
  "dependencies": {
    "dsh-topbar-manager": "github:baihejiangnan/dsh-topbar-manager"
  }
}
```

然后在 `profiles/web` 目录运行：

```bash
pnpm install
```

并确保 `dsh.profile.bundles` 中包含：

```json
"dsh-topbar-manager"
```

也可以直接使用：

```bash
dsh plugin --profile web add github:baihejiangnan/dsh-topbar-manager
```

然后重启 `dsh web`。

## 使用

1. 打开 **设置 → 顶部按钮管理**；
2. 点击 **检查**，扫描当前顶部栏中插件添加的按钮；
3. 使用开关控制每个按钮的显示状态。

## 反馈

如果发现某个插件顶部按钮无法被本插件识别或管理，欢迎提 [Issue](https://github.com/baihejiangnan/dsh-topbar-manager/issues)。

## License

MIT
