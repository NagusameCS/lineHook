/**
 * Badge Generator v2
 * Creates SVG badges with theme support, dark mode, links, and animations
 */

const { ThemeManager } = require('./themes');

class BadgeGenerator {
    constructor(options = {}) {
        this.style = options.style || 'flat';
        this.color = options.color || 'blue';
        this.themeManager = new ThemeManager(options.theme || 'default');
        this.animate = options.animate || false;
        this.showIcon = options.icon || false;
        // New customization options
        this.link = options.link || null;           // URL to link to
        this.logo = options.logo || null;           // Custom logo URL or base64
        this.logoWidth = options.logoWidth || 14;   // Logo width
        this.labelColor = options.labelColor || null; // Custom label background
        this.prefix = options.prefix || '';         // Text before value
        this.suffix = options.suffix || '';         // Text after value
        this.scale = options.scale || 1;            // Badge scale factor
    }

    /**
     * Set theme
     */
    setTheme(themeName) {
        this.themeManager.setTheme(themeName);
        return this;
    }

    /**
     * Color name to hex mapping
     */
    getColor(colorName) {
        const colors = {
            // Standard colors
            blue: '#007ec6',
            green: '#4c1',
            brightgreen: '#4c1',
            yellowgreen: '#a4a61d',
            yellow: '#dfb317',
            orange: '#fe7d37',
            red: '#e05d44',
            lightgrey: '#9f9f9f',
            gray: '#555',
            grey: '#555',

            // Language colors
            javascript: '#f7df1e',
            typescript: '#3178c6',
            python: '#3776ab',
            ruby: '#cc342d',
            go: '#00add8',
            rust: '#dea584',
            java: '#b07219',
            csharp: '#239120',
            php: '#777bb4',
            swift: '#fa7343',
            kotlin: '#a97bff',

            // Custom
            purple: '#8b5cf6',
            pink: '#ec4899',
            indigo: '#6366f1',
            teal: '#14b8a6',
            cyan: '#06b6d4'
        };

        if (colorName.startsWith('#')) {
            return colorName;
        }

        return colors[colorName.toLowerCase()] || colors.blue;
    }

    /**
     * Get stat-specific color from theme
     */
    getStatColor(statType) {
        return this.themeManager.getStatColor(statType);
    }

    /**
     * Get badge background colors from theme
     */
    getBadgeColors() {
        return this.themeManager.getBadgeColors();
    }

    /**
     * Get icon SVG for stat type
     */
    getIcon(type) {
        const icons = {
            lines: '<path fill="currentColor" d="M3 5h18v2H3zm0 4h12v2H3zm0 4h18v2H3zm0 4h12v2H3z"/>',
            code: '<path fill="currentColor" d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>',
            files: '<path fill="currentColor" d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>',
            chars: '<path fill="currentColor" d="M2.5 4v3h5v12h3V7h5V4h-13zm19 5h-9v3h3v7h3v-7h3V9z"/>',
            assets: '<path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>',
            pages: '<path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>',
            languages: '<path fill="currentColor" d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>'
        };
        return icons[type] || icons.lines;
    }

