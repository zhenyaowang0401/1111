# Eumo v3 · 功能与接口验证记录

最新验证日期：2026-10-27；此前同步陪伴与接口记录为 2026-10-22（Asia/Shanghai）。对象为当前源码、Node 接口和 `dist/Eumo.html`。环境：Python 3.12.14、Playwright 1.62.0、Chromium 154.0.8037.57、Node.js v24.19.0；Vercel 配置目标为 Node 22。

**以下自动化检查使用本地协议 fixture，不代表真实 Qwen 语义质量评测已通过。** 用户已在 Vercel 配置 Key 并提供线上模型回复截图；当前执行环境没有服务商 Key，也无法直接访问该部署，因此没有把用户截图当成完整模型评测。 下表的模型服务使用本地测试 fixture；它验证软件行为，不验证真实模型语气、解题正确性或建议质量。

## V3 金色宝箱修复

原因是房间宝箱只渲染普通 discoveries/inventory，而金色收藏已存入 rareInventory。现两种库存均在宝箱显示，金色操作与图鉴使用同一处理逻辑；不更改掉落率、存档键或已有收藏。

`python tests/test_golden_chest.py` 通过：固定种子下通过真实计时器获得金色面具，宝箱数量、房间 Canvas 金色像素、刷新保留、收回不丢失、取消出售、确认出售仅加 99 星一次、图鉴同步、全部十类、运行/暂停限制、普通头顶展示及手机滚动。测试种子只在隔离浏览器中使用。

`python tests/test_eumo.py` 普通宝箱及原有装扮回归通过；`python tests/test_v3.py` 音频、矿洞、旋转、金色结算及离线版回归通过。V3 测试时钟改在页面初始化前安装，避免存档日期与随后安装的模拟时钟不同步。三个离线入口同步重建。Vercel 生产构建仍需部署后核验。

## V3 矿洞点击修复

按用户提供的空闲 120 米矿洞场景复现：修复前真实鼠标点击后 petSpeech 仍隐藏。原因是 pointerdown 立即捕获到矿洞父容器，将 click 从鼹鼠按钮改派出去。现仅在超过 6 像素拖拽阈值时捕获，释放监听覆盖画面外。

`python tests/test_mine_pet.py` 已通过：真实鼠标和触屏单击/三连点击、实际画布旋转、从角色开始拖动不触发抚摸、返回角色后再点击、奖励不变与运行锁定。另执行 V3 回归，更新三个离线入口。

## 本轮 V3（2026-10-26）

用户已反馈生产好友联网成功；本轮沿用同一个后端，不读取生产密钥或重新建表。以下新功能在本地服务、真实浏览器与离线下载版验证，不能代替 Vercel 新构建的生产检查。

| 实际执行 | 结果 | 范围 |
| --- | --- | --- |
| `node --test tests/test_treasures.cjs` | 4 项通过 | 十万节点 3% 采样、十种物品、拆轮等价、固定刷新结果、结算去重、Demo/Break 排除、展示预留、99 星销售不重复 |
| `python tests/test_v3.py` | 通过 | 真实鼠标拖动/键盘、暂停/运行镜头约束、不改进度；三连点击旋转画布/装备与减少动态效果；真实计时金色奖励/刷新、壁柜像素和出售；四首实际分类、时长、播放和离线原始字节；手机边界 |
| `python tests/test_music.py` | 通过 | 五首可用目录，音量/进度/循环/下一首、刷新无自动播放、失败重试、窗口/手机、未来扩充与缺文件构建保护 |
| `python tests/test_viewport.py` | 通过 | 13 组桌面/DPI、空闲/运行/暂停，完整侧栏与底部按钮，无需缩放，手机与离线布局 |
| `python tests/test_daily.py` / `tests/test_geology.py` | 通过 | 每日返地面、保留累计、跨午夜、时钟/DST；真实两小时的地层与 24 星/12 普通发现物不变 |
| `python tests/test_eumo.py` / `tests/test_supermo.py` | 通过 | 旧装备/工具、普通宝箱、家园家具与摆放、睡眠呼吸、抚摸和历史存档 |
| `python tests/test_site.py` / `tests/test_entry.py` | 通过 | 英文界面、实际画布、暂停继续计时、报告、午夜、旧存档、24 个响应式视图、受限 iframe |
| `python tests/test_journey.py` / `tests/test_companion.py` | 通过 | 奖励累计/重载去重、MP3 和双音宠物声、日程报告；学习/暂停/继续/结束同步陪伴顺序不变 |
| `node --test tests/test_ai.cjs tests/test_friends.cjs` / `python tests/test_friends_browser.py` | 16 + 6 项 / 浏览器通过 | 原模型代理契约、隐私、安全、状态；真实 PostgreSQL 和两个独立好友浏览器，非生产服务验证 |
| 构建、15 个脚本语法、音频与文件对比 | 通过 | 三个 HTML 字节相同；四个上传文件原样匹配，原 Warm Focus 不变；五首内嵌且默认曲目只存一次 |

