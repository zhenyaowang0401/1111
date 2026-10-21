# Eumo 鼹鼠模型选型记录

调研日期：2026-10-22。重点是中文自然聊天、可控角色、多轮上下文、基本学习答疑与部署复杂度；不是模型排行榜。未用真实用户做对照实验，也没有实测本产品的模型延迟或知识准确率。

## 候选与选择

| 候选 | 有依据的能力/条件 | 对本产品的判断 |
| --- | --- | --- |
| Qwen3-8B | Qwen3 官方说明支持 100+ 语言、角色扮演、多轮对话及思考/非思考切换；开放权重采用 Apache 2.0 | 先用于云端 MVP，关闭思考模式，保持短而自然的陪伴回复；解题需评测，不能保证无错 |
| Qwen3-4B-Instruct-2507 | 官方提供 4B Instruct，只有非思考模式 | 可作为更轻的候选；服务商有该模型时可测对话质量和答疑退化，不因参数小就假定一定够用 |
| Qwen3-30B-A3B-Instruct-2507 | 官方说明改进指令遵循、数学/代码等能力，原生非思考输出 | 若 8B 的学习答疑或角色稳定性不够，可换这个版本做 A/B；不先承诺价格或响应速度 |
| DeepSeek-R1 / 蒸馏系列 | 官方侧重推理，并开放 Qwen/Llama 蒸馏版本；主模型仓库说明代码/权重许可及蒸馏基座条件 | 更适合单独评估难题答疑，不优先用长推理风格承担每句宠物闲聊；蒸馏版本需核对基座许可 |
| Llama 3.1 系列 | 开放权重，使用 Llama Community License，而非简单等同 Apache/MIT | 可以接同类 API，但对当前中文陪伴需求没有本项目证据证明比 Qwen 更适合，暂不增加语言和许可上的选型工作 |

选择 Qwen 是工程起点，不是实测胜出。当前优先把“正确读懂你的记录、克制地鼓励、换装有具体反应、休息无负罪感”做在角色规则和真实上下文里，再用留出的场景测试模型。

## 接入形式

采用服务端 OpenAI 兼容适配层。前端只访问自己网站的 `/api/chat`，Key 放 Vercel 环境变量；默认配置为硅基流动的 `Qwen/Qwen3-8B`。以后更换模型只改服务端环境变量。浏览器不下载 8B 权重，不会在用户打开页面时安装模型。

模型仓库可访问，但本环境访问 Hugging Face、OpenRouter 模型目录等站点时出站代理返回 CONNECT 403，因此没有核验实时托管模型清单、价格、余额或区域可用性。默认模型 ID 需要在服务商控制台确认；没有宣称完成真实模型首聊。

## 实际阅读的一手资料

1. [Qwen3 官方仓库](https://github.com/QwenLM/Qwen3)：角色扮演、多轮对话、多语言、Qwen3-2507 版本说明。[许可说明](https://github.com/QwenLM/Qwen3#license-agreement)明确其开放权重采用 Apache 2.0。
2. [Qwen3 Instruct-2507 使用方法](https://github.com/QwenLM/Qwen3#qwen3-instruct-2507)：说明该版本仅非思考模式，不需要 enable_thinking=False。普通 Qwen3 和 Instruct-2507 不混为同一个运行模式。
3. [DeepSeek-R1 官方仓库](https://github.com/deepseek-ai/DeepSeek-R1)：推理定位、蒸馏基座及许可说明。
4. [Llama 3.1 官方许可](https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/LICENSE)：开放权重的使用条件不能一概视为相同。

作者宣称的能力不等于在 Eumo 上验证过的效果。接入步骤和验收边界见 [AI_SETUP](AI_SETUP.md)，实际角色与场景提示词见 [AI_PROMPTS](AI_PROMPTS.md)。
