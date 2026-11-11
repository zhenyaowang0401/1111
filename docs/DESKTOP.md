# Eumo Windows / macOS 客户端

## 下载

- [网页版](https://1111-phi-ten.vercel.app/#focus)
- [GitHub Releases：所有客户端、版本说明和校验和](https://github.com/zhenyaowang0401/1111/releases/latest)
- [Windows x64 安装程序](https://github.com/zhenyaowang0401/1111/releases/latest/download/Eumo-Windows-x64-Setup.exe)
- [Mac Apple 芯片 DMG](https://github.com/zhenyaowang0401/1111/releases/latest/download/Eumo-macOS-arm64.dmg)
- [Mac Intel DMG](https://github.com/zhenyaowang0401/1111/releases/latest/download/Eumo-macOS-x64.dmg)

这些资产由 GitHub Actions 在 Windows / macOS 上构建，全部成功后统一发布。首次构建完成前，下载链接不会有文件。源码 ZIP 与安装包不同。

Windows 为 Windows 10 / 11 x64；Mac 使用 Electron 45 支持的 macOS 版本。两种芯片有各自安装包。首版没有 Windows 发行者签名，也没有 Apple Developer ID 签名或 Apple 公证；Mac 仅进行运行所需的 ad-hoc 签名，不代表 Apple 认证。系统可能要求确认未知发行者。请从本仓库 Releases 下载，校验和见 SHA256SUMS.txt。

## 窗口与存档

- 主窗口保留 Windows / Mac 自己的窗口控制，尺寸随屏幕适配。
- Float mole 使用原生无边框置顶窗口。顶部名字区域可拖动，返回图标恢复主窗口，× 只关闭小窗。
- 小窗存在时关闭主窗口会隐藏主窗口，计时和奖励仍由原主窗口管理；没有第二份计时器。完全退出请用菜单 Quit。
- 本地计时、装扮、家园、音乐和报告随安装包离线提供。聊天与好友使用现有 HTTPS 服务；离线或证书异常时显示连接失败，不会忽略证书验证。
- 网页与客户端分别保存本地数据，不自动同步。Help → Move / back up progress 可以导出 JSON 并在另一端导入。请先暂停计时。导入要确认替换；聊天记录和好友登录凭据不导出，好友需在新客户端重新连接。
- 普通更新沿用 Eumo 的应用数据目录。卸载、清理应用数据之前请备份。

## 构建与发布

Node 22，运行 `npm ci`。本地开发：`npm run desktop:dev`。

- Windows：`npm run desktop:pack -- --win --x64`
- macOS：`npm run desktop:pack -- --mac --arm64` 或 `--mac --x64`
- 单元测试：`npm run test:desktop`
- 原生窗口测试：`npm run test:desktop:smoke`（需要图形桌面）

`desktop/web` 由 `scripts/prepare_desktop.cjs` 从当前网页源码构建，不能手工修改。它只包含页面、样式、浏览器脚本与 assets，排除服务端代码、密钥、数据库和工作区文件。安装程序在 `desktop-dist`，不提交二进制安装包到 Git。

推送 `desktop-v*` 标签触发 `.github/workflows/desktop-release.yml`：Windows x64、Mac arm64、Mac x64 各自做原生窗口测试，再构建，全部成功后发布 Release。手动运行工作流只生成 Actions artifacts，不发布 Release。更新网页不会自动更新已安装客户端，需要发布新版本，用户通过菜单 Download updates 下载。

## 安全边界

Renderer 禁用 Node，开启 sandbox/contextIsolation/webSecurity。固定网站 origin 在 Electron 内映射到本地打包资源，使原网页的相对路径、存档和客户端代码保持一致；仅 `/api/chat`、`/api/friends` 转发到真实 HTTPS 服务。好友 cookie 只保存在主进程管理的 HttpOnly cookie jar 中。外部网页交给默认浏览器，不能在有 preload 的窗口里执行。没有关闭 TLS 检查，没有把 AI 或数据库密钥带到客户端。