测试发现旧计时浮点边界会把完成的 Demo 深度写成 4.999999… 米，界面取整成 4 米；现按输入时钟的毫秒精度累计任务及每天时间。暂停继续、正式累计、跨午夜和日常回归通过。睡眠边界测试先对齐测试时钟的 idleAt，避免测试操作耗时影响 90 秒断言。

新增界面图片 `eumo-v3-*.png` 使用测试存档，收藏/星星数不是玩家生产数据。新金色元数据保留中文名，游戏可见名称继续使用英文。

## 上一轮真实好友模块（2026-10-26，接入前记录）

**此段为接入前的历史验证记录。** 随后用户完成 Supabase 项目、建表与 Vercel 变量并反馈联网成功；本环境没有独立访问生产数据库。

| 本轮实际执行 | 结果 | 范围 |
| --- | --- | --- |
| `node --test tests/test_friends.cjs` | 6 项通过 | 执行真实 PostgreSQL 建表与 RPC；双方同意、反向/重复请求、第三人越权拒绝、删除/拒绝/撤回、暂停共享与在线时间隐藏、持久化请求限流、表/RPC 角色权限、随机 HttpOnly 身份/哈希、摘要白名单、现代 secret key 头部、接口限流/超时/私密错误 |
| `python tests/test_friends_browser.py` | 通过 | 两个独立浏览器 → Node API → 本地 RPC 传输 → 真实 PostgreSQL；复制代码、请求/接受、正式学习/暂停、名字颜色/工具/装备、真实空闲睡眠、共享暂停恢复、身份刷新、Away/Offline、断线标为最后更新、删除双方同步、拒绝/撤回、XSS、手机窗口、缺配置不造假与恢复、离线演示 |
| `python tests/test_world.py` | 通过 | 原命名/配色/时钟、四只演示鼹鼠画布、展开库存和响应式 |
| `python tests/test_entry.py` | 通过 | 受限 iframe、创建、导航、无耳朵图形与演示好友 |
| `python tests/test_chat.py` | 通过 | 原聊天接口、隐私、故障恢复、静态服务私有路径与下载版 |
| `python tests/test_companion.py` | 通过 | 开始/暂停/继续/结束/返地面的陪伴状态不被新模块改变 |
| `python tests/test_viewport.py` | 通过 | 13 组桌面/DPI 和三状态的 100% 适配；原音乐/聊天布局保持可见 |
| `node --test tests/test_ai.cjs` / `node tests/test_rewards.js` | 16 项 / 奖励检查通过 | 原 AI 接口契约和奖励口径不变 |
| 单文件构建、13 个浏览器模块语法与资源检查 | 通过 | 三个 HTML 相同，原 MP3 不变且只内嵌一次；服务端 Supabase key 和认证随机值不进入浏览器代码 |

真实好友由服务端随机 Cookie 身份和数据库关系决定，四只演示角色没有注册为假用户。测试的 PGlite 数据库仅存在开发进程中，不作为生产数据库；Supabase 网络、项目权限和 Vercel 环境变量仍需按 [FRIENDS_SETUP](FRIENDS_SETUP.md) 完成后实测。

![本地双浏览器的真实好友卡片](images/eumo-friends-live.png)

## 上一轮音乐模块（2026-10-26）

