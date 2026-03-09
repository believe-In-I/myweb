/**
 * Markdown转Mermaid通用转换器
 * 支持任意Markdown内容智能转换为Mermaid图表
 */
import { Heading, ListItem, MarkdownParseResult, Table, MermaidGenerationOptions } from './types';

/**
 * Universal Markdown to Mermaid Converter
 * Converts any Markdown content to Mermaid diagram
 */
export class UniversalMarkdownToMermaid {
  
  /**
   * 生成Mermaid代码（通用入口）
   */
  static generate(
    markdown: string, 
    options: MermaidGenerationOptions = { autoDetect: true, includeTextContent: true }
  ): string {
    try {
      // 处理literal \n 转换为真实换行
      markdown = markdown.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
      
      const parsed = this.parseMarkdownSimple(markdown);
      
      // 根据选择的图表类型生成
      const chartType = options.preferredChartType || 'mindmap';
      
      if (chartType === 'mindmap') {
        return this.generateSimpleMindmap(parsed);
      } else {
        return this.generateSimpleFlowchart(parsed);
      }
    } catch (e) {
      console.error('生成Mermaid失败:', e);
      return 'mindmap\n  root(生成失败)';
    }
  }
  
  /**
   * 简单解析Markdown - 提取关键信息
   */
  private static parseMarkdownSimple(markdown: string): {
    title: string;
    headings: string[];
    paragraphs: string[];
    tableData: string[][];
    listItems: string[];
  } {
    const lines = markdown.split('\n');
    const result = {
      title: '',
      headings: [] as string[],
      paragraphs: [] as string[],
      tableData: [] as string[][],
      listItems: [] as string[]
    };
    
    let inCodeBlock = false;
    let inTable = false;
    let currentTable: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // 跳过代码块
      if (trimmed.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      if (inCodeBlock) continue;
      
      // 跳过空行
      if (!trimmed) {
        inTable = false;
        continue;
      }
      
      // 标题
      if (trimmed.startsWith('#')) {
        const match = trimmed.match(/^#+\s+(.+)$/);
        if (match) {
          const text = match[1].trim();
          result.headings.push(text);
          // 第一个一级标题作为标题
          if (!result.title && trimmed.startsWith('# ')) {
            result.title = text;
          }
        }
      }
      // 表格
      else if (trimmed.startsWith('|')) {
        const cells = trimmed.split('|')
          .map(c => c.trim())
          .filter(c => c && c !== '----');
        
        if (cells.length > 0 && !trimmed.includes('---')) {
          inTable = true;
          result.tableData.push(cells);
        }
      } else {
        inTable = false;
        
        // 列表
        if (trimmed.match(/^[-*+]\s+/) || trimmed.match(/^\d+\.\s+/)) {
          const text = trimmed.replace(/^[-*+]\s+/, '').replace(/^\d+\.\s+/, '');
          result.listItems.push(text);
        }
        // 段落（排除引用等）
        else if (!trimmed.startsWith('>') && !trimmed.startsWith('[')) {
          // 移除markdown格式符号
          const cleanText = trimmed
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // 链接
            .replace(/`[^`]+`/g, '')  // 行内代码
            .replace(/\*\*([^*]+)\*\*/g, '$1')  // 粗体
            .replace(/\*([^*]+)\*/g, '$1')  // 斜体
            .trim();
          
          if (cleanText && cleanText.length > 2) {
            result.paragraphs.push(cleanText);
          }
        }
      }
    }
    
    // 如果没有标题，使用第一个段落
    if (!result.title && result.paragraphs.length > 0) {
      result.title = result.paragraphs[0].substring(0, 30);
    }
    if (!result.title) {
      result.title = '文档结构图';
    }
    
    return result;
  }
  
  /**
   * 生成简单的思维导图
   */
  private static generateSimpleMindmap(parsed: {
    title: string;
    headings: string[];
    paragraphs: string[];
    tableData: string[][];
    listItems: string[];
  }): string {
    const lines: string[] = ['mindmap'];
    
    // 根节点
    const rootTitle = parsed.title.length > 40 
      ? parsed.title.substring(0, 40) + '...'
      : parsed.title;
    lines.push(`  root(${this.escapeText(rootTitle)})`);
    
    // 按标题层级分组
    const h1Items: string[] = [];
    const h2Items: string[] = [];
    const otherItems: string[] = [];
    
    for (const h of parsed.headings) {
      if (h.startsWith('一') || h.startsWith('二') || h.startsWith('三') || 
          h.startsWith('四') || h.startsWith('五') || h.startsWith('六')) {
        h1Items.push(h);
      } else if (h.length < 20) {
        h2Items.push(h);
      } else {
        otherItems.push(h.substring(0, 30));
      }
    }
    
    // 添加一级标题
    if (h1Items.length > 0) {
      for (const h of h1Items.slice(0, 8)) {
        lines.push(`    ${this.escapeText(h)}`);
      }
    }
    
    // 添加表格数据（简化）
    if (parsed.tableData.length > 1) {
      const headers = parsed.tableData[0];
      const firstCol = headers[0] || '项目';
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
    
    // 添加列表项
    if (parsed.listItems.length > 0) {
      lines.push(`    列表项`);
      for (const item of parsed.listItems.slice(0, 6)) {
        const text = item.substring(0, 25);
        if (text) {
          lines.push(`      ${this.escapeText(text)}`);
        }
      }
    }
    
    // 如果没有内容，添加默认
    if (lines.length === 2) {
      lines.push(`    内容`);
      lines.push(`      请添加更多内容`);
    }
    
    return lines.join('\n');
  }
  
  /**
   * 生成简单的流程图
   */
  private static generateSimpleFlowchart(parsed: {
    title: string;
    headings: string[];
    paragraphs: string[];
    tableData: string[][];
    listItems: string[];
  }): string {
    const lines: string[] = ['graph TD'];
    
    const rootId = 'A';
    const rootTitle = parsed.title.length > 30 
      ? parsed.title.substring(0, 30) + '...'
      : parsed.title;
    lines.push(`    ${rootId}["${this.escapeText(rootTitle)}"]`);
    
    let prevId = rootId;
    let nodeCounter = 66; // 'B'
    
    // 添加标题作为节点
    for (const h of parsed.headings.slice(0, 6)) {
      const id = String.fromCharCode(nodeCounter++);
      const title = h.length > 20 ? h.substring(0, 20) + '...' : h;
      lines.push(`    ${id}["${this.escapeText(title)}"]`);
      lines.push(`    ${prevId} --> ${id}`);
      prevId = id;
    }
    
    // 添加表格作为节点
    if (parsed.tableData.length > 1) {
      const id = String.fromCharCode(nodeCounter++);
      lines.push(`    ${id}("[表格数据]")`);
      lines.push(`    ${prevId} --> ${id}`);
      
      // 添加表格行
      for (let i = 1; i < Math.min(parsed.tableData.length, 6); i++) {
        const rowId = String.fromCharCode(nodeCounter++);
        const rowText = parsed.tableData[i][0]?.substring(0, 15) || '';
        if (rowText) {
          lines.push(`    ${rowId}("${this.escapeText(rowText)}")`);
          lines.push(`    ${id} --> ${rowId}`);
        }
      }
    }
    
    // 如果没有内容，添加默认
    if (lines.length === 2) {
      lines.push(`    B["内容"]`);
      lines.push(`    A --> B`);
    }
    
    return lines.join('\n');
  }
  
  /**
   * 转义文本
   */
  private static escapeText(text: string): string {
    if (!text) return '';
    
    // 移除或替换Mermaid特殊字符
    return text
      .replace(/[`]/g, "'")
      .replace(/[\[\]\(\)\{\}]/g, ' ')
      .replace(/[\\]/g, '')
      .replace(/[：:]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

// 兼容旧接口
export function generateMermaid(
  markdown: string, 
  options?: MermaidGenerationOptions
): string {
  return UniversalMarkdownToMermaid.generate(markdown, options);
}