    /**
     * Calculate text width (approximate)
     */
    textWidth(text, fontSize = 11, fontWeight = 'normal') {
        const avgCharWidth = fontWeight === 'bold' ? fontSize * 0.65 : fontSize * 0.58;
        return Math.ceil(text.length * avgCharWidth);
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
     * Generate flat style badge with theme support
     */
    generateFlat(label, value, color, statType) {
        const colors = this.getBadgeColors();
        const valueColor = color ? this.getColor(color) : this.getStatColor(statType);
        const labelWidth = this.textWidth(label) + 12;
        const valueWidth = this.textWidth(value) + 12;
        const totalWidth = labelWidth + valueWidth;
        const height = 20;
        const isDark = this.themeManager.isDark();
        const gradientId = `grad-${Math.random().toString(36).substr(2, 9)}`;

        return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}">
  <defs>
    <linearGradient id="${gradientId}" x2="0" y2="100%">
      <stop offset="0" stop-color="${isDark ? '#fff' : '#bbb'}" stop-opacity=".1"/>
      <stop offset="1" stop-opacity=".1"/>
    </linearGradient>
    <clipPath id="round"><rect width="${totalWidth}" height="${height}" rx="3" fill="#fff"/></clipPath>
  </defs>
  <g clip-path="url(#round)">
    <rect width="${labelWidth}" height="${height}" fill="${colors.labelBg}"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="${height}" fill="${valueColor}"/>
    <rect width="${totalWidth}" height="${height}" fill="url(#${gradientId})"/>
  </g>
  <g fill="${colors.labelText}" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${labelWidth / 2}" y="14">${label}</text>
    <text x="${labelWidth + valueWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${value}</text>
    <text x="${labelWidth + valueWidth / 2}" y="14">${value}</text>
  </g>
</svg>`;
    }

    /**
     * Generate flat-square style badge with theme support
     */
    generateFlatSquare(label, value, color, statType) {
        const colors = this.getBadgeColors();
        const valueColor = color ? this.getColor(color) : this.getStatColor(statType);
        const labelWidth = this.textWidth(label) + 12;
        const valueWidth = this.textWidth(value) + 12;
        const totalWidth = labelWidth + valueWidth;
        const height = 20;

        return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}">
  <g>
    <rect width="${labelWidth}" height="${height}" fill="${colors.labelBg}"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="${height}" fill="${valueColor}"/>
  </g>
  <g fill="${colors.labelText}" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="14">${label}</text>
    <text x="${labelWidth + valueWidth / 2}" y="14">${value}</text>
  </g>
</svg>`;
    }

    /**
     * Generate for-the-badge style with theme support
     */
    generateForTheBadge(label, value, color, statType) {
        const colors = this.getBadgeColors();
        const valueColor = color ? this.getColor(color) : this.getStatColor(statType);
        const labelUpper = label.toUpperCase();
        const valueUpper = String(value).toUpperCase();
        const labelWidth = this.textWidth(labelUpper, 10, 'bold') + 20;
        const valueWidth = this.textWidth(valueUpper, 10, 'bold') + 20;
        const totalWidth = labelWidth + valueWidth;
        const height = 28;

        return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}">
  <g>
    <rect width="${labelWidth}" height="${height}" fill="${colors.labelBg}"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="${height}" fill="${valueColor}"/>
  </g>
  <g fill="${colors.labelText}" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif" font-size="10" font-weight="600" letter-spacing="1">
    <text x="${labelWidth / 2}" y="18">${labelUpper}</text>
    <text x="${labelWidth + valueWidth / 2}" y="18">${valueUpper}</text>
  </g>
</svg>`;
    }

    /**
     * Generate plastic style badge with theme support
     */
    generatePlastic(label, value, color, statType) {
        const colors = this.getBadgeColors();
        const valueColor = color ? this.getColor(color) : this.getStatColor(statType);
        const labelWidth = this.textWidth(label) + 12;
        const valueWidth = this.textWidth(value) + 12;
        const totalWidth = labelWidth + valueWidth;
        const height = 18;
        const gradientId = `plastic-${Math.random().toString(36).substr(2, 9)}`;

        return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}">
  <defs>
    <linearGradient id="${gradientId}" x2="0" y2="100%">
      <stop offset="0" stop-color="#fff" stop-opacity=".7"/>
      <stop offset=".1" stop-color="#aaa" stop-opacity=".1"/>
      <stop offset=".9" stop-opacity=".3"/>
      <stop offset="1" stop-opacity=".5"/>
    </linearGradient>
    <clipPath id="round"><rect width="${totalWidth}" height="${height}" rx="4" fill="#fff"/></clipPath>
  </defs>
  <g clip-path="url(#round)">
    <rect width="${labelWidth}" height="${height}" fill="${colors.labelBg}"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="${height}" fill="${valueColor}"/>
    <rect width="${totalWidth}" height="${height}" fill="url(#${gradientId})"/>
  </g>
  <g fill="${colors.labelText}" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="13" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${labelWidth / 2}" y="12">${label}</text>
    <text x="${labelWidth + valueWidth / 2}" y="13" fill="#010101" fill-opacity=".3">${value}</text>
    <text x="${labelWidth + valueWidth / 2}" y="12">${value}</text>
  </g>
</svg>`;
    }

    /**
     * Generate social style badge
     */
    generateSocial(label, value, color, statType) {
        const colors = this.getBadgeColors();
        const valueColor = color ? this.getColor(color) : this.getStatColor(statType);
        const labelWidth = this.textWidth(label) + 16;
        const valueWidth = this.textWidth(value, 11, 'bold') + 16;
        const totalWidth = labelWidth + valueWidth + 8;
        const height = 20;
        const isDark = this.themeManager.isDark();

        return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}">
  <style>
    .label { fill: ${isDark ? '#cdd9e5' : '#333'} }
    .value { fill: ${valueColor}; font-weight: 600 }
  </style>
  <rect width="${totalWidth}" height="${height}" fill="${isDark ? '#21262d' : '#fff'}" rx="3" stroke="${isDark ? '#30363d' : '#dbdbdb'}" stroke-width="1"/>
  <g font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif" font-size="11">
    <text x="8" y="14" class="label">${label}</text>
    <text x="${labelWidth + 4}" y="14" class="value">${value}</text>
  </g>
