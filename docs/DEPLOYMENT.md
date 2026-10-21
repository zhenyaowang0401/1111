# 部署说明

## 当前在线入口

用户在 Eumo 工作区的 Vercel 项目 `1111` 配置了服务端 AI 密钥，正式域名为 **https://1111-phi-ten.vercel.app**。仓库 README 的在线入口应使用这个域名；GitHub 右侧 About → Website 也应填写同一地址。

旧域名 `1111-alpha-nine.vercel.app` 的环境变量与新项目独立。两个站点即使都收到相同 GitHub 提交，也不会共享密钥；旧站的“未配置 AI”提示不表示仓库没有更新。更换访问域名不会自动迁移浏览器本地存档。

## 当前交付方式

本仓库包含：

1. 根目录的静态源码入口 `index.html`。
2. 已生成、可下载后离线打开的 `dist/Eumo.html`。
3. 可重复生成单文件的构建脚本。

静态游戏不需要数据库或 Key。新增的 AI 聊天是可选 Node 后端，需要服务端环境变量；Vercel 的部署和最后一步 Key 配置见 [AI_SETUP](AI_SETUP.md)。提交仓库内容不等于自动获得公网游戏网址。

## 本地服务

```sh
python3 -m http.server 8000
```

从项目根目录启动后，浏览器访问 `http://localhost:8000/`。在 Windows 上也可以用 `py -m http.server 8000`。

本地链接只供这台电脑使用，不能当作别人可以访问的线上地址。

## GitHub Pages

仓库所有者可以手动启用：

1. 打开仓库 **Settings → Pages**。
2. Source 选择 **Deploy from a branch**。
3. Branch 选择实际包含项目的 **main**，文件夹选择 **/(root)**。
4. 保存并等待 GitHub 的部署任务完成。
5. 使用 Pages 设置页显示的实际网址。

这里使用根目录 `index.html`，因此不需要上传额外构建产物、设置前端包管理器或运行 npm。应用的相对资源路径与 URL 片段导航适合仓库子路径部署。

如果仓库权限、可见性或账户方案没有提供 Pages 选项，应由所有者在 GitHub 检查设置。此文档不会将仓库改为公开，也不会虚构一个已上线网址。

## 发布后的检查

- 从 Pages 显示的网址进入，确认创建页、START 和各图标可用。
- 运行 15 秒试玩，确认完整结算。
- 检查资源请求没有 404，Warm Focus 音乐须由用户点击后启动。
- 刷新，检查在该站点当前浏览器中的存档是否保留。

本地地址和 Pages 站点属于不同存储来源，应用目前不会自动迁移二者的存档。

## 更新网站与下载版

每次修改源码后：

```sh
python3 scripts/build_standalone.py
python3 tests/test_entry.py
python3 tests/test_site.py
python3 tests/test_world.py
python3 tests/test_journey.py
python3 tests/test_supermo.py
python3 tests/test_eumo.py
python3 tests/test_daily.py
python3 tests/test_viewport.py
python3 tests/test_geology.py
python3 tests/test_chat.py
python3 tests/test_companion.py
node --test tests/test_ai.cjs
node tests/test_rewards.js
```

提交源码与 `dist/Eumo.html`。如果 Pages 已绑定相同分支，GitHub 会按仓库配置执行更新；仍应检查实际部署结果。