| 本轮实际执行 | 结果 | 范围 |
| --- | --- | --- |
| `python tests/test_music.py` | 通过 | 真实原 MP3 播放、暂停、进度、音量、循环；三分类与五个不可点占位；无初始音频请求；未来曲目上下首及自然顺序切换；刷新不自动播放；404 重试；计时与页面切换不中断；手机/横屏与断网下载版；新增音频打包、缺文件失败及 Range 读取 |
| `python tests/test_viewport.py` | 通过 | 13 组桌面窗口/DPI × 待机/运行/暂停，100% 完整显示；新图标不撑大主页面 |
| `python tests/test_site.py` | 通过 | 原计时、宠物、装备、报告、音频与响应式回归 |
| `python tests/test_journey.py` | 通过 | 奖励与暂停、跨页面音乐、原 MP3、独立宠物声音及断网单文件 |
| `python tests/test_chat.py` | 通过 | 现有聊天、隐私、API、静态服务访问限制与下载版 |
| `node --test tests/test_ai.cjs` | 16 项通过 | 原服务端人设与接口契约 |
| 构建、语法与资源检查 | 通过 | 12 个 JS 内嵌，三份下载文件相同；原 MP3 字节不变且只存一次，目录共享默认源；缺失的新音频不静默跳过 |

此次没有生成新的用户音乐。新增的 Groove/White noise 卡片仅为未添加的曲目位置；未来音频使用测试临时文件验证扩充，不随游戏发布。测试发现普通 Python 静态服务不能保证音频跳转，因此 Node 开发服务补充 Range，播放器按实际 seekable 状态启用拖动。音乐小卡片在矮屏隐藏，分类和完整控制仍可从图标打开。

![真实音乐库界面](images/eumo-music-library.png)

## 上一轮同步陪伴修正（mole-companion-1.1）

| 本轮实际执行 | 结果 | 说明 |
| --- | --- | --- |
| `node --test tests/test_ai.cjs` | 16 项通过 | 包括完整活动矩阵、当前 session 优先于旧日终、历史后注入最新事实、场景示范与种子数据、共享关闭、Key/错误边界 |
| `python tests/test_companion.py` | 通过 | 真实 Study/Work 开始、暂停、继续、取消结束、提前结束、自然到时；Today 完成后才返地面；Break/Demo；旧 AI 历史隔离；迟到回复取消与草稿保留；多次换装/刷新；共享关闭 |
| `python tests/test_chat.py` | 通过 | 现有 API、上下文、多轮、换装、隐私、错误恢复与下载版回归 |
| `python tests/test_daily.py` | 通过 | 普通结束留在矿道，完成今日总结返地面、持久化/重绘与日界线等已有行为 |
| `python tests/test_site.py` | 通过 | 暂停结算、计时报告、装备、响应式等原功能 |
| `node tests/test_rewards.js` | 通过 | 奖励口径保持原规则 |
| `node --check`、种子导出与下载构建 | 通过 | 更新 42 条示范、28 条独立评测场景；三份 HTML 相同 |

按钮台词为本地确定性反馈，不额外请求模型。测试服务只验证真实程序的上下文/事件顺序与错误恢复；没有使用用户曾发在聊天里的 Key，没有进行权重训练，没有声称 28 个真实模型场景已获通过。

下面的十脚本完整回归是上一轮 1.0 接入时的执行记录；当前修改按上表复测受影响的功能，并新增 companion 流程。

## 上一轮完整回归记录（1.0）

