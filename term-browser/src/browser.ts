#!/usr/bin/env node
import * as readline from 'readline';
import chalk from 'chalk';
import figlet from 'figlet';
import gradient from 'gradient-string';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

interface Link {
  url: string;
  text: string;
  index: number;
}

interface PageState {
  url: string;
  title: string;
  content: string;
  links: Link[];
  loading: boolean;
  error: string | null;
}

interface HistoryEntry {
  url: string;
  title: string;
}

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});

// Custom rules for better terminal rendering
turndownService.remove(['script', 'style', 'meta', 'link', 'noscript', 'iframe']);

// Override heading rules
turndownService.addRule('heading', {
  filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  replacement: (content, node) => {
    const hLevel = parseInt((node as HTMLElement).nodeName.charAt(1));
    const prefix = '#'.repeat(hLevel);
    return `\n${prefix} ${content.trim()}\n`;
  },
});

// Better link handling
turndownService.addRule('link', {
  filter: (node) => {
    return node.nodeName === 'A' && node.getAttribute('href') !== null;
  },
  replacement: (content, node) => {
    const href = (node as HTMLElement).getAttribute('href');
    const text = content.trim();
    if (!text) return '';
    return `[${text}](${href})`;
  },
});

class TerminalBrowser {
  private history: HistoryEntry[] = [];
  private historyIndex = -1;
  private currentPage: PageState = {
    url: '',
    title: '',
    content: '',
    links: [],
    loading: false,
    error: null,
  };
  private rl: readline.Interface;
  private running = true;
  private isLoading = false;
  private commandQueue: string[] = [];

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    this.showLogo();
    this.showHelp();
    this.prompt();
  }

  private showLogo(): void {
    console.log('\n' + gradient.pastel(figlet.textSync('TermBrowser', { font: 'ANSI Shadow' })) + '\n');
  }

  private showHelp(): void {
    console.log(chalk.yellowBright('Commands:'));
    console.log(`  ${chalk.green('g')} or ${chalk.green('go')} <url>  - Navigate to URL`);
    console.log(`  ${chalk.green('b')} or ${chalk.green('back')}       - Go back`);
    console.log(`  ${chalk.green('f')} or ${chalk.green('forward')}    - Go forward`);
    console.log(`  ${chalk.green('r')} or ${chalk.green('refresh')}    - Refresh page`);
    console.log(`  ${chalk.green('l')} or ${chalk.green('links')}      - Show links`);
    console.log(`  ${chalk.green('c')} or ${chalk.green('content')}    - Show content`);
    console.log(`  ${chalk.green('h')} or ${chalk.green('help')}       - Show help`);
    console.log(`  ${chalk.green('q')} or ${chalk.green('quit')}       - Quit`);
    console.log('');
  }

  private prompt(): void {
    if (!this.running) return;

    const urlDisplay = this.currentPage.url 
      ? chalk.dim(`[${this.historyIndex + 1}/${this.history.length}] `) + chalk.cyan(this.currentPage.url)
      : chalk.gray('No URL loaded');

    this.rl.question(`${chalk.green('❯')} ${urlDisplay} > `, (input) => {
      if (this.isLoading) {
        this.commandQueue.push(input.trim());
      } else {
        this.handleCommand(input.trim());
      }
      if (this.running) {
        this.prompt();
      }
    });
  }

  private handleCommand(input: string): void {
    if (!input) return;

    const parts = input.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');

    switch (command) {
      case 'g':
      case 'go':
        if (args) {
          this.navigateTo(args);
        } else {
          console.log(chalk.red('Please provide a URL'));
        }
        break;
      case 'b':
      case 'back':
        this.goBack();
        break;
      case 'f':
      case 'forward':
        this.goForward();
        break;
      case 'r':
      case 'refresh':
        if (this.currentPage.url) {
          this.navigateTo(this.currentPage.url);
        } else {
          console.log(chalk.red('No page to refresh'));
        }
        break;
      case 'l':
      case 'links':
        this.showLinks();
        break;
      case 'c':
      case 'content':
        this.showContent();
        break;
      case 'h':
      case 'help':
        this.showHelp();
        break;
      case 'q':
      case 'quit':
      case 'exit':
        this.quit();
        break;
      default:
        // Try to navigate if it looks like a URL
        if (command.match(/^[a-z0-9]/i)) {
          this.navigateTo(input);
        } else {
          console.log(chalk.red(`Unknown command: ${command}. Type 'help' for commands.`));
        }
    }
  }

  private async navigateTo(url: string): Promise<void> {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    this.isLoading = true;
    console.log(chalk.yellow('⏳ Loading...'));

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TermBrowser/1.0; Terminal)',
          'Accept': 'text/html,application/xhtml+xml',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Remove unwanted elements
      $('script, style, meta, link, noscript, iframe, svg').remove();
      
      // Get title
      const title = $('title').text().trim() || 'Untitled';
      
      // Convert to markdown-like text
      const htmlContent = $('body').html() || '';
      let content = turndownService.turndown(htmlContent);
      
      // Clean up excessive newlines
      content = content.replace(/\n{3,}/g, '\n\n');
      
      // Extract links with indices
      const links: Link[] = [];
      let linkIndex = 1;
      $('a[href]').each((_, elem) => {
        const href = $(elem).attr('href');
        const text = $(elem).text().trim();
        if (href && text) {
          links.push({
            url: href.startsWith('http') ? href : new URL(href, url).href,
            text: text.substring(0, 60),
            index: linkIndex++,
          });
        }
      });

      const newEntry: HistoryEntry = { url, title };
      const newHistory = this.history.slice(0, this.historyIndex + 1);
      newHistory.push(newEntry);

      this.history = newHistory;
      this.historyIndex = newHistory.length - 1;
      
      this.currentPage = {
        url,
        title,
        content,
        links,
        loading: false,
        error: null,
      };

      this.isLoading = false;
      console.log(chalk.greenBright('✓ Loaded:'), chalk.white(title));
      console.log(chalk.dim(`   ${url}`));
      console.log(chalk.blue(`   Found ${links.length} links`));
      
      // Execute queued commands
      this.processCommandQueue();
      
    } catch (err) {
      this.isLoading = false;
      this.currentPage = {
        ...this.currentPage,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
      console.log(chalk.red(`❌ Error: ${this.currentPage.error}`));
      
      // Execute queued commands even on error
      this.processCommandQueue();
    }
  }

  private processCommandQueue(): void {
    if (this.commandQueue.length > 0) {
      const cmd = this.commandQueue.shift()!;
      setTimeout(() => this.handleCommand(cmd), 50);
    }
  }

  private goBack(): void {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const entry = this.history[this.historyIndex];
      console.log(chalk.yellow(`← Going back to: ${entry.title}`));
      this.navigateTo(entry.url);
    } else {
      console.log(chalk.red('No previous page in history'));
    }
  }

  private goForward(): void {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const entry = this.history[this.historyIndex];
      console.log(chalk.yellow(`→ Going forward to: ${entry.title}`));
      this.navigateTo(entry.url);
    } else {
      console.log(chalk.red('No next page in history'));
    }
  }

  private showLinks(): void {
    if (this.currentPage.links.length === 0) {
      console.log(chalk.gray('No links on this page'));
      return;
    }

    console.log(chalk.greenBright('\n🔗 Links:'));
    console.log('─'.repeat(60));
    
    this.currentPage.links.forEach(link => {
      console.log(
        `${chalk.yellow(`[${link.index}]`)} ${chalk.blue(link.text)}\n   ${chalk.gray(link.url)}`
      );
    });
    
    console.log('─'.repeat(60));
  }

  private showContent(): void {
    if (!this.currentPage.content) {
      console.log(chalk.gray('No content loaded'));
      return;
    }

    console.log(chalk.magentaBright('\n📄 Page Content:'));
    console.log('─'.repeat(60));
    console.log(chalk.white(this.currentPage.content));
    console.log('─'.repeat(60));
  }

  private quit(): void {
    console.log(chalk.cyan('\nThanks for using TermBrowser! 👋\n'));
    this.running = false;
    this.rl.close();
    process.exit(0);
  }
}

// Start the browser
new TerminalBrowser();
