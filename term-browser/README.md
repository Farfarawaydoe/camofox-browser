# TermBrowser 🌐

A fully functional text-based web browser that runs directly in your terminal. Browse the web with a clean, text-only interface featuring navigation history, link extraction, and markdown-style content rendering.

## Features

- 🌍 **Web Navigation**: Visit any website by entering URLs
- 📜 **History Management**: Go back and forward through your browsing history
- 🔗 **Link Extraction**: View all links on a page with numbered indices
- 📄 **Content Rendering**: Clean markdown-style text rendering of web pages
- 🎨 **Beautiful UI**: Colorful ASCII art logo and formatted output
- ⚡ **Fast & Lightweight**: No graphical overhead, pure terminal experience

## Installation

```bash
cd term-browser
npm install
npm run build
```

## Usage

### Run in development mode:
```bash
npm run dev
```

### Or build and start:
```bash
npm run build
npm start
```

### Or use the CLI directly:
```bash
node dist/browser.js
```

## Commands

| Command | Description |
|---------|-------------|
| `g` or `go <url>` | Navigate to a URL |
| `b` or `back` | Go back in history |
| `f` or `forward` | Go forward in history |
| `r` or `refresh` | Refresh current page |
| `l` or `links` | Show all links on current page |
| `c` or `content` | Show page content |
| `h` or `help` | Show help message |
| `q` or `quit` | Exit the browser |

## Example Session

```
████████╗███████╗██████╗ ███████╗
╚══██╔══╝██╔════╝██╔══██╗██╔════╝
   ██║   █████╗  ██████╔╝███████╗
   ██║   ██╔══╝  ██╔══██╗╚════██║
   ██║   ███████╗██║  ██║███████║
   ╚═╝   ╚══════╝╚═╝  ╚═╝╚══════╝

Commands:
  g or go <url>  - Navigate to URL
  b or back       - Go back
  f or forward    - Go forward
  r or refresh    - Refresh page
  l or links      - Show links
  c or content    - Show content
  h or help       - Show help
  q or quit       - Quit

❯ example.com
⏳ Loading...
✓ Loaded: Example Domain
   https://example.com
   Found 1 links

❯ [1/1] https://example.com > l

🔗 Links:
────────────────────────────────────────────────────────────
[1] Learn more
   https://iana.org/domains/example
────────────────────────────────────────────────────────────

❯ [1/1] https://example.com > c

📄 Page Content:
────────────────────────────────────────────────────────────
# Example Domain

This domain is for use in documentation examples without needing permission. Avoid use in operations.

[Learn more](https://iana.org/domains/example)
────────────────────────────────────────────────────────────
```

## How It Works

1. **URL Input**: Enter a URL (with or without http/https prefix)
2. **Fetching**: The browser fetches the HTML content using node-fetch
3. **Parsing**: Cheerio parses the HTML and removes scripts, styles, and other non-content elements
4. **Conversion**: Turndown converts HTML to markdown-style text
5. **Display**: Content and links are displayed with color-coded formatting
6. **Navigation**: History is tracked for back/forward navigation

## Technology Stack

- **TypeScript**: Type-safe JavaScript
- **node-fetch**: HTTP requests
- **Cheerio**: HTML parsing and manipulation
- **Turndown**: HTML to Markdown conversion
- **Chalk**: Terminal colors and styling
- **Figlet**: ASCII art generation
- **Gradient-string**: Colorful gradients

## License

MIT
