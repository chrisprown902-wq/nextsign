export interface NewsItem {
  id: string;
  title: string;
  source: string;
  summary: string;
  url?: string;
  heatScore: number;
  date: string;
  categories: string[];
}

export const demoNews: NewsItem[] = [
  {
    id: "1",
    title: "OpenAI 发布 GPT-5，推理能力大幅提升",
    source: "TechCrunch",
    summary: "GPT-5 在数学推理和代码生成方面表现惊人，多项基准测试超越现有模型，引发行业热议。",
    url: "https://example.com/gpt5",
    heatScore: 99,
    date: "2026-05-05",
    categories: ["trending", "launches"],
  },
  {
    id: "2",
    title: "Google DeepMind 推出 Gemini 2.5 Pro",
    source: "The Verge",
    summary: "Gemini 2.5 Pro 在多模态理解和长上下文处理上取得突破，支持 200 万 token 上下文窗口。",
    url: "https://example.com/gemini",
    heatScore: 97,
    date: "2026-05-05",
    categories: ["trending", "launches"],
  },
  {
    id: "3",
    title: "Anthropic Claude 获得实时搜索能力",
    source: "Wired",
    summary: "Claude 现在可以联网搜索实时信息，结合其强大的推理能力，成为最具竞争力的 AI 助手之一。",
    url: "https://example.com/claude",
    heatScore: 95,
    date: "2026-05-05",
    categories: ["trending", "launches"],
  },
  {
    id: "4",
    title: "Meta 开源 Llama 4，参数量达 4000 亿",
    source: "Ars Technica",
    summary: "Meta 继续推进开源策略，Llama 4 在多个任务上接近闭源模型水平，社区反响热烈。",
    url: "https://example.com/llama4",
    heatScore: 93,
    date: "2026-05-05",
    categories: ["trending", "launches"],
  },
  {
    id: "5",
    title: "xAI 发布 Grok 3，主打实时信息整合",
    source: "Reuters",
    summary: "马斯克旗下 xAI 推出 Grok 3，深度整合 X 平台数据流，提供实时趋势分析。",
    url: "https://example.com/grok3",
    heatScore: 91,
    date: "2026-05-05",
    categories: ["trending", "launches"],
  },
  {
    id: "6",
    title: "Stability AI 发布 SDXL Turbo 2.0",
    source: "VentureBeat",
    summary: "新一代图像生成模型，生成速度提升 3 倍，支持更高分辨率输出。",
    heatScore: 74,
    date: "2026-05-05",
    categories: ["trending", "launches"],
  },
  {
    id: "7",
    title: "微软 Copilot 整合进 Windows 任务栏",
    source: "ZDNet",
    summary: "Windows 11 更新将 Copilot 深度整合至系统核心体验，用户可直接语音唤醒。",
    url: "https://example.com/copilot",
    heatScore: 71,
    date: "2026-05-05",
    categories: ["trending", "launches"],
  },
  {
    id: "8",
    title: "Midjourney V7 支持视频生成",
    source: "The Information",
    summary: "",
    url: "https://example.com/midjourney",
    heatScore: 68,
    date: "2026-05-05",
    categories: ["trending"],
  },
  {
    id: "9",
    title: "Hugging Face 推出开源 Agent 框架",
    source: "GitHub Blog",
    summary: "轻量级 Agent 框架，支持多模型调度和工具调用，开发者社区高度关注。",
    heatScore: 63,
    date: "2026-05-05",
    categories: ["trending", "launches"],
  },
  {
    id: "10",
    title: "英伟达发布 Blackwell Ultra GPU",
    source: "Bloomberg",
    summary: "新一代 AI 训练芯片，FP8 性能较上代提升 2.5 倍，预计 Q3 量产。",
    heatScore: 60,
    date: "2026-05-05",
    categories: ["trending", "launches"],
  },
];
