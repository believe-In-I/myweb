/**
 * Markdown 转 Mermaid 简易转换器
 *
 * - 思维导图（mindmap）：使用本文件中的「保守版」算法，容错更强，适合极端 Markdown
 * - 流程图（flowchart）：委托给 index.ts 里的通用转换器，结构更丰富
 */

import {
  UniversalMarkdownToMermaid,
  MermaidGenerationOptions,
} from './index';

/**
 * 非常宽松的简单解析，只抓标题 / 表格 / 列表 / 段落关键信息
 * 尽量避免因为复杂 Markdown 结构导致解析失败
 */
class SimpleMarkdownParser {
  static parse(markdown: string): {
    title: string;
    headings: string[];
    paragraphs: string[];
    tableData: string[][];
    listItems: string[];
  } {
    // 处理 literal \n 和 \t
    markdown = markdown.replace(/\\n/g, '\n').replace(/\\t/g, '\t');

    const lines = markdown.split('\n');
    const result = {
      title: '',
      headings: [] as string[],
      paragraphs: [] as string[],
      tableData: [] as string[][],
      listItems: [] as string[],
    };

    let inCodeBlock = false;

    for (const line of lines) {
      const trimmed = line.trim();

      // 代码块开关
      if (trimmed.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      if (inCodeBlock) continue;

      // 空行
      if (!trimmed) {
        continue;
      }

      // 标题
      if (trimmed.startsWith('#')) {
        const match = trimmed.match(/^#+\s+(.+)$/);
        if (match) {
          const text = match[1].trim();
          result.headings.push(text);
          // 第一个一级标题作为整体标题
          if (!result.title && trimmed.startsWith('# ')) {
            result.title = text;
          }
        }
        continue;
      }

      // 表格行
      if (trimmed.startsWith('|')) {
        const cells = trimmed
          .split('|')
          .map((c) => c.trim())
          .filter((c) => c && c !== '----');
        if (cells.length > 0 && !trimmed.includes('---')) {
          result.tableData.push(cells);
        }
        continue;
      }

      // 列表
      if (trimmed.match(/^[-*+]\s+/) || trimmed.match(/^\d+\.\s+/)) {
        const text = trimmed
          .replace(/^[-*+]\s+/, '')
          .replace(/^\d+\.\s+/, '');
        result.listItems.push(text);
        continue;
      }

      // 段落（排除引用/链接）
      if (!trimmed.startsWith('>') && !trimmed.startsWith('[')) {
        const cleanText = trimmed
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 链接
          .replace(/`[^`]+`/g, '') // 行内代码
          .replace(/\*\*([^*]+)\*\*/g, '$1') // 粗体
          .replace(/\*([^*]+)\*/g, '$1') // 斜体
          .trim();
        if (cleanText && cleanText.length > 2) {
          result.paragraphs.push(cleanText);
        }
      }
    }

    if (!result.title && result.paragraphs.length > 0) {
      result.title = result.paragraphs[0].substring(0, 30);
    }
    if (!result.title) {
      result.title = '文档结构图';
    }

    return result;
  }
}

/**
 * 保守版思维导图生成器：节点少、结构简单，尽量不触发 Mermaid 语法边界
 */
class SimpleMindmapGenerator {
  static generateFromMarkdown(markdown: string): string {
    const parsed = SimpleMarkdownParser.parse(markdown);
    const lines: string[] = ['mindmap'];

    // 根节点
    const rootTitle =
      parsed.title.length > 40
        ? parsed.title.substring(0, 40) + '...'
        : parsed.title;
    lines.push(`  root(${this.escapeText(rootTitle)})`);

    // 一级标题（用「一/二/三/...」等开头的大标题）
    const h1Items: string[] = [];
    for (const h of parsed.headings) {
      if (
        h.startsWith('一') ||
        h.startsWith('二') ||
        h.startsWith('三') ||
        h.startsWith('四') ||
        h.startsWith('五') ||
        h.startsWith('六')
      ) {
        h1Items.push(h);
      }
    }

    if (h1Items.length > 0) {
      for (const h of h1Items.slice(0, 8)) {
        lines.push(`    ${this.escapeText(h)}`);
      }
    }

    // 表格：只取第一列表头和若干行的第一列，避免太复杂
    if (parsed.tableData.length > 1) {
      const headers = parsed.tableData[0];
      const firstCol = headers[0] || '表格';
      lines.push(`    ${this.escapeText(firstCol)}`);

      for (let i = 1; i < Math.min(parsed.tableData.length, 8); i++) {
        const row = parsed.tableData[i];
        if (row.length > 0) {
          const text = row[0]?.substring(0, 20) || '';
          if (text) {
            lines.push(`      ${this.escapeText(text)}`);
          }
        }
      }
    }

    // 列表汇总节点
    if (parsed.listItems.length > 0) {
      lines.push(`    列表项`);
      for (const item of parsed.listItems.slice(0, 6)) {
        const text = item.substring(0, 25);
        if (text) {
          lines.push(`      ${this.escapeText(text)}`);
        }
      }
    }

    // 如果还几乎没内容，补一个默认节点
    if (lines.length === 2) {
      lines.push(`    内容`);
      lines.push(`      请添加更多内容`);
    }

    return lines.join('\n');
  }

  private static escapeText(text: string): string {
    if (!text) return '';
    return text
      .replace(/[`]/g, "'")
      .replace(/[\[\]\(\)\{\}]/g, ' ')
      .replace(/[\\]/g, '')
      .replace(/[：:]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

/**
 * 对外统一入口
 * - preferredChartType === 'flowchart'：走通用转换器的流程图逻辑
 * - 其他（默认 mindmap）：走本文件的保守思维导图逻辑
 */
export function generateMermaid(
  markdown: string,
  options?: MermaidGenerationOptions
): string {
  const preferred = options?.preferredChartType || 'mindmap';

  if (preferred === 'flowchart') {
    return UniversalMarkdownToMermaid.generate(markdown, {
      ...options,
      preferredChartType: 'flowchart',
      autoDetect: false,
    });
  }

  return SimpleMindmapGenerator.generateFromMarkdown(markdown);
}