</svg>`;
    }

    /**
     * Generate badge with icon
     */
    generateWithIcon(label, value, color, statType) {
        const colors = this.getBadgeColors();
        const valueColor = color ? this.getColor(color) : this.getStatColor(statType);
        const iconWidth = 16;
        const iconPadding = 6;
        const labelWidth = this.textWidth(label) + 12 + iconWidth + iconPadding;
        const valueWidth = this.textWidth(value) + 12;
        const totalWidth = labelWidth + valueWidth;
        const height = 20;
        const iconPath = this.getIcon(statType);
        const gradientId = `icon-${Math.random().toString(36).substr(2, 9)}`;

        return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}">
  <defs>
    <linearGradient id="${gradientId}" x2="0" y2="100%">
      <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
      <stop offset="1" stop-opacity=".1"/>
    </linearGradient>
    <clipPath id="r"><rect width="${totalWidth}" height="${height}" rx="3"/></clipPath>
  </defs>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="${height}" fill="${colors.labelBg}"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="${height}" fill="${valueColor}"/>
    <rect width="${totalWidth}" height="${height}" fill="url(#${gradientId})"/>
  </g>
  <g fill="${colors.labelText}" transform="translate(5, 2) scale(0.67)">${iconPath}</g>
  <g fill="${colors.labelText}" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif" font-size="11">
    <text x="${iconWidth + iconPadding + (labelWidth - iconWidth - iconPadding) / 2}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${iconWidth + iconPadding + (labelWidth - iconWidth - iconPadding) / 2}" y="14">${label}</text>
    <text x="${labelWidth + valueWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${value}</text>
    <text x="${labelWidth + valueWidth / 2}" y="14">${value}</text>
  </g>
</svg>`;
    }

    /**
     * Generate animated badge with pulse effect
     */
    generateAnimated(label, value, color, statType) {
        const colors = this.getBadgeColors();
        const valueColor = color ? this.getColor(color) : this.getStatColor(statType);
        const labelWidth = this.textWidth(label) + 12;
        const valueWidth = this.textWidth(value) + 12;
        const totalWidth = labelWidth + valueWidth;
        const height = 20;
        const gradientId = `anim-${Math.random().toString(36).substr(2, 9)}`;

        return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}">
  <style>
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.8; } }
    @keyframes countUp { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
    .value-text { animation: countUp 0.5s ease-out, pulse 2s ease-in-out infinite; }
  </style>
  <defs>
    <linearGradient id="${gradientId}" x2="0" y2="100%">
      <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
      <stop offset="1" stop-opacity=".1"/>
    </linearGradient>
    <clipPath id="r"><rect width="${totalWidth}" height="${height}" rx="3"/></clipPath>
  </defs>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="${height}" fill="${colors.labelBg}"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="${height}" fill="${valueColor}"/>
    <rect width="${totalWidth}" height="${height}" fill="url(#${gradientId})"/>
  </g>
  <g fill="${colors.labelText}" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="14">${label}</text>
    <text class="value-text" x="${labelWidth + valueWidth / 2}" y="14">${value}</text>
  </g>
</svg>`;
    }

    /**
     * Generate badge in specified style
     */
    generate(label, value, options = {}) {
        const style = options.style || this.style;
        const color = options.color || null;  // Allow theme to provide colors if not specified
        const statType = options.statType || 'lines';
        const link = options.link || this.link;

        // Format value if it's a number
        let formattedValue = typeof value === 'number' ? this.formatNumber(value) : String(value);

        // Apply prefix/suffix
        const prefix = options.prefix || this.prefix;
        const suffix = options.suffix || this.suffix;
        if (prefix || suffix) {
            formattedValue = `${prefix}${formattedValue}${suffix}`;
        }

        // Generate base SVG
        let svg;

        // Handle animated badges
        if (options.animate || this.animate) {
            svg = this.generateAnimated(label, formattedValue, color, statType);
        }
        // Handle icon badges
        else if (options.icon || this.showIcon) {
            svg = this.generateWithIcon(label, formattedValue, color, statType);
        }
        else {
            switch (style) {
                case 'flat-square':
                    svg = this.generateFlatSquare(label, formattedValue, color, statType);
                    break;
                case 'for-the-badge':
                    svg = this.generateForTheBadge(label, formattedValue, color, statType);
                    break;
                case 'plastic':
                    svg = this.generatePlastic(label, formattedValue, color, statType);
                    break;
                case 'social':
                    svg = this.generateSocial(label, formattedValue, color, statType);
                    break;
                case 'flat':
                default:
                    svg = this.generateFlat(label, formattedValue, color, statType);
            }
        }

        // Wrap in link if provided
        if (link) {
            svg = this.wrapWithLink(svg, link);
        }

        return svg;
    }

    /**
     * Wrap SVG content with an anchor link
     */
    wrapWithLink(svg, url) {
        // Insert link wrapper around the content inside the svg
        const svgMatch = svg.match(/^(<svg[^>]*>)([\s\S]*)(<\/svg>)$/);
        if (svgMatch) {
            const [, openTag, content, closeTag] = svgMatch;
            // Add xlink namespace and wrap content in anchor
            const newOpenTag = openTag.replace('<svg', '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
            return `${newOpenTag}<a xlink:href="${this.escapeXml(url)}" target="_blank">${content}</a>${closeTag}`;
        }
        return svg;
    }

    /**
     * Escape XML special characters
     */
    escapeXml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    /**
     * Generate all stat badges
     */
    generateAll(stats, options = {}) {
        return {
            lines: this.generate('lines', stats.totalLines, { ...options, statType: 'lines' }),
            codeLines: this.generate('code lines', stats.codeLines, { ...options, statType: 'code' }),
            files: this.generate('files', stats.textFiles, { ...options, statType: 'files' }),
            characters: this.generate('characters', stats.characters, { ...options, statType: 'chars' }),
            assets: this.generate('assets', stats.assets.total, { ...options, statType: 'assets' }),
            pages: this.generate('pages', stats.pages, { ...options, statType: 'pages' }),
            languages: this.generate('languages', Object.keys(stats.languages || {}).length, { ...options, statType: 'languages' })
        };
    }

    /**
     * Get list of available themes
     */
    static getAvailableThemes() {
        return ThemeManager.getAvailableThemes();
    }
}

module.exports = BadgeGenerator;
