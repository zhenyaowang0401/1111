# 技术与数据结构

原生 HTML/CSS/JavaScript、Canvas 2D、HTMLAudio 与 Web Audio。没有运行时框架、CDN 或后端。Python 构建并执行浏览器测试。

## 模块

| 文件 | 职责 |
| --- | --- |
| `index.html` | 宠物创建、六个游戏页、对话框、图标与音频元素 |
| `app.js` | 状态迁移、导航、计时区间、结算、报告、装备、家园与样例同伴 |
| `journey.js` | 纯计算：奖励资格、速度、稳定路径事件、已经过节点与奖励 |
| `terrain.js` | 世界坐标下的六段地层、色块过渡、碎石、根系藤蔓和低频生态绘制 |
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
| `depth` / `inventory` / `balance` | 已保存的累计深度（允许小数）、四种发现物数量、货币 |
| `owned` / `equipped` | 装备拥有与同时穿戴 |
| `eligibleSeconds` | 已结束普通 Study/Work 的累计秒数，用于跨轮奖励零头 |
| `session` | 唯一 ID、类型、运行状态、计划、截止时间、实际 elapsed、baseEligible、baseDepth、任务与 daySeconds |
| `history` | 会话 ID、任务、可选成果、实际时长、奖励、经过节点 ID、结束状态、是否 Demo、按日时间 |
| `reportDays` | 每天 Study 的 seconds/completed 与 Work 的 workSeconds/workCompleted |
| `home` | 当前主题、已拥有主题与家具、四个位置的物品 ID |
| `musicVolume` | 背景音量；迁移旧 rainVolume，不保存自动播放意图 |
| `heldItem` | 发现物 ID 或 null，与家园摆放共用库存约束；迁移时校验可用副本 |
| `lastTask` / `idleAt` / `simpleView` | 上次任务、最后交互时间、是否收起动画 |

旧余额、装备、背包、深度与 Study 汇总保留。旧单件装备迁移为数组；旧 Work 历史补入报告（没有区间的旧 Work 按历史结束日计入，不能重建已经丢失的暂停或跨日细节）。原先的 `totalSeconds` 曾包含 Demo，因此报告统一从 `reportDays` 读取，不用此旧字段表示正式专注总量。

存储不可用时以内存运行并提示不持久化；不为了启动预览要求增加 iframe 权限。名字、任务、成果使用文本或 HTML 转义。家园只读取已知 ID。

## 导航与家园

`start`、`focus`、`home`、`rewards`、`wardrobe`、`reports`、`companions`。首次未配置时进入设置，回访根地址进入 Focus。先渲染再尝试 History API；表单受限 iframe 的 START/Enter 走显式事件。

查看页面不会暂停；Pause & decorate 才暂停。家园购买和位置更新同步保存；发现物摆放不扣数量，但不能超过背包数量。购买家具移动不重复扣费。编辑状态只在本次页面生命周期存在，刷新回到查看模式。

## 声音、动画与单文件

HTMLAudio 播放 `assets/audio/warm-focus-3.mp3`，由用户点击启动，不重新合成或修改歌曲。独立 Web Audio 产生两段带轻泛音、气声和音高弯曲的 sine 基音，包络峰值 0.30，经过压缩器；不随音乐音量改变。`tests/test_journey.py` 使用 OfflineAudioContext 测量两段波形和中间间隔。

角色绘制共用函数，支持眨眼、困倦、睡眠和暂停休息。requestAnimationFrame 限速；简洁视图跳过矿洞绘制；系统减少动态效果禁用跳跃并固定动画帧。

构建脚本内嵌 CSS、七个 JS 模块和 MP3 原始字节的 base64。`dist/Supermo.html` 为生成文件，必须从源码重建，不能单独修改。

## 睡眠与宝箱

`petMood()` 根据无会话时的 idleAt 决定 awake / drowsy / asleep，暂停或 Break 为 rest。状态写入 body 的 data-pet-state 供可访问状态与验证使用。睡眠矩形坐标在整数网格压缩，形成多级呼吸；zzz 与鼻涕泡单独绘制。

房间使用由整像素横条组成的椭圆 Path2D 作为轮廓和裁剪，家具按各自 scale/foot 对齐基线。实际宝箱有独立 DOM 命中按钮和模态列表，避免画在 Canvas 里却不能点击。手持动作和摆放共用存档，移动副本不扣库存。
