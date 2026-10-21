# 技术与数据结构

原生 HTML/CSS/JavaScript、Canvas 2D、HTMLAudio 与 Web Audio。没有运行时框架、CDN 或后端。Python 构建并执行浏览器测试。

## 模块

| 文件 | 职责 |
| --- | --- |
| `index.html` | 宠物创建、六个游戏页、对话框、图标与音频元素 |
| `app.js` | 状态迁移、导航、计时区间、结算、报告、装备、家园与样例同伴 |
| `journey.js` | 纯计算：奖励资格、速度、稳定路径事件、已经过节点与奖励 |
| `terrain.js` | 世界坐标下的七段地层、色块过渡、碎石、根系藤蔓和低频生态绘制 |
| `wardrobe.js` | 7 帽/5 衣/5 围脖/6 眼镜/1 旧胸针与 6 工具的分类价格、同类互斥和存档校验 |
| `wardrobe-art.js` | 商店图标与实际角色共用的像素模型、独立工具动画 |
| `home.js` | 家具、价格、摆放兼容性、主题与位置元数据 |
| `pixel-art.js` | 共用无耳朵角色、地形、同一路径物品、家园、待机与跳跃 |
| `world.js` | 设备本地时间、时区和四个昼夜色板 |
| `audio.js` | 用户提供的 MP3 循环播放、音量及独立双音抚摸声 |

## 计时与一次性结算

运行区间从 `trackedAt` 计算到 `min(now, deadline)`，并限制剩余计划时长；不是根据回调次数累加。每次暂停、导航、隐藏页面、保存或结束前更新。跨午夜按本地日期分别记入 Study/Work。

当前 `session.elapsed` 保存已运行秒数；`baseEligible` 是本轮前累计的普通合格秒数。`Journey.events()` 在跨过每 300 秒/600 秒时生成星星/发现物位置。物种依据累计发现点稳定选择，不因拆轮、刷新或渲染帧率变化而重抽。Demo 为独立的第 9 秒发现物与第 15 秒星星。

渲染和结算读取同一份事件。节点经过后隐藏，成为本轮收入；`finishSession()` 原子地保存余额、数量、深度、历史及空会话，刷新不会再结算已结束任务。提前结束也保存已经过节点。后台跨过多节点时批量补算，不要求用户看着动画。

到期停止，不自动连开。设备时钟仍是时间基准，没有服务器校时或真实注意力验证；开发者 Demo 有意允许反复获得可消费资源。

## 本地存储与迁移

键仍为 `loop-pet-soft-universe-v1`；`progressVersion: 2` 标记本次迁移。

| 字段 | 含义 |
| --- | --- |
| `profile` | 名字、颜色、是否创建 |
| `surfaceDepth` / `digDay` | 本次矿道的累计深度基准和设备日期；当前深度为 depth - surfaceDepth 加本轮进度 |
| `depth` / `inventory` / `balance` | 已保存的累计深度（允许小数）、四种发现物数量、货币 |
| `owned` / `equipped` | 服装拥有列表；帽/衣/围脖/眼镜各一件，Extras 可同时保留 |
| `ownedTools` / `tool` | 已兑换工具 ID 列表与当前工具；null 表示免费默认镐子 |
| `eligibleSeconds` | 已结束普通 Study/Work 的累计秒数，用于跨轮奖励零头 |
| `session` | 唯一 ID、类型、运行状态、计划、截止时间、实际 elapsed、baseEligible、baseDepth、任务与 daySeconds |
| `history` | 会话 ID、任务、可选成果、实际时长、奖励、经过节点 ID、结束状态、是否 Demo、按日时间 |
| `reportDays` | 每天 Study 的 seconds/completed 与 Work 的 workSeconds/workCompleted |
| `home` | 当前主题、已拥有主题与家具、四个位置的物品 ID |
| `musicVolume` | 背景音量；迁移旧 rainVolume，不保存自动播放意图 |
| `heldItem` | 沿用旧字段名，现表示仅家园的头顶发现物 ID 或 null；与摆放共用库存约束 |
| `lastTask` / `idleAt` / `simpleView` | 上次任务、最后交互时间、是否收起动画 |

旧余额、装备、背包、深度与 Study 汇总保留。旧单件装备迁移为数组；旧 Work 历史补入报告（没有区间的旧 Work 按历史结束日计入，不能重建已经丢失的暂停或跨日细节）。原先的 `totalSeconds` 曾包含 Demo，因此报告统一从 `reportDays` 读取，不用此旧字段表示正式专注总量。

存储不可用时以内存运行并提示不持久化；不为了启动预览要求增加 iframe 权限。名字、任务、成果使用文本或 HTML 转义。家园只读取已知 ID。

## 导航与家园

`start`、`focus`、`home`、`rewards`、`wardrobe`、`reports`、`companions`。首次未配置时进入设置，回访根地址进入 Focus。先渲染再尝试 History API；表单受限 iframe 的 START/Enter 走显式事件。

查看页面不会暂停；Pause & decorate 才暂停。家园购买和位置更新同步保存；发现物摆放不扣数量，但不能超过背包数量。购买家具移动不重复扣费。编辑状态只在本次页面生命周期存在，刷新回到查看模式。

## 声音、动画与单文件

HTMLAudio 播放 `assets/audio/warm-focus-3.mp3`，由用户点击启动，不重新合成或修改歌曲。独立 Web Audio 产生两段带轻泛音、气声和音高弯曲的 sine 基音，包络峰值 0.30，经过压缩器；不随音乐音量改变。`tests/test_journey.py` 使用 OfflineAudioContext 测量两段波形和中间间隔。

角色绘制共用函数，支持眨眼、困倦、睡眠和暂停休息。requestAnimationFrame 限速；简洁视图跳过矿洞绘制；系统减少动态效果禁用跳跃并固定动画帧。

