// universal-markdown-to-mermaid.ts

interface MarkdownParseResult {
    title?: string;                  // 文档标题
    headings: Heading[];              // 所有标题
    lists: ListItem[];                // 所有列表项
    tables: Table[];                  // 所有表格
    paragraphs: Paragraph[];          // 所有段落
    existingMermaidBlocks: string[];  // 已有的Mermaid代码块
    frontmatter?: Record<string, any>; // YAML frontmatter
  }
  
  interface Heading {
    level: number;      // 1-6
    text: string;
    id?: string;
    children: Heading[]; // 子标题
  }
  
  interface ListItem {
    level: number;      // 缩进层级
    text: string;
    ordered: boolean;   // 有序还是无序
    children: ListItem[];
  }
  
  interface Table {
    headers: string[];
    rows: string[][];
    caption?: string;
  }
  
  interface Paragraph {
    text: string;
    sentences: string[];
  }
  
  type ChartType = 
    | 'mindmap'      // 思维导图（最适合标题层级）
    | 'flowchart'    // 流程图（适合流程描述）
    | 'graph'        // 关系图（适合实体关系）
    | 'timeline'     // 时间线（适合时间顺序）
    | 'quadrantChart' // 四象限图（适合对比分析）
    | 'pie'          // 饼图（适合占比数据）
    | 'gantt'        // 甘特图（适合时间规划）
    | 'sequenceDiagram' // 时序图（适合交互流程）
    | 'classDiagram'    // 类图（适合分类体系）
    | 'entityRelationshipDiagram'; // ER图（适合数据关系）
  
  interface MermaidGenerationOptions {
    preferredChartType?: ChartType;   // 优先图表类型
    autoDetect: boolean;              // 是否自动检测最适合的图表
    maxDepth?: number;                 // 最大深度
    includeTextContent?: boolean;      // 是否包含正文内容
  }
  
  /**
   * 通用Markdown转Mermaid转换器
   * 灵感来自mark-deco的标题树提取[citation:1]和@rendermaid/core的解析能力[citation:3]
   */
  export class UniversalMarkdownToMermaid {
    
    /**
     * 解析任意Markdown内容，提取结构信息
     */
    static parseMarkdown(markdown: string): MarkdownParseResult {
      // 处理literal \n 转换为真实换行
      markdown = markdown.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
      console.log('Markdown after processing:', markdown);
      
      const lines = markdown.split('\n');
      const result: MarkdownParseResult = {
        headings: [],
        lists: [],
        tables: [],
        paragraphs: [],
        existingMermaidBlocks: []
      };
      
      // 提取frontmatter (YAML头信息) [citation:1]
      if (markdown.startsWith('---')) {
        const frontmatterEnd = markdown.indexOf('---', 3);
        if (frontmatterEnd > 0) {
          const frontmatterText = markdown.substring(3, frontmatterEnd);
          // 简单解析YAML，实际可用js-yaml库
          result.frontmatter = this.parseSimpleYaml(frontmatterText);
        }
      }
      
      // 解析文档结构
      let inTable = false;
      let inCodeBlock = false;
      let currentCodeBlock = '';
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        
        // 处理代码块
        if (trimmed.startsWith('```')) {
          if (!inCodeBlock) {
            inCodeBlock = true;
            currentCodeBlock = '';
          } else {
            inCodeBlock = false;
            // 如果是mermaid代码块，保存起来
            if (trimmed === '```mermaid' && currentCodeBlock) {
              result.existingMermaidBlocks.push(currentCodeBlock.trim());
            }
          }
          continue;
        }
        
        if (inCodeBlock) {
          currentCodeBlock += line + '\n';
          continue;
        }
        
        // 跳过空行
        if (!trimmed) continue;
        
        // 解析标题 [citation:1]
        if (trimmed.startsWith('#')) {
          const match = trimmed.match(/^(#{1,6})\s+(.+)$/);
          if (match) {
            const level = match[1].length;
            const text = match[2];
            result.headings.push({
              level,
              text,
              children: [] // 后面会构建树结构
            });
          }
        }
        
        // 解析列表
        else if (trimmed.match(/^[\-\*\+]\s+/) || trimmed.match(/^\d+\.\s+/)) {
          const ordered = !!trimmed.match(/^\d+\.\s+/);
          const text = trimmed.replace(/^[\-\*\+]\s+/, '').replace(/^\d+\.\s+/, '');
          
          // 计算缩进层级（通过前面的空格数）
          const indentLevel = Math.floor((line.search(/\S/) / 2) || 0);
          
          result.lists.push({
            level: indentLevel,
            text,
            ordered,
            children: []
          });
        }
        
        // 解析表格
        else if (trimmed.startsWith('|')) {
          if (!inTable) {
            inTable = true;
            result.tables.push({
              headers: [],
              rows: []
            });
          }
          
          const cells = trimmed.split('|')
            .filter(cell => cell.trim())
            .map(cell => cell.trim());
          
          const currentTable = result.tables[result.tables.length - 1];
          
          if (currentTable.headers.length === 0) {
            // 第一行是表头
            currentTable.headers = cells;
          } else if (!trimmed.includes('---') && !trimmed.includes(':-')) {
            // 不是分隔行，是数据行
            currentTable.rows.push(cells);
          }
        }
        
        // 解析普通段落
        else if (!inTable) {
          // 拆分成句子
          const sentences = trimmed.split(/[。！？；]/).filter(s => s.trim());
          if (sentences.length > 0) {
            result.paragraphs.push({
              text: trimmed,
              sentences
            });
          }
        }
      }
      
      // 构建标题树（父子关系）
      this.buildHeadingTree(result.headings);
      
      // 构建列表树（父子关系）
      this.buildListTree(result.lists);
      
      return result;
    }
    
    /**
     * 构建标题层级树
     */
    private static buildHeadingTree(headings: Heading[]): void {
      const root: Heading[] = [];
      const stack: Heading[] = [];
      
      for (const heading of headings) {
        while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
          stack.pop();
        }
        
        if (stack.length === 0) {
          root.push(heading);
        } else {
          stack[stack.length - 1].children.push(heading);
        }
        
        stack.push(heading);
      }
      
      // 替换原数组（实际使用时可保留原数组或返回树）
    }
    
    /**
     * 构建列表树
     */
    private static buildListTree(lists: ListItem[]): void {
      const stack: ListItem[] = [];
      
      for (const item of lists) {
        while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
          stack.pop();
        }
        
        if (stack.length > 0) {
          stack[stack.length - 1].children.push(item);
        }
        
        stack.push(item);
      }
    }
    
    /**
     * 自动检测最适合的图表类型
     */
    static detectBestChartType(parsed: MarkdownParseResult): ChartType {
      // 检测是否有表格
      if (parsed.tables.length > 0) {
        const table = parsed.tables[0];
        
        // 如果表格有数值型数据，适合饼图或象限图
        if (this.hasNumericData(table)) {
          return 'quadrantChart';
        }
        
        // 如果表格有分类和描述，适合思维导图
        if (table.headers.length >= 2) {
          return 'mindmap';
        }
      }
      
      // 检测是否有时间线内容
      if (this.hasTimelineContent(parsed)) {
        return 'timeline';
      }
      
      // 检测是否有流程描述
      if (this.hasProcessDescription(parsed)) {
        return 'flowchart';
      }
      
      // 检测标题层级深度
      const maxHeadingDepth = this.getMaxHeadingDepth(parsed.headings);
      if (maxHeadingDepth >= 2) {
        return 'mindmap';
      }
      
      // 默认返回思维导图
      return 'mindmap';
    }
    
    /**
     * 生成Mermaid代码（通用入口）
     */
    static generate(
      markdown: string, 
      options: MermaidGenerationOptions = { autoDetect: true, includeTextContent: true }
    ): string {
      const parsed = this.parseMarkdown(markdown);
      console.log('Parsed result:', JSON.stringify(parsed, null, 2));
      
      // 如果已有Mermaid代码块且用户想保留，可以直接返回
      if (parsed.existingMermaidBlocks.length > 0 && options.autoDetect) {
        // 可以选择返回第一个，或者合并所有
        return parsed.existingMermaidBlocks[0];
      }
      
      // 自动检测图表类型
      const chartType = options.autoDetect 
        ? this.detectBestChartType(parsed)
        : (options.preferredChartType || 'mindmap');
      
      console.log('Chart type:', chartType);
      
      // 根据类型生成对应图表
      switch (chartType) {
        case 'mindmap':
          return this.generateMindmap(parsed, options);
        case 'flowchart':
          return this.generateFlowchart(parsed, options);
        case 'timeline':
          return this.generateTimeline(parsed, options);
        case 'quadrantChart':
          return this.generateQuadrantChart(parsed, options);
        case 'pie':
          return this.generatePieChart(parsed, options);
        case 'classDiagram':
          return this.generateClassDiagram(parsed, options);
        case 'entityRelationshipDiagram':
          return this.generateERDiagram(parsed, options);
        default:
          return this.generateMindmap(parsed, options);
      }
    }
    
    /**
     * 生成思维导图（适合标题层级和列表）
     */
    static generateMindmap(parsed: MarkdownParseResult, options: MermaidGenerationOptions): string {
      const lines: string[] = ['mindmap'];
      
      console.log('Generating mindmap, headings:', parsed.headings);
      console.log('Generating mindmap, paragraphs:', parsed.paragraphs);
      console.log('Generating mindmap, lists:', parsed.lists);
      console.log('Generating mindmap, tables:', parsed.tables);
      
      // 获取文档标题
      let title = parsed.frontmatter?.title || 
                  parsed.headings.find(h => h.level === 1)?.text || 
                  '文档结构图';
      
      // 截断标题
      if (title.length > 50) {
        title = title.substring(0, 50) + '...';
      }
      
      lines.push(`  root(${this.escape(title)})`);
      
      // 递归添加标题
      const addHeadings = (headings: Heading[], depth: number = 2) => {
        if (depth > 6) return;  // 限制深度
        for (const heading of headings) {
          const indent = '  '.repeat(depth);
          const escapedText = this.escape(heading.text);
          if (escapedText) {
            lines.push(`${indent}${escapedText}`);
          }
          
          if (heading.children.length > 0) {
            addHeadings(heading.children, depth + 1);
          }
        }
      };
      
      // 添加一级标题下的内容
      const topLevelHeadings = parsed.headings.filter(h => h.level === 1);
      if (topLevelHeadings.length > 0) {
        for (const heading of topLevelHeadings) {
          // 添加一级标题作为分支
          const escapedH1 = this.escape(heading.text);
          if (escapedH1) {
            lines.push(`    ${escapedH1}`);
            addHeadings(heading.children, 3);
          }
        }
      } else {
        // 如果没有一级标题，使用所有二级标题
        addHeadings(parsed.headings.filter(h => h.level === 2), 2);
      }
      
      // 添加段落作为说明（如果有内容，跳过代码块）
      if (parsed.paragraphs.length > 0 && options.includeTextContent) {
        // 过滤掉包含代码块的段落
        const textParagraphs = parsed.paragraphs.filter(p => !p.text.includes('```'));
        
        if (textParagraphs.length > 0) {
          lines.push(`    概要`);
          for (const para of textParagraphs.slice(0, 2)) {
            const text = this.escape(para.text);
            if (text && text.length > 5) {
              const truncated = text.length > 80 ? text.substring(0, 80) + '...' : text;
              lines.push(`      ${truncated}`);
            }
          }
        }
      }
      
      // 添加表格数据
      if (parsed.tables.length > 0) {
        const table = parsed.tables[0];
        lines.push(`    ${this.escape(table.caption || '数据对比')}`);
        
        for (const row of table.rows.slice(0, 6)) {  // 限制行数
          if (row.length >= 1) {
            let itemText = this.escape(row[0]);
            if (row.length >= 4 && row[3]) {
              // 添加推荐指数
              itemText += ` ${this.escapeStars(row[3])}`;
            }
            if (itemText) {
              lines.push(`      ${itemText}`);
            }
          }
        }
      }
      
      // 添加列表项
      if (parsed.lists.length > 0 && options.includeTextContent) {
        const topLevelLists = parsed.lists.filter(l => l.level === 0).slice(0, 5);
        if (topLevelLists.length > 0) {
          lines.push(`    列表项`);
          for (const item of topLevelLists) {
            const text = this.escape(item.text);
            if (text) {
              lines.push(`      ${text}`);
            }
          }
        }
      }
      
      console.log('Generated mindmap lines:', lines);
      return lines.join('\n');
    }
    
    /**
     * 生成流程图（适合流程描述）
     */
    static generateFlowchart(parsed: MarkdownParseResult, options: MermaidGenerationOptions): string {
      const lines: string[] = ['graph TD'];
      
      const usedIds = new Set<string>();
      
      const getNodeId = (text: string): string => {
        let baseId = this.escapeNodeId(text.substring(0, 15));
        let id = baseId;
        let counter = 1;
        while (usedIds.has(id)) {
          id = `${baseId}${counter++}`;
        }
        usedIds.add(id);
        return id;
      };
      
      // 获取文档标题（第一行或第一个一级标题）
      const docTitle = parsed.frontmatter?.title || 
                       parsed.headings.find(h => h.level === 1)?.text || 
                       '文档';
      const rootId = getNodeId(docTitle);
      lines.push(`    ${rootId}["${this.escape(docTitle)}"]`);
      
      let prevId = rootId;
      
      // 添加一级标题作为主要流程节点
      const h1Headings = parsed.headings.filter(h => h.level === 1);
      if (h1Headings.length > 0) {
        for (const h1 of h1Headings) {
          const h1Id = getNodeId(h1.text);
          lines.push(`    ${h1Id}["${this.escape(h1.text)}"]`);
          lines.push(`    ${prevId} --> ${h1Id}`);
          prevId = h1Id;
          
          // 添加二级标题
          for (const h2 of h1.children) {
            const h2Id = getNodeId(h2.text);
            lines.push(`    ${h2Id}["${this.escape(h2.text)}"]`);
            lines.push(`    ${h1Id} --> ${h2Id}`);
          }
        }
      } else {
        // 没有一级标题时，使用二级标题
        const h2Headings = parsed.headings.filter(h => h.level === 2);
        for (const h2 of h2Headings) {
          const h2Id = getNodeId(h2.text);
          lines.push(`    ${h2Id}["${this.escape(h2.text)}"]`);
          lines.push(`    ${prevId} --> ${h2Id}`);
          prevId = h2Id;
        }
      }
      
      // 添加段落作为说明节点（跳过代码块）
      if (parsed.paragraphs.length > 0 && options.includeTextContent) {
        const textParagraphs = parsed.paragraphs.filter(p => !p.text.includes('```'));
        if (textParagraphs.length > 0) {
          const paraText = textParagraphs[0].text.substring(0, 50);
          const paraId = getNodeId('说明');
          lines.push(`    ${paraId}("${this.escape(paraText)}")`);
          lines.push(`    ${prevId} -.-> ${paraId}`);
        }
      }
      
      // 添加表格数据作为详细节点
      if (parsed.tables.length > 0) {
        const table = parsed.tables[0];
        const tableId = getNodeId('数据表格');
        lines.push(`    ${tableId}[${table.caption || '数据对比'}]`);
        
        // 连接最后一个节点到表格
        if (prevId !== rootId) {
          lines.push(`    ${prevId} --> ${tableId}`);
        } else {
          lines.push(`    ${rootId} --> ${tableId}`);
        }
        
        // 添加表格行作为子节点
        for (const row of table.rows) {
          if (row.length >= 1) {
            const rowId = getNodeId(row[0]);
            // 使用圆角矩形显示美食名称
            lines.push(`    ${rowId}("${this.escape(row[0])}")`);
            lines.push(`    ${tableId} --> ${rowId}`);
            
            // 如果有口味特点，添加为子节点
            if (row.length >= 2 && row[1]) {
              const tasteId = getNodeId(`${row[0]}_taste`);
              lines.push(`    ${tasteId}[${this.escape(row[1])}]`);
              lines.push(`    ${rowId} --> ${tasteId}`);
            }
            
            // 如果有地域信息
            if (row.length >= 3 && row[2]) {
              const regionId = getNodeId(`${row[0]}_region`);
              lines.push(`    ${regionId}[📍 ${this.escape(row[2])}]`);
              lines.push(`    ${rowId} --> ${regionId}`);
            }
          }
        }
      }
      
      return lines.join('\n');
    }
    
    /**
     * 生成时间线图（适合有时间顺序的内容）
     */
    static generateTimeline(parsed: MarkdownParseResult, _options: MermaidGenerationOptions): string {
      const lines: string[] = ['timeline'];
      
      // 尝试从标题中提取时间线
      let title = '时间线';
      let currentSection = '';
      
      for (const heading of parsed.headings) {
        if (heading.level === 1) {
          title = heading.text;
          lines.push(`    title ${this.escape(title)}`);
        } else if (heading.level === 2) {
          currentSection = heading.text;
          lines.push(`    section ${this.escape(currentSection)}`);
        } else if (heading.level === 3 && currentSection) {
          // 三级标题作为时间点
          lines.push(`        ${this.escape(heading.text)} : ${heading.text}`);
        }
      }
      
      // 如果没有合适的标题结构，从段落中提取
      if (lines.length === 1) { // 只有 "timeline"
        lines.push(`    title 内容时间线`);
        
        // 将前5个段落作为时间点
        for (let i = 0; i < Math.min(parsed.paragraphs.length, 5); i++) {
          const para = parsed.paragraphs[i];
          const shortText = para.sentences[0] || para.text.substring(0, 30);
          lines.push(`    section 第${i+1}部分`);
          lines.push(`        ${this.escape(shortText)} : ${i+1}`);
        }
      }
      
      return lines.join('\n');
    }
    
    /**
     * 生成四象限图（适合表格对比）
     */
    static generateQuadrantChart(parsed: MarkdownParseResult, options: MermaidGenerationOptions): string {
      const lines: string[] = ['quadrantChart'];
      
      if (parsed.tables.length === 0) {
        return this.generateMindmap(parsed, options);
      }
      
      const table = parsed.tables[0];
      lines.push(`    title ${table.caption || '四象限分析'}`);
      
      // 设置象限
      lines.push(`    x-axis "低" --> "高"`);
      lines.push(`    y-axis "低" --> "高"`);
      
      // 添加象限标签
      lines.push(`    quadrant-1 "推荐"`);
      lines.push(`    quadrant-2 "考虑"`);
      lines.push(`    quadrant-3 "一般"`);
      lines.push(`    quadrant-4 "尝试"`);
      
      // 添加数据点
      for (let i = 0; i < Math.min(table.rows.length, 10); i++) {
        const row = table.rows[i];
        if (row.length >= 1) {
          const name = row[0];
          // 根据推荐指数估算位置
          const rating = row.length >= 4 ? row[3].length : 3;
          const x = (rating / 5) * 100;
          const y = (rating / 5) * 100;
          lines.push(`    "${this.escape(name)}" : [${x}, ${y}]`);
        }
      }
      
      return lines.join('\n');
    }
    
    /**
     * 生成饼图（适合统计数据）
     */
    static generatePieChart(parsed: MarkdownParseResult, _options: MermaidGenerationOptions): string {
      const lines: string[] = ['pie'];
      
      if (parsed.tables.length === 0) {
        return this.generateMindmap(parsed, _options);
      }
      
      const table = parsed.tables[0];
      lines.push(`    title ${table.caption || '数据分布'}`);
      
      // 尝试从表格中提取数值
      for (let i = 0; i < Math.min(table.rows.length, 8); i++) {
        const row = table.rows[i];
        if (row.length >= 2) {
          const name = row[0];
          // 尝试从推荐指数或最后一列提取数值
          let value = 10; // 默认值
          const lastCol = row[row.length - 1];
          const starMatch = lastCol.match(/★/g);
          if (starMatch) {
            value = starMatch.length * 10;
          } else if (row.length >= 3) {
            const possibleValue = parseFloat(row[row.length - 2]);
            if (!isNaN(possibleValue)) {
              value = possibleValue;
            }
          }
          lines.push(`    "${this.escape(name)}" : ${value}`);
        }
      }
      
      return lines.join('\n');
    }
    
    /**
     * 生成类图（适合分类体系）
     */
    static generateClassDiagram(parsed: MarkdownParseResult, _options: MermaidGenerationOptions): string {
      const lines: string[] = ['classDiagram'];
      
      // 使用标题层级构建类继承关系
      const topHeadings = parsed.headings.filter(h => h.level === 2);
      
      for (let i = 0; i < Math.min(topHeadings.length, 8); i++) {
        const category = topHeadings[i];
        lines.push(`    class ${this.escapeClassName(category.text)} {`);
        
        // 添加子项作为属性
        for (const child of category.children) {
          lines.push(`        +${this.escapeClassName(child.text)}`);
        }
        
        lines.push(`    }`);
      }
      
      // 添加列表项作为补充类
      if (parsed.lists.length > 0) {
        lines.push(`    class ListItems {`);
        for (const item of parsed.lists.slice(0, 5)) {
          lines.push(`        +${this.escapeClassName(item.text)}`);
        }
        lines.push(`    }`);
      }
      
      return lines.join('\n');
    }
    
    /**
     * 生成ER图（适合实体关系）
     */
    static generateERDiagram(parsed: MarkdownParseResult, options: MermaidGenerationOptions): string {
      const lines: string[] = ['erDiagram'];
      
      if (parsed.tables.length === 0) {
        return this.generateMindmap(parsed, options);
      }
      
      const table = parsed.tables[0];
      
      // 将表格转换为实体
      const entityName = table.caption || 'Entity';
      lines.push(`    ${this.escapeClassName(entityName)} {`);
      
      // 表头作为属性
      for (const header of table.headers) {
        lines.push(`        string ${this.escapeClassName(header)}`);
      }
      
      lines.push(`    }`);
      
      return lines.join('\n');
    }
    
    /**
     * 工具方法：判断表格是否有数值数据
     */
    private static hasNumericData(table: Table): boolean {
      for (const row of table.rows) {
        for (const cell of row) {
          if (!isNaN(parseFloat(cell)) && cell.length < 10) {
            return true;
          }
          if (cell.includes('⭐') || cell.includes('★')) {
            return true;
          }
        }
      }
      return false;
    }
    
    /**
     * 工具方法：判断是否有时间线内容
     */
    private static hasTimelineContent(parsed: MarkdownParseResult): boolean {
      const timelineKeywords = ['时间', '发展', '历程', '历史', '演变', '阶段', 'timeline'];
      
      for (const heading of parsed.headings) {
        if (timelineKeywords.some(k => heading.text.includes(k))) {
          return true;
        }
      }
      
      for (const para of parsed.paragraphs) {
        if (timelineKeywords.some(k => para.text.includes(k))) {
          return true;
        }
      }
      
      return false;
    }
    
    /**
     * 工具方法：判断是否有流程描述
     */
    private static hasProcessDescription(parsed: MarkdownParseResult): boolean {
      const processKeywords = ['流程', '步骤', '过程', '方法', '路线', 'flow', 'process'];
      
      for (const heading of parsed.headings) {
        if (processKeywords.some(k => heading.text.includes(k))) {
          return true;
        }
      }
      
      // 检查是否有列表项之间的顺序关系
      if (parsed.lists.length > 3) {
        return true;
      }
      
      return false;
    }
    
    /**
     * 工具方法：获取最大标题深度
     */
    private static getMaxHeadingDepth(headings: Heading[]): number {
      let maxDepth = 0;
      
      const traverse = (h: Heading[], depth: number) => {
        maxDepth = Math.max(maxDepth, depth);
        for (const heading of h) {
          traverse(heading.children, depth + 1);
        }
      };
      
      traverse(headings, 1);
      return maxDepth;
    }
    
    /**
     * 转义特殊字符
     */
    private static escape(text: string): string {
      // 截断过长文本
      if (text.length > 200) {
        text = text.substring(0, 200) + '...';
      }
      
      return text
        .replace(/[`]/g, "'")  // 转义反引号为单引号
        .replace(/[\{\}]/g, '')  // 移除花括号
        .replace(/\s+/g, ' ')  // 合并空白字符
        .replace(/[，、]/g, ',')  // 中文标点转英文
        .replace(/[。；：?!]/g, '')  // 移除句末标点
        .trim();
    }
    
    /**
     * 转义用于节点ID的文本
     */
    private static escapeNodeId(text: string): string {
      // 截断
      if (text.length > 30) {
        text = text.substring(0, 30);
      }
      return text
        .replace(/[^\w\u4e00-\u9fa5]/g, '_')
        .replace(/_+/g, '_')
        .trim();
    }
    
    /**
     * 转义星星评级的特殊字符
     */
    private static escapeStars(text: string): string {
      return text.replace(/[⭐★]/g, '★');
    }
    
    /**
     * 转义类名
     */
    private static escapeClassName(text: string): string {
      return text
        .replace(/[^\w\u4e00-\u9fa5]/g, '')
        .replace(/\d+/g, '');
    }
    
    /**
     * 简单YAML解析
     */
    private static parseSimpleYaml(text: string): Record<string, any> {
      const result: Record<string, any> = {};
      const lines = text.split('\n');
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        
        const colonIndex = trimmed.indexOf(':');
        if (colonIndex > 0) {
          const key = trimmed.substring(0, colonIndex).trim();
          const value = trimmed.substring(colonIndex + 1).trim();
          result[key] = value;
        }
      }
      
      return result;
    }
  }