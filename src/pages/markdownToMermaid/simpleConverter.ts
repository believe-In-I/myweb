/**
 * Markdown 转 Mermaid 简易转换器
 *
 * - 流程图（flowchart）：委托给 index.ts 里的通用转换器，结构更丰富
 */

import {
  UniversalMarkdownToMermaid,
  MermaidGenerationOptions,
} from './index';

/**
 * 对外统一入口
 * - 流程图（flowchart）：走通用转换器的流程图逻辑
 */
export function generateMermaid(
  markdown: string,
  options?: MermaidGenerationOptions
): string {
  return UniversalMarkdownToMermaid.generate(markdown, {
    ...options,
    preferredChartType: 'flowchart',
    autoDetect: false,
  });
}
