/**
 * Graph Generator v2
 * Creates SVG charts for code statistics with theme support
 */

const { ThemeManager } = require('./themes');

class GraphGenerator {
    constructor(options = {}) {
        this.width = parseInt(options.width) || 600;
        this.height = parseInt(options.height) || 400;
        this.padding = 40;
        this.themeManager = new ThemeManager(options.theme || 'default');
        // Customization options
        this.title = options.title || null;           // Custom title
        this.subtitle = options.subtitle || null;     // Custom subtitle
        this.footer = options.footer || null;         // Custom footer
        this.link = options.link || null;             // URL to link to
        this.hideTitle = options.hideTitle || false;  // Hide title
        this.repoName = options.repoName || null;     // Repository name
        this.repoUrl = options.repoUrl || null;       // Repository URL
    }

    /**
     * Set theme
     */
    setTheme(themeName) {
        this.themeManager.setTheme(themeName);
        return this;
    }

    /**
     * Get theme colors for graphs (with alias mappings)
     */
    getGraphColors() {
        const colors = this.themeManager.getGraphColors();
        // Add alias properties for compatibility
        return {
            ...colors,
            title: colors.text,           // title uses text color
            textMuted: colors.textSecondary  // textMuted uses textSecondary
        };
    }

    /**
     * Get chart palette (for pie/bar segments)
     */
    getChartColors() {
        return this.themeManager.getChartColors();
    }

    /**
     * Generate a pie chart for language breakdown
     */
    generateLanguagePie(stats) {
        const colors = this.getGraphColors();
        const chartColors = this.getChartColors();
        const languages = stats.languagesSorted.slice(0, 10);
        const total = languages.reduce((sum, lang) => sum + lang.lines, 0);

        const cx = this.width / 2;
        const cy = this.height / 2 - 20;
        const radius = Math.min(cx, cy) - 60;

        let paths = '';
        let legend = '';
        let startAngle = 0;

        languages.forEach((lang, i) => {
            const percentage = lang.lines / total;
            const angle = percentage * 2 * Math.PI;
            const endAngle = startAngle + angle;

            const x1 = cx + radius * Math.cos(startAngle);
            const y1 = cy + radius * Math.sin(startAngle);
            const x2 = cx + radius * Math.cos(endAngle);
            const y2 = cy + radius * Math.sin(endAngle);

            const largeArc = angle > Math.PI ? 1 : 0;
            const color = chartColors[i % chartColors.length];

            paths += `
    <path d="M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z" 
          fill="${color}" stroke="${colors.background}" stroke-width="2" class="slice">
      <title>${lang.name}: ${lang.lines.toLocaleString()} lines (${lang.percentage}%)</title>
    </path>`;

            // Legend
            const legendY = this.height - 80 + Math.floor(i / 2) * 20;
            const legendX = (i % 2) * (this.width / 2) + 20;
            legend += `
    <rect x="${legendX}" y="${legendY}" width="12" height="12" fill="${color}" rx="2"/>
    <text x="${legendX + 18}" y="${legendY + 10}" font-size="11" fill="${colors.text}">${lang.name} (${lang.percentage}%)</text>`;

            startAngle = endAngle;
        });

        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.width} ${this.height}" width="${this.width}" height="${this.height}">
  <style>
    text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; }
    .slice { transition: opacity 0.2s; }
    .slice:hover { opacity: 0.8; }
  </style>
  <rect width="100%" height="100%" fill="${colors.background}" rx="8"/>
  ${this.hideTitle ? '' : `<text x="${this.width / 2}" y="25" text-anchor="middle" font-size="16" font-weight="bold" fill="${colors.title}">${this.title || 'Language Breakdown'}</text>`}
  ${this.subtitle ? `<text x="${this.width / 2}" y="42" text-anchor="middle" font-size="11" fill="${colors.textMuted}">${this.subtitle}</text>` : ''}
  ${paths}
  ${legend}
