import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

export default withMermaid(defineConfig({
  title: "Mastra 框架解析",
  description: "深入理解 Mastra AI Agent 框架的工作原理",

  head: [["link", { rel: "icon", href: "/favicon.ico" }]],

  locales: {
    root: {
      label: "简体中文",
      lang: "zh-CN",
      title: "Mastra 框架解析",
      description: "深入理解 Mastra AI Agent 框架的工作原理",
      themeConfig: {
        logo: "/logo.svg",

        nav: [
          { text: "首页", link: "/" },
          { text: "指南", link: "/guide/introduction" },
          { text: "核心概念", link: "/core/agent-basics" },
          { text: "进阶主题", link: "/advanced/multi-agent" },
          { text: "深度解构", link: "/deep-dive/memory-observer" },
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
          {
            text: "深度解构 (Deep Dive)",
            items: [
              { text: "记忆深度解构", link: "/deep-dive/memory-observer" },
              { text: "上下文管理", link: "/deep-dive/context-management" },
              { text: "高级技能与自修复", link: "/deep-dive/advanced-skills" },
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
    },
    en: {
      label: "English",
      lang: "en-US",
      link: "/en/",
      title: "How Mastra Works",
      description: "Master the Mastra AI Agent framework through progressive demos and source-code deep dives",
      themeConfig: {
        logo: "/logo.svg",

        nav: [
          { text: "Home", link: "/en/" },
          { text: "Guide", link: "/en/guide/introduction" },
          { text: "Core Concepts", link: "/en/core/agent-basics" },
          { text: "Advanced", link: "/en/advanced/multi-agent" },
          { text: "Deep Dive", link: "/en/deep-dive/memory-observer" },
        ],

        sidebar: [
          {
            text: "Guide",
            items: [
              { text: "Introduction", link: "/en/guide/introduction" },
              { text: "Getting Started", link: "/en/guide/getting-started" },
            ],
          },
          {
            text: "Core Concepts",
            items: [
              { text: "Agent Basics", link: "/en/core/agent-basics" },
              { text: "Tool Calling", link: "/en/core/tool-calling" },
              { text: "Structured Output", link: "/en/core/structured-output" },
              { text: "Memory System", link: "/en/core/memory" },
              { text: "RAG", link: "/en/core/rag" },
              { text: "Workflows", link: "/en/core/workflows" },
            ],
          },
          {
            text: "Advanced Topics",
            items: [
              { text: "Multi-Agent", link: "/en/advanced/multi-agent" },
              { text: "MCP Protocol", link: "/en/advanced/mcp" },
              { text: "Evaluation", link: "/en/advanced/evals" },
            ],
          },
          {
            text: "Deep Dive",
            items: [
              { text: "Memory Observer", link: "/en/deep-dive/memory-observer" },
              { text: "Context Management", link: "/en/deep-dive/context-management" },
              { text: "Advanced Skills", link: "/en/deep-dive/advanced-skills" },
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
          label: "On this page",
          level: [2, 3],
        },

        lastUpdated: {
          text: "Last updated",
        },

        docFooter: {
          prev: "Previous",
          next: "Next",
        },

        search: {
          provider: "local",
          options: {
            translations: {
              button: {
                buttonText: "Search docs",
                buttonAriaLabel: "Search docs",
              },
              modal: {
                noResultsText: "No results found",
                resetButtonTitle: "Reset query",
                footer: {
                  selectText: "Select",
                  navigateText: "Navigate",
                  closeText: "Close",
                },
              },
            },
          },
        },

        returnToTopLabel: "Return to top",
        sidebarMenuLabel: "Menu",
        darkModeSwitchLabel: "Theme",
      },
    },
  },

  markdown: {
    lineNumbers: true,
  },
}));
