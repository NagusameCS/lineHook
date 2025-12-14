/**
 * Theme System
 * Provides color schemes and styling for badges, graphs, and output
 */

// Predefined color palettes
const PALETTES = {
    // Light themes
    default: {
        name: 'Default',
        mode: 'light',
        badge: {
            labelBg: '#555',
            labelText: '#fff',
            valueBg: '#007ec6',
            valueText: '#fff'
        },
        graph: {
            background: '#ffffff',
            text: '#333333',
            textSecondary: '#666666',
            border: '#e5e7eb',
            grid: '#f0f0f0'
        },
        colors: [
            '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
            '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
        ]
    },

    github: {
        name: 'GitHub',
        mode: 'light',
        badge: {
            labelBg: '#24292f',
            labelText: '#fff',
            valueBg: '#238636',
            valueText: '#fff'
        },
        graph: {
            background: '#ffffff',
            text: '#24292f',
            textSecondary: '#57606a',
            border: '#d0d7de',
            grid: '#f6f8fa'
        },
        colors: [
            '#238636', '#0969da', '#8250df', '#bf3989', '#cf222e',
            '#fb8f44', '#4d6d9a', '#1b7c83', '#d4a72c', '#57606a'
        ]
    },

    // Dark themes
    dark: {
        name: 'Dark',
        mode: 'dark',
        badge: {
            labelBg: '#2d333b',
            labelText: '#cdd9e5',
            valueBg: '#238636',
            valueText: '#ffffff'
        },
        graph: {
            background: '#0d1117',
            text: '#e6edf3',
            textSecondary: '#8b949e',
            border: '#30363d',
            grid: '#21262d'
        },
        colors: [
            '#58a6ff', '#f85149', '#3fb950', '#d29922', '#a371f7',
            '#f778ba', '#39c5cf', '#a5d6ff', '#ffa657', '#79c0ff'
        ]
    },

    githubDark: {
        name: 'GitHub Dark',
        mode: 'dark',
        badge: {
            labelBg: '#21262d',
            labelText: '#c9d1d9',
            valueBg: '#238636',
            valueText: '#ffffff'
        },
        graph: {
            background: '#0d1117',
            text: '#c9d1d9',
            textSecondary: '#8b949e',
            border: '#30363d',
            grid: '#161b22'
        },
        colors: [
            '#58a6ff', '#f85149', '#3fb950', '#d29922', '#a371f7',
            '#f778ba', '#39c5cf', '#a5d6ff', '#ffa657', '#79c0ff'
        ]
    },

    dracula: {
        name: 'Dracula',
        mode: 'dark',
        badge: {
            labelBg: '#44475a',
            labelText: '#f8f8f2',
            valueBg: '#bd93f9',
            valueText: '#282a36'
        },
        graph: {
            background: '#282a36',
            text: '#f8f8f2',
            textSecondary: '#6272a4',
            border: '#44475a',
            grid: '#383a59'
        },
        colors: [
            '#bd93f9', '#ff79c6', '#8be9fd', '#50fa7b', '#ffb86c',
            '#ff5555', '#f1fa8c', '#6272a4', '#ff79c6', '#bd93f9'
        ]
    },

    monokai: {
        name: 'Monokai',
        mode: 'dark',
        badge: {
            labelBg: '#3e3d32',
            labelText: '#f8f8f2',
            valueBg: '#a6e22e',
            valueText: '#272822'
        },
        graph: {
            background: '#272822',
            text: '#f8f8f2',
            textSecondary: '#75715e',
            border: '#49483e',
            grid: '#3e3d32'
        },
        colors: [
            '#a6e22e', '#f92672', '#66d9ef', '#fd971f', '#ae81ff',
            '#e6db74', '#f8f8f2', '#75715e', '#a6e22e', '#66d9ef'
        ]
    },

    nord: {
        name: 'Nord',
        mode: 'dark',
        badge: {
            labelBg: '#3b4252',
            labelText: '#eceff4',
            valueBg: '#88c0d0',
            valueText: '#2e3440'
        },
        graph: {
            background: '#2e3440',
            text: '#eceff4',
            textSecondary: '#d8dee9',
            border: '#3b4252',
            grid: '#434c5e'
        },
        colors: [
            '#88c0d0', '#81a1c1', '#5e81ac', '#bf616a', '#d08770',
            '#ebcb8b', '#a3be8c', '#b48ead', '#8fbcbb', '#81a1c1'
        ]
    },

    tokyoNight: {
        name: 'Tokyo Night',
        mode: 'dark',
        badge: {
            labelBg: '#1a1b26',
            labelText: '#a9b1d6',
            valueBg: '#7aa2f7',
            valueText: '#1a1b26'
        },
        graph: {
            background: '#1a1b26',
            text: '#c0caf5',
            textSecondary: '#565f89',
            border: '#292e42',
            grid: '#24283b'
        },
        colors: [
            '#7aa2f7', '#f7768e', '#9ece6a', '#e0af68', '#bb9af7',
            '#7dcfff', '#73daca', '#ff9e64', '#2ac3de', '#b4f9f8'
        ]
    },

    catppuccin: {
        name: 'Catppuccin',
        mode: 'dark',
        badge: {
            labelBg: '#313244',
            labelText: '#cdd6f4',
            valueBg: '#89b4fa',
            valueText: '#1e1e2e'
        },
        graph: {
            background: '#1e1e2e',
            text: '#cdd6f4',
            textSecondary: '#a6adc8',
            border: '#313244',
            grid: '#45475a'
        },
        colors: [
            '#89b4fa', '#f38ba8', '#a6e3a1', '#f9e2af', '#cba6f7',
            '#f5c2e7', '#94e2d5', '#fab387', '#74c7ec', '#b4befe'
        ]
    },

    // Special themes
    neon: {
        name: 'Neon',
        mode: 'dark',
        badge: {
            labelBg: '#0a0a0a',
            labelText: '#00ff88',
            valueBg: '#ff00ff',
            valueText: '#0a0a0a'
        },
        graph: {
            background: '#0a0a0a',
            text: '#00ff88',
            textSecondary: '#00cc6f',
            border: '#333333',
            grid: '#1a1a1a'
        },
        colors: [
            '#00ff88', '#ff00ff', '#00ffff', '#ffff00', '#ff0088',
            '#88ff00', '#ff8800', '#0088ff', '#ff0000', '#00ff00'
        ]
    },

    sunset: {
        name: 'Sunset',
        mode: 'dark',
        badge: {
            labelBg: '#2d1b4e',
            labelText: '#ffd6a5',
            valueBg: '#ff6b6b',
            valueText: '#2d1b4e'
        },
        graph: {
            background: '#1a0f2e',
            text: '#ffd6a5',
            textSecondary: '#c9a9ff',
            border: '#3d2266',
            grid: '#2d1b4e'
        },
        colors: [
            '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff8c42',
            '#845ec2', '#ffc75f', '#f9f871', '#ff6f91', '#00c9a7'
        ]
    },

    ocean: {
        name: 'Ocean',
        mode: 'dark',
        badge: {
            labelBg: '#0c2461',
            labelText: '#74b9ff',
            valueBg: '#00cec9',
            valueText: '#0c2461'
        },
        graph: {
            background: '#0a1628',
            text: '#74b9ff',
            textSecondary: '#5f9ea0',
            border: '#1e3a5f',
            grid: '#0d2137'
        },
        colors: [
            '#00cec9', '#74b9ff', '#0984e3', '#00b894', '#81ecec',
            '#55efc4', '#6c5ce7', '#a29bfe', '#fd79a8', '#ffeaa7'
        ]
    }
};

