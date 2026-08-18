# dsh-topbar-manager

DeepSeek Harness (DSH) Web 插件：检查并管理顶部工具栏中由其他插件添加的按钮显示/隐藏。

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

> 目前只明确测试了以上按钮。其他插件添加到顶部工具栏的按钮**尚未测试**。
> 如果安装新插件后在顶部栏新增了按钮，可以到 **设置 → 顶部按钮管理** 点击 **检查** 刷新出来。
> 未识别的按钮会标记为“未知插件（未测试）”，你也可以用开关手动控制显示状态。

## 安装

将本仓库放入 DSH profile 的 vendor 目录后，在 `profiles/web/package.json` 中添加：

```json
{
  "dependencies": {
    "dsh-topbar-manager": "file:./vendor/dsh-topbar-manager"
  }
}
```

并确保 `dsh.profile.bundles` 中包含：

```json
"dsh-topbar-manager"
```

或者使用：

```bash
dsh plugin --profile web add file:./vendor/dsh-topbar-manager
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
