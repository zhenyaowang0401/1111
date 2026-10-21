# 测试与验证

## 安装测试工具

游戏运行不需要这些包。仅开发和测试需要 Python、Playwright 及 Chromium。

```sh
python3 -m venv .venv
```

激活虚拟环境：

```sh
# macOS / Linux
source .venv/bin/activate
```

```powershell
# Windows PowerShell
.venv\Scripts\Activate.ps1
```

安装：

```sh
python -m pip install -r requirements-dev.txt
python -m playwright install chromium
```

测试会优先使用 `PLAYWRIGHT_CHROMIUM_EXECUTABLE` 指定的浏览器，其次查找系统 `chromium` 或 `chromium-browser`，没有时使用 Playwright 安装的 Chromium。Linux 若缺少系统库，可运行 `python -m playwright install --with-deps chromium`。

## 执行

在项目根目录：

```sh
python scripts/build_standalone.py
python tests/test_entry.py
python tests/test_site.py
python tests/test_world.py
python tests/test_journey.py
python tests/test_supermo.py
python tests/test_eumo.py
python tests/test_daily.py
node tests/test_rewards.js
```

七个 Python 脚本各自启动随机本地端口、运行浏览器断言并关闭测试服务。成功会输出 `PASS:`；断言失败会以非零状态退出。当前不是 pytest 测试套件，不应以“pytest 找不到用例”当作验证完成。

## 覆盖范围

| 脚本 | 主要验证 |
| --- | --- |
| `test_entry.py` | 不允许表单提交的两种 iframe、START 本体/箭头/Enter、中文名称、禁止 History API 时仍可导航、计时与报告可用、四个场景的旧耳朵区域实际像素检查 |
| `test_site.py` | 英文界面、真实眨眼像素、点击角色才抚摸、跳跃/文字/叫声、任务中禁摸、暂停与结算、四件装备同时绘制并刷新保留、提前结束的 Study 时间、跨午夜、报告控件、MP3 播放、旧存档迁移，以及六个游戏页的响应式检查 |
| `test_world.py` | 首次创建、12 预设和自选颜色的实际图形、名字以文本显示、直达页面、编辑取消/保存、进度保留、四个时段的天空和页面颜色、自动清晨切换、手机不同设备时区、四只同伴及发现物展开、创建页和游戏页的响应式检查 |

响应式检查使用 320、390、768、1440 像素宽度；会检查横向溢出。

自动化中的长计时和日期变化使用 Playwright 时钟加速。它验证的是应用对这些事件的处理，不代表真实学习已经发生。手工体验仍可使用 15 秒试玩检查完整路径。

`test_journey.py` 另外验证：提前结束和跨轮零头、刷新不重复发奖、真实发现点、Work/Break/Demo 口径、日终确认、家园购买/摆放/刷新、暂停布置、简洁视图、MP3 实际播放与断网单文件、实际合成的两段叫声音频波形、待机唤醒和手机编辑布局。

`node tests/test_rewards.js` 验证拆轮与连续计时收入一致、阈值边界、零头、无每日封顶、Demo、休息排除、事件 ID 与刷新稳定性。Node.js 只用于此开发检查，不是运行游戏的依赖。

`test_supermo.py` 验证 Eumo 标题、宝箱实际命中、头顶展示/摆放/放回的副本数量与刷新、90 秒/5 分钟边界、真实呼吸和鼻涕泡像素、唤醒、暂停与睡眠区分、挖掘中收起物品、新歌曲时长、七种实际渲染的地层、手机宝箱与编辑布局。

`test_eumo.py` 验证 7/5/5/6 件分类、逐件价格与购买、同类替换和旧配饰、头顶物品仅在家园的真实像素、木箱格子与库存刷新、6 种工具逐件购买与实际挖掘动画像素/位置变化、试衣不显示工具、免费切回默认、Demo 仍每次奖励且不计报告，以及窄屏/矮屏宝箱和分类布局；实际滚轮与拖动滚动条不移动左侧预览、像素字体加载及最小字号、六种眼镜实际渲染差异、断网单文件字体与商店。`test_supermo.py` 沿用历史文件名，验证的是当前 Eumo 版本。

`test_daily.py` 验证大屏宽度、常规计时/文本字体、Mole 创建文案、无 Export 的大 Finish、只查看与取消不返地面、确认后保存成果并返地面、刷新和 Escape、次日与跨午夜任务、三时区/分钟/DST 切换、真实较小眼睛像素、鼹鼠脚下七种不同地层及 320–2048px 页面；额外复现隐藏动画与暂停 requestAnimationFrame 后完成总结，检查矿洞重新可见、真实 Canvas 当即返地面、刷新持久化，并在断网单文件中重复验证。

## 手工检查清单

1. 首次打开显示创建页；选择颜色、输入名字、点击 START。
2. 游戏页显示同一颜色和名字；空闲时抚摸会跳一下并显示 `yeeeeee`。
3. 开始 15 秒试玩后不能抚摸；暂停会冻结挖掘；继续后能完成结算。
4. 在报告中确认试玩没有计入学习；普通 Study / Work 有对应的实际运行时间，提前结束也保留。
5. 分别买帽子、衣服、围脖、眼镜，确认跨类别叠穿、同类替换且重复选中不收费；Tools 只有 6 种付费工具，切换后只在挖掘动画里显示。
6. 在商店用滚轮和滚动条浏览到底，确认只有右侧商品移动，左侧鼹鼠和分类栏保留；再展开四张同伴卡片，确认“sample”标签及物品数量。
7. 第二个小房子进入家园，购买灯、摆放发现物；运行中布置会暂停。
8. 点房间里的宝箱，选择格子后 Display on head，确认仅在家园顶在头上；Put back 后数量不变。
9. 空闲 90 秒看 Drowsy，5 分钟看 Sleeping、zzz、鼻涕泡和身体起伏；点击角色唤醒。
10. 点击 Music 播放新的 Warm Focus (3)，换页不断；空闲抚摸听柔化的两声嘟嘟。
11. 右上角查看任务和时长，Finish 需要确认结束进行中任务，完成今日总结后回地面且保留所有累计成果。
12. 刷新后确认进度、家具和音量保留，音乐不自动开始。

## 验证记录

本次整理的实际执行结果和单文件校验见 [VALIDATION.md](VALIDATION.md)。该记录只说明当前源码在测试环境中的结果，不表示 GitHub Pages 已部署或真实联机已实现。