// Badge colors by stat type
const STAT_COLORS = {
    lines: { light: '#007ec6', dark: '#58a6ff' },
    code: { light: '#28a745', dark: '#3fb950' },
    files: { light: '#8b5cf6', dark: '#a371f7' },
    chars: { light: '#f59e0b', dark: '#d29922' },
    assets: { light: '#ec4899', dark: '#f778ba' },
    pages: { light: '#06b6d4', dark: '#39c5cf' },
    languages: { light: '#6366f1', dark: '#79c0ff' }
};

// Color utilities
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

function lighten(hex, percent) {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;

    const amount = (255 * percent) / 100;
    return rgbToHex(
        Math.min(255, rgb.r + amount),
        Math.min(255, rgb.g + amount),
        Math.min(255, rgb.b + amount)
    );
}

function darken(hex, percent) {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;

    const amount = (255 * percent) / 100;
    return rgbToHex(
        Math.max(0, rgb.r - amount),
        Math.max(0, rgb.g - amount),
        Math.max(0, rgb.b - amount)
    );
}

function withAlpha(hex, alpha) {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

class ThemeManager {
    constructor(themeName = 'default') {
        this.setTheme(themeName);
        this.customColors = {};
    }

    /**
     * Get list of available themes
     */
    static getThemes() {
        return Object.entries(PALETTES).map(([id, theme]) => ({
            id,
            name: theme.name,
            mode: theme.mode
        }));
    }

    /**
     * Get themes filtered by mode
     */
    static getLightThemes() {
        return ThemeManager.getThemes().filter(t => t.mode === 'light');
    }

    static getDarkThemes() {
        return ThemeManager.getThemes().filter(t => t.mode === 'dark');
    }

    /**
     * Set active theme
     */
    setTheme(themeName) {
        if (PALETTES[themeName]) {
            this.theme = PALETTES[themeName];
            this.themeName = themeName;
        } else {
            // Try to find by name (case insensitive)
            const found = Object.entries(PALETTES).find(
                ([_, t]) => t.name.toLowerCase() === themeName.toLowerCase()
            );
            if (found) {
                this.theme = found[1];
                this.themeName = found[0];
            } else {
                this.theme = PALETTES.default;
                this.themeName = 'default';
            }
        }
        return this;
    }

    /**
     * Get current theme
     */
    getTheme() {
        return this.theme;
    }

    /**
     * Check if dark mode
     */
    isDark() {
        return this.theme.mode === 'dark';
    }

    /**
     * Get badge colors
     */
    getBadgeColors() {
        return this.theme.badge;
    }

    /**
     * Get graph colors
     */
    getGraphColors() {
        return this.theme.graph;
    }

    /**
     * Get chart color palette
     */
    getChartColors() {
        return this.theme.colors;
    }

    /**
     * Get color for a stat type
     */
    getStatColor(statType) {
        const colors = STAT_COLORS[statType];
        if (!colors) return this.theme.colors[0];

        if (this.customColors[statType]) {
            return this.customColors[statType];
        }

        return this.isDark() ? colors.dark : colors.light;
    }

    /**
     * Override a specific stat color
     */
    setStatColor(statType, color) {
        this.customColors[statType] = color;
        return this;
    }

    /**
     * Create custom theme from options
     */
    static createCustomTheme(options = {}) {
        const base = PALETTES[options.base || 'default'];

        return {
            name: options.name || 'Custom',
            mode: options.mode || base.mode,
            badge: {
                ...base.badge,
                ...options.badge
            },
            graph: {
                ...base.graph,
                ...options.graph
            },
            colors: options.colors || base.colors
        };
    }

    /**
     * Export theme as JSON
     */
    exportTheme() {
        return JSON.stringify(this.theme, null, 2);
    }

    /**
     * Import custom theme
     */
    importTheme(themeJson) {
        try {
            const theme = typeof themeJson === 'string'
                ? JSON.parse(themeJson)
                : themeJson;

            // Validate required fields
            if (!theme.badge || !theme.graph || !theme.colors) {
                throw new Error('Invalid theme structure');
            }

            this.theme = theme;
            this.themeName = 'custom';
            return true;
        } catch (error) {
            return false;
        }
    }
}

module.exports = {
    ThemeManager,
    PALETTES,
    STAT_COLORS,
    hexToRgb,
    rgbToHex,
    lighten,
    darken,
    withAlpha
};