</svg>`;
    }

    /**
     * Generate a horizontal bar chart
     */
    generateBarChart(stats) {
        const colors = this.getGraphColors();
        const chartColors = this.getChartColors();
        const languages = stats.languagesSorted.slice(0, 8);
        const maxLines = Math.max(...languages.map(l => l.lines));

        const barHeight = 30;
        const gap = 10;
        const chartHeight = languages.length * (barHeight + gap);
        const chartWidth = this.width - this.padding * 2 - 120;
        const startX = 130;

        let bars = '';

        languages.forEach((lang, i) => {
            const y = this.padding + 30 + i * (barHeight + gap);
            const width = (lang.lines / maxLines) * chartWidth;
            const color = chartColors[i % chartColors.length];

            bars += `
    <text x="${startX - 10}" y="${y + barHeight / 2 + 4}" text-anchor="end" font-size="12" fill="${colors.text}">${lang.name}</text>
    <rect x="${startX}" y="${y}" width="${width}" height="${barHeight}" fill="${color}" rx="4" class="bar">
      <title>${lang.name}: ${lang.lines.toLocaleString()} lines</title>
    </rect>
    <text x="${startX + width + 8}" y="${y + barHeight / 2 + 4}" font-size="11" fill="${colors.textMuted}">${this.formatNumber(lang.lines)}</text>`;
        });

        const height = chartHeight + this.padding * 2 + 40;

        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.width} ${height}" width="${this.width}" height="${height}">
  <style>
    text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; }
    .bar { transition: opacity 0.2s; }
    .bar:hover { opacity: 0.8; }
  </style>
  <rect width="100%" height="100%" fill="${colors.background}" rx="8"/>
  ${this.hideTitle ? '' : `<text x="${this.width / 2}" y="25" text-anchor="middle" font-size="16" font-weight="bold" fill="${colors.title}">${this.title || 'Lines by Language'}</text>`}
  ${this.subtitle ? `<text x="${this.width / 2}" y="42" text-anchor="middle" font-size="11" fill="${colors.textMuted}">${this.subtitle}</text>` : ''}
  ${bars}
</svg>`;
    }

    /**
     * Generate stats summary card
     */
    generateSummaryCard(stats) {
        const colors = this.getGraphColors();
        const statColors = {
            lines: this.themeManager.getStatColor('lines'),
            code: this.themeManager.getStatColor('code'),
            files: this.themeManager.getStatColor('files'),
            chars: this.themeManager.getStatColor('chars'),
            assets: this.themeManager.getStatColor('assets'),
            pages: this.themeManager.getStatColor('pages')
        };

        const items = [
            { label: 'Total Lines', value: stats.totalLines, color: statColors.lines },
            { label: 'Code Lines', value: stats.codeLines, color: statColors.code },
            { label: 'Files', value: stats.textFiles, color: statColors.files },
            { label: 'Characters', value: stats.characters, color: statColors.chars },
            { label: 'Assets', value: stats.assets.total, color: statColors.assets },
            { label: 'Pages', value: stats.pages, color: statColors.pages }
        ];

        const cardWidth = 300;
        const cardHeight = 200;
        const cols = 2;
        const cellWidth = cardWidth / cols - 20;
        const cellHeight = 50;

        let cells = '';
        items.forEach((item, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = 20 + col * (cellWidth + 20);
            const y = 55 + row * cellHeight;

            cells += `
    <text x="${x}" y="${y}" font-size="24" font-weight="bold" fill="${item.color}">${this.formatNumber(item.value)}</text>
    <text x="${x}" y="${y + 18}" font-size="11" fill="${colors.textMuted}">${item.label}</text>`;
        });

        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cardWidth} ${cardHeight}" width="${cardWidth}" height="${cardHeight}">
  <style>
    text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; }
  </style>
  <rect width="100%" height="100%" fill="${colors.background}" rx="8"/>
  <rect width="100%" height="100%" fill="none" stroke="${colors.border}" stroke-width="1" rx="8"/>
  ${this.hideTitle ? '' : `<text x="20" y="28" font-size="14" font-weight="bold" fill="${colors.title}">${this.title || 'Project Stats'}</text>`}
  ${this.subtitle ? `<text x="20" y="45" font-size="10" fill="${colors.textMuted}">${this.subtitle}</text>` : ''}
  ${cells}
