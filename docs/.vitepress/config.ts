import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Mastra 框架解析",
  description: "深入理解 Mastra AI Agent 框架的工作原理",

  lang: "zh-CN",

  head: [["link", { rel: "icon", href: "/favicon.ico" }]],

  themeConfig: {
    logo: "/logo.svg",

    nav: [
      { text: "首页", link: "/" },
      { text: "指南", link: "/guide/introduction" },
      { text: "核心概念", link: "/core/agent-basics" },
      { text: "进阶主题", link: "/advanced/multi-agent" },
    ],

    sidebar: [
      {
        text: "指南",
        items: [
          { text: "框架简介", link: "/guide/introduction" },
          { text: "快速开始", link: "/guide/getting-started" },
        ],
      },
      {
        text: "核心概念",
        items: [
          { text: "Agent 基础", link: "/core/agent-basics" },
          { text: "工具调用", link: "/core/tool-calling" },
          { text: "结构化输出", link: "/core/structured-output" },
          { text: "记忆系统", link: "/core/memory" },
          { text: "RAG 检索增强生成", link: "/core/rag" },
          { text: "工作流", link: "/core/workflows" },
        ],
      },
      {
        text: "进阶主题",
        items: [
          { text: "多智能体协作", link: "/advanced/multi-agent" },
          { text: "MCP 协议", link: "/advanced/mcp" },
          { text: "评估与测试", link: "/advanced/evals" },
        ],
      },
    ],

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/mastra-ai/mastra",
      },
    ],

    outline: {
      label: "本页目录",
      level: [2, 3],
    },

    lastUpdated: {
      text: "最后更新于",
    },

    docFooter: {
      prev: "上一篇",
      next: "下一篇",
    },

    search: {
      provider: "local",
      options: {
        translations: {
          button: {
            buttonText: "搜索文档",
            buttonAriaLabel: "搜索文档",
          },
          modal: {
            noResultsText: "无法找到相关结果",
            resetButtonTitle: "清除查询条件",
            footer: {
              selectText: "选择",
              navigateText: "切换",
              closeText: "关闭",
            },
          },
        },
      },
    },

    returnToTopLabel: "回到顶部",
    sidebarMenuLabel: "菜单",
    darkModeSwitchLabel: "主题",
  },

  markdown: {
    lineNumbers: true,
  },
});
