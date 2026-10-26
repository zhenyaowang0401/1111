# 真实好友：Supabase 配置与使用

代码支持真实数据库中的双向好友、好友码、请求、删除与状态共享。**本次只在本地两个独立浏览器和真实 PostgreSQL 中完成验证；线上仍需下面的数据库与 Vercel 配置。** 没配置时只显示明确的不可用提示，不生成假的好友码或伪造在线玩家。

## 管理者首次配置

1. 打开 [Supabase](https://supabase.com/dashboard/sign-in)，用 GitHub 登录。如果要求创建 Organization，选择 Free。新建一个项目，例如 `eumo-friends`；数据库密码自己保存，不发到聊天或 GitHub。地区可先保持默认，等待数据库创建完成。
2. 进入 SQL Editor，新建查询，将仓库 [database/friends.sql](../database/friends.sql) 的**全部内容**粘贴进去，点击 Run。可以从 [GitHub 原始文件](https://raw.githubusercontent.com/zhenyaowang0401/1111/main/database/friends.sql) 复制。脚本建表、开启 RLS、限制角色权限，并创建服务端使用的原子操作函数；重复执行不清空现有表。
3. 在项目的 Connect / Project settings 中找到 Project URL；在 API Keys 中取得服务端的 secret key 或旧版 service_role key。不要使用 anon / publishable key。密钥只填写到 Vercel，不要发到聊天，不要放前端或 GitHub。
4. 打开对应 **1111-phi-ten.vercel.app** 的 Vercel 项目，Environment Variables 添加：

| 名称 | 值 |
| --- | --- |
| `SUPABASE_URL` | 该项目的 HTTPS Project URL，例如 https://your-project.supabase.co |
| `SUPABASE_SERVICE_ROLE_KEY` | 该项目的服务端 secret key，或旧版 service_role key |

选择 Production。保留原 AI 变量。保存后 Redeploy 最新 main，等 Ready 后打开 [Friends](https://1111-phi-ten.vercel.app/#companions)。旧域名的环境设置独立，不能只在另一个 Vercel 项目添加变量。

5. 用两个独立浏览器或两台设备实测：各自创建鼹鼠，进入 Friends → Add friend → Enable online friends；一人复制好友码给另一人，另一人发送请求，收件人接受。此时双方才看到真实卡片。开始、暂停学习后用 Refresh 或等待 15–30 秒；最后删除好友，确认双方都不再显示对方。

管理者登录 Supabase 是为了配置数据库。玩游戏的人不需要登录 GitHub 或注册 Supabase。

## 用户界面与身份

- 页面名为 Friends，右上角为 Add friend 图标。自己的代码格式为 `EU-XXXXX-XXXXX`，可复制，但它不是登录密码。
- 首次 Enable online friends 明确说明共享内容。服务端创建随机浏览器身份，用 HttpOnly cookie 保存，数据库只存其 SHA-256；有效会话滑动续期一年。前端和 localStorage 不保存认证密钥。
- 好友码只能发送请求。对方接受后才成为双向好友；单方面发送、知道某人 ID 或猜中请求 ID 都不能查看其状态。
- 支持接受、拒绝、撤回、删除；删除后双方失去状态访问，需要新的请求才能恢复。
- 四只原演示鼹鼠保留在单独可折叠的 Demo moles 区域，明确标注示例，不能变成真实好友。
- 此版身份属于当前网站、当前浏览器，不是邮箱账号。重新打开同一浏览器可保留朋友；清除网站 cookie、换浏览器或换域名不会恢复这份身份。没有账号找回、跨设备登录或游戏进度云存档。游戏的原本本地进度保持原规则。

## 分享哪些内容

接受后的好友可以看到名字、鼹鼠颜色和装备、当前工具、学习/工作/暂停/休息/试玩/困倦/睡眠状态、本人当地日期的 Study/Work 秒数、可调整的每日专注目标、矿道/累计深度和发现物数量。Demo 和 Break 不计正式专注时间；当天标签以共享者提供的当地日期为准。

不发送任务、成果笔记、AI 聊天、API Key、邮箱、音乐设置或完整存档。暂停共享后，好友仅看到既有名字/颜色和“Sharing paused”，看不到时间、物品或最后在线时间；恢复后重新同步当前摘要。

这些数值来自游戏的浏览器记录，不是摄像头/注意力验证，也不是防作弊排名数据。

## 状态时效

- 在 Friends 页面每 15 秒刷新，其他游戏页约每 30 秒上报；明确显示轮询频率，不声称即时 WebSocket 推送。
- 后台或离开时尽力用 beacon 标记 Away。关闭页面或网络中断不保证收到该信号，超过 90 秒没有心跳就显示 Offline。
- Presence 时间由数据库记录；客户端用服务端时间和单调时钟判断超时，不拿用户本地时钟当在线凭证。
- 离线的摘要标明最后共享的状态和日期，不自动让好友继续挖。网络失败显示最后更新/连接中断；不会将本地演示角色当作远端玩家。
- 名字、颜色、装备与鼹鼠动作同步到原来的卡片与像素画布；浏览好友或复制代码不改变计时、音乐、奖励。

## 实现和验证

浏览器 → 同源 `POST /api/friends` → 服务端 Supabase RPC → PostgreSQL。`api/friends.js` 校验请求来源、JSON 大小、动作、代码/UUID，并只传白名单摘要；服务端 key 不进入浏览器。`database/friends.sql` 负责原子请求与权限，匿名/普通浏览器角色不可直接读表或调用 RPC。

安装开发测试依赖后：

```sh
npm ci
npm run test:friends
python tests/test_friends_browser.py
```

测试使用 PGlite 的真实 PostgreSQL 引擎和本地 Supabase RPC 传输，不是内存数组假好友。验证互相接受、越权拒绝、拒绝/撤回、隐私暂停、删除后双方失去访问、RLS/函数权限、HttpOnly/哈希认证和双浏览器实际页面。它不替代配置完 Supabase 后的线上验证。

本地运行联网接口时，在被 Git 忽略的 `.env` 中配置上述两个变量，然后 `npm run dev`。Python 静态服务器、GitHub Pages 与直接打开 HTML 只能玩本地游戏和演示好友，不能提供真实好友后端。

## 当前范围

服务端每实例按 IP 限流，数据库还对每个身份的加好友尝试按小时计数、限制待处理请求。实例内限流不是全局流量或费用上限；公开推广前应按真实流量评估注册防滥用、账号恢复和共享限流。Supabase 免费项目可能休眠，恢复后重试；实际额度以服务商控制台为准。当前没有聊天私信、在线对战或全球玩家目录。