构建脚本内嵌 CSS、九个 JS 模块、Pixelify Sans TTF 与 MP3 原始字节的 base64，并附带完整 OFL 许可。`dist/Eumo.html` 为生成文件，必须从源码重建，不能单独修改。

## 有界商店与字体

桌面宽度至少 960px、可用高度至少 600px 时，主容器同时受视窗宽高约束。先取对话留白 `R = clamp(108px, 14dvh, 144px)`，再计算左栏宽度上限 `L = (100dvh - 306px - R) × 384/224 + 36px`；主容器上限为 `min(1400px, L + max(270px, L/2.55) + 20px)`，为导航、标题、画框和页脚预留空间。Grid 使用 `2.55fr minmax(270px, 1fr)` 并拉齐高度；左栏 flex 列中的 `#moleDialogueSpace` 包含带命名区域语义的复古聊天窗口；`#toggleMoleChat` 更新 aria-expanded 和内容 hidden 状态，不更改计时或存档。renderProfile 用 textContent 和 CSS 颜色变量同步头像与名字。输入及 Send 暂时禁用，没有 AI 依赖、网络调用或新增存储字段。右栏计时区 flex:0，以固定间距按顺序排列，避免多余高度集中堆在倒计时上下。短屏进一步收紧间距，720px 以下将时长调整放到计时旁，音乐与动画按钮同排。Canvas 保持原始比例，不通过 zoom、transform 或裁剪模拟适配；计时数字最低 44px。手机仍采用纵向布局和正常滚动。

`.wardrobe-layout` 桌面高度随视窗约束，`.closet` 和 `.fitting-room` 使用 min-height:0。`#shopScroll` 为独立、可聚焦的 overflow-y:auto 区域；分类在区域外，避免滚动后找不到筛选。只在切换分类/筛选时复位滚动，购买不替换滚动容器。预览按容器宽高计算尺寸，保持 Canvas 实际宽高比和点击坐标；手机改为紧凑预览加有界商店。

常规界面使用系统字体，计时采用 tabular-nums 并移除像素阴影；Logo 的 Pixelify Sans 资源在 assets/fonts。构建时校验唯一字体 URL，替换为 data URI，并内嵌许可；不增加在线请求。

## 两小时土层与材质解锁

普通 Study / Work 每 30 秒挖 1 米，根土延长至 240 米，之后在 300、360、480、600、720 米切换沙、板岩、花岗岩、晶矿与玄武岩。`Terrain.paint` 接收实际 `worldDepth`，将画面中每格的材质深度限制为 `min(tileDepth, worldDepth)`；否则镜头看得到脚下未挖地面，会在两小时前露出石头。过界后才以稳定随机图案混入少量上一层颜色。石层改为淡紫灰底和稀疏、阶梯轮廓的扁平石子，删除重复方框与浮雕边；土层只画土屑。规则只影响绘制，不修改 Journey、计时、奖励或存档字段。

## 睡眠与宝箱

`petMood()` 根据无会话时的 idleAt 决定 awake / drowsy / asleep，暂停或 Break 为 rest。状态写入 body 的 data-pet-state 供可访问状态与验证使用。睡眠矩形坐标在整数网格压缩，形成多级呼吸；zzz 与鼻涕泡单独绘制。

房间使用由整像素横条组成的椭圆 Path2D 作为轮廓和裁剪，家具按各自 scale/foot 对齐基线。实际宝箱有独立 DOM 命中按钮和模态列表，避免画在 Canvas 里却不能点击。头顶展示和摆放共用存档，移动副本不扣库存。宝箱采用选择格子加详情动作，空格不可交互；只在 Home 调用 drawHeadDisplay，按帽子 headTop 调整高度，删除了原先的伸手模型。

WardrobeCatalog.normalize 过滤未知或未拥有 ID，同类按最后选择保留一件；旧装备 ID 沿用，新增工具默认空拥有列表。工具选择仅从 ownedTools 校验，不进入 equipped。渲染只在 dig 为真时传入工具模型；购买和切换不触碰 Journey 奖励公式。构建顺序确保 Catalog 和 Art 在角色与应用之前加载。

## 今日返地面与设备时钟

`depth` 继续表示累计挖掘成果，`surfaceDepth` 是当前矿道的起点基准。旧存档缺失时基准为 0、digDay 为当前日期，保留旧矿道直到用户结束今日或日期切换。读档将基准限制在 0..depth。

Today 页 Finish 先结算唯一会话并打开总结；完成总结时 finishTodaySummary 将 surfaceDepth 设为 depth 并保存，然后回到 Focus。主按钮同步完成此步骤，dialog close 为 × / Escape 提供同一后备路径，通过 daySummaryPending 避免重复处理。完成时恢复矿洞显示、清除跳跃，并调用 PixelArt.refreshFocus 立即绘制一次；不依赖下一动画帧，修复简洁视图隐藏矿洞、画面仍停在地下的情况。这样刷新不会恢复到旧矿道，查看报告或取消确认没有副作用。`ensureDigDay()` 只在无会话且设备日期改变时更新基准；跨午夜任务维持当前路径，结束后再更新。计时与奖励不依赖当前矿道位置；路径物品在渲染时减去同一个基准，继续与工具位置一致。

地表角色的双脚定位在草地基线，0m 时没有已开挖矿道。角色眼睛从 2×3 缩为 2×2 原始像素，眨眼与睡眠继续共用绘制函数。

时间从设备原生 Date 读取，不使用固定服务器时区；tick、visibilitychange 和 window focus 刷新。新增浏览器检查验证上海、洛杉矶的分钟边界及伦敦夏令时回拨。趋势图 viewBox 使用实际容器宽度，窗口大小改变时重绘以保持标签字号。