</svg>`;
    }

    /**
     * Generate treemap visualization
     */
    generateTreemap(stats) {
        const colors = this.getGraphColors();
        const chartColors = this.getChartColors();
        const languages = stats.languagesSorted.slice(0, 12);
        const total = languages.reduce((sum, lang) => sum + lang.lines, 0);

        const width = this.width;
        const height = this.height - 60;
        const startY = 50;

        // Simple treemap layout
        let rects = '';
        let currentX = 0;
        let currentY = startY;
        let rowHeight = height / 2;
        let remainingWidth = width;
        let rowItems = [];

        languages.forEach((lang, i) => {
            const ratio = lang.lines / total;
            const area = ratio * width * height;
            const itemWidth = area / rowHeight;

            if (currentX + itemWidth > width + 1) {
                // Start new row
                currentX = 0;
                currentY += rowHeight;
                rowHeight = height - (currentY - startY);
                remainingWidth = width;
            }

            const color = chartColors[i % chartColors.length];
            const w = Math.min(itemWidth, remainingWidth);
            const h = rowHeight;

            rects += `
    <rect x="${currentX + 1}" y="${currentY + 1}" width="${w - 2}" height="${h - 2}" fill="${color}" rx="4" class="block">
      <title>${lang.name}: ${lang.lines.toLocaleString()} lines (${lang.percentage}%)</title>
    </rect>
    <text x="${currentX + w / 2}" y="${currentY + h / 2 + 4}" text-anchor="middle" font-size="${Math.min(12, w / 6)}" fill="${colors.background}" font-weight="500">${lang.name}</text>`;

            currentX += w;
            remainingWidth -= w;
        });

        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.width} ${this.height}" width="${this.width}" height="${this.height}">
  <style>
    text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; }
    .block { transition: opacity 0.2s; }
    .block:hover { opacity: 0.85; }
  </style>
  <rect width="100%" height="100%" fill="${colors.background}" rx="8"/>
  ${this.hideTitle ? '' : `<text x="${this.width / 2}" y="30" text-anchor="middle" font-size="16" font-weight="bold" fill="${colors.title}">${this.title || 'Language Treemap'}</text>`}
  ${this.subtitle ? `<text x="${this.width / 2}" y="47" text-anchor="middle" font-size="11" fill="${colors.textMuted}">${this.subtitle}</text>` : ''}
  ${rects}
</svg>`;
    }

    /**
     * Generate sparkline for trends
     */
    generateSparkline(data, options = {}) {
        const colors = this.getGraphColors();
        const width = options.width || 200;
        const height = options.height || 40;
        const color = options.color || this.themeManager.getStatColor('lines');

        if (!data || data.length < 2) {
            return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <rect width="100%" height="100%" fill="${colors.background}" rx="4"/>
  <text x="${width / 2}" y="${height / 2 + 4}" text-anchor="middle" font-size="10" fill="${colors.textMuted}">No data</text>
</svg>`;
        }

        const max = Math.max(...data);
        const min = Math.min(...data);
        const range = max - min || 1;
        const padding = 4;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        const points = data.map((value, i) => {
            const x = padding + (i / (data.length - 1)) * chartWidth;
            const y = padding + chartHeight - ((value - min) / range) * chartHeight;
            return `${x},${y}`;
        }).join(' ');

        // Create fill polygon
        const fillPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

        return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs>
    <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${color}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="${colors.background}" rx="4"/>
  <polygon points="${fillPoints}" fill="url(#sparkFill)"/>
  <polyline points="${points}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
    }

    /**
     * Generate full dashboard
     */
    generateDashboard(stats) {
        const pie = this.generateLanguagePie(stats);
        const bars = this.generateBarChart(stats);
        const summary = this.generateSummaryCard(stats);
        const treemap = this.generateTreemap(stats);

        return {
            pie,
            bars,
            summary,
            treemap
        };
    }

    /**
     * Format large numbers
     */
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        }
        return num.toLocaleString();
    }

    /**
     * Generate based on type
     */
    generate(type, stats) {
        switch (type) {
            case 'pie':
            case 'languages':
                return this.generateLanguagePie(stats);
            case 'bars':
            case 'breakdown':
                return this.generateBarChart(stats);
            case 'summary':
            case 'card':
                return this.generateSummaryCard(stats);
            case 'treemap':
                return this.generateTreemap(stats);
            case 'dashboard':
            case 'all':
                return this.generateDashboard(stats);
            default:
                return this.generateBarChart(stats);
        }
    }

    /**
     * Wrap SVG content with a link
     */
    wrapWithLink(svg, url) {
        if (!url) return svg;

        // Escape URL for XML
        const escapedUrl = url.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

        // Insert xlink namespace and wrap content in anchor
        return svg.replace(
            '<svg ',
            '<svg xmlns:xlink="http://www.w3.org/1999/xlink" '
        ).replace(
            /(<svg[^>]*>)/,
            `$1<a xlink:href="${escapedUrl}" target="_blank">`
        ).replace(
            /<\/svg>/,
            '</a></svg>'
        );
    }

    /**
     * Generate SVG with optional link wrapping
     */
    generateWithLink(type, stats) {
        let svg = this.generate(type, stats);

        // If dashboard, don't wrap (it's an object)
        if (typeof svg === 'object') {
            if (this.link) {
                // Wrap each chart in the dashboard
                Object.keys(svg).forEach(key => {
                    svg[key] = this.wrapWithLink(svg[key], this.link);
                });
            }
            return svg;
        }

        return this.link ? this.wrapWithLink(svg, this.link) : svg;
    }

    /**
     * Get available themes
     */
    static getAvailableThemes() {
        return ThemeManager.getAvailableThemes();
    }
}

module.exports = GraphGenerator;