| 检查 | 结果 | 范围 |
| --- | --- | --- |
| `python scripts/build_standalone.py` | 通过 | CSS、十个 JS、原 MP3、字体和许可内嵌；重复生成一致，三个入口相同 |
| 十个浏览器 JS 与新增服务端/开发脚本的 `node --check` | 通过 | JavaScript 语法 |
| `node --test tests/test_ai.cjs` | 13 项通过 | 真实规则与物品目录、上下文关闭、Demo/Break 排除、system/tool 过滤、地址/模型不可由客户端更改、Key 隔离、限流、超时、错误和思考块处理 |
| `python tests/test_chat.py` | 通过 | 浏览器 → Node 代理 → 本地协议 fixture；换装无暗中调用、真实时间/任务/装备、多轮、IME、共享关闭、失败重试、纯文本 XSS、历史/清空、计时不中断、同源下载版和缺 Key 提示 |
| `python tests/test_entry.py` | 通过 | 两种受限 iframe、START/Enter、中文名称、受限 History、真实计时与无耳朵像素 |
| `python tests/test_site.py` | 通过 | 眨眼、抚摸/禁摸、叠穿与刷新、Study/Work/提前结束/跨午夜、报告、声音、旧存档与响应式 |
| `python tests/test_world.py` | 通过 | 实际角色颜色、命名、创建/取消/修改/刷新、四时段、设备时区、同伴和响应式 |
| `python tests/test_journey.py` | 通过 | 跨轮奖励与去重、真实路径拾取、Demo/Break 口径、家园、今日确认、音频波形与断网单文件 |
| `python tests/test_supermo.py` | 通过 | 宝箱数量/刷新、睡眠阈值/呼吸/鼻涕泡/唤醒、暂停、歌曲时长、实际地层与手机编辑 |
| `python tests/test_eumo.py` | 通过 | 服装分类/购买/互斥、旧存档、家园头顶展示、6 工具、奖励不变、商店独立滚动和字体 |
| `python tests/test_daily.py` | 通过 | Today 完成后返地面与立即重绘、取消/刷新/隐藏动画、保留成果、午夜/时区/DST、真实材质与响应式 |
| `python tests/test_viewport.py` | 通过 | 13 组桌面窗口/DPI × 三种状态，完整画面/计时/按钮/页脚，2.55:1 对齐与聊天窗口边界、紧凑间距、手机及断网交互 |
| `python tests/test_geology.py` | 通过 | 普通 120 分钟真实程序流程，119:59 前泥土、240m 才见石层、24 星/12 件结算、后续地层与返地面 |
| `node tests/test_rewards.js` | 通过 | 奖励阈值、拆轮等价、零头、无硬上限、Demo、Break、稳定事件 |
| `node scripts/export_sft.cjs` | 通过 | 当前 42 条原创示范导出为 JSONL；系统提示词文本与真实服务端规则一致；不是权重训练 |
| `node scripts/evaluate_ai.cjs new-glasses` | 缺 Key，预期退出码 1 | 明确输出未执行真实模型评测；不创建假的质量报告 |
| 资源一致性与文档链接 | 通过 | 原 MP3/TTF 的 base64 解码字节一致、完整 OFL、无 Key/Authorization 头进入客户端、相对文档链接存在 |

十个浏览器脚本均获得退出码 0。长计时和日期变化使用加速时钟，只验证程序行为，不证明用户现实中专注。接口测试中的 13 项不能解读为“模型质量通过 13 项”。

## 界面证据

![完整布局](images/eumo-fit-desktop.png)

![完整对话窗口（回复来自测试 fixture，不是 Qwen 实测）](images/eumo-ai-conversation.png)

![手机聊天框](images/eumo-chat-mobile.png)

桌面窗口包含 2560×1320、2048×1050、1920×960、1680×860、1600×780、1536×730、1440×768、1366×650、1280×600、1024×640，另在 DPR 1.5 下复测三组。手机允许正常纵向滚动。

## 下载文件

```text
主入口: dist/Eumo.html
兼容入口: dist/Supermo.html、dist/LOOP_PET.html
字节数: 21958854
SHA-256: de71f5ff6a90dd7236a9c285db90f2dbcc9be1dddb01807eec72815c8771821a
MP3: Warm Focus 194.520秒；Winter bonfire 12.168秒；Tropical rainforest 13.416秒；botanicore 213.552秒；Litte ridge 222.840秒
Logo 字体: Pixelify Sans variable TTF, 79160 字节, SIL OFL 1.1
```

同站提供的单文件可以访问该站 /api/chat；直接 file:// 不具有 Node 接口。游戏存储键沿用 loop-pet-soft-universe-v1，聊天使用独立键 eumo-mole-chat-v1；没有账号云同步或服务端聊天数据库。

## 尚未完成的外部验证

- 在新版本部署后核验真实模型的同步陪伴回答；本轮未直接持有或调用用户的服务商 Key。
- 按独立的 28 条 rubric 人工评估真实模型的角色、事实、答题与日程质量。
- 直接核验新 Vercel 部署。当前环境访问该域名的出站代理返回 CONNECT 403，不能据此判断网站是否可用；用户已展示此前版本的线上回复。
- 未进行模型权重训练或 LoRA/SFT。当前只是系统提示、few-shot 示例与导出的种子数据。

离线测试通过本地 HTTP 加载后断网；受管理 Chromium 禁止 file:// 导航，没有声称在此环境验证双击文件。实例内限流不构成分布式全局成本上限，部署配置与边界见 [AI_SETUP](AI_SETUP.md)。
