/**
 * Theme Command
 * Preview and manage color themes
 */

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { ThemeManager, PALETTES } = require('../core/themes');
const BadgeGenerator = require('../core/badge-generator');

/**
 * Display a color swatch in terminal
 */
function colorSwatch(hex, label) {
    // Convert hex to RGB for terminal display
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    return chalk.rgb(r, g, b)('██') + ' ' + chalk.gray(label);
}

/**
 * Display theme preview in terminal
 */
function previewTheme(themeName) {
    const manager = new ThemeManager(themeName);
    const theme = PALETTES[themeName];
    const isDark = manager.isDark();

    console.log('\n' + chalk.bold(`Theme: ${theme.name || themeName}`) + (isDark ? chalk.gray(' (dark)') : chalk.gray(' (light)')));
    console.log(chalk.gray('─'.repeat(40)));

    // Show badge colors
    console.log('\n' + chalk.bold('Badge Colors:'));
    console.log('  ' + colorSwatch(theme.badge.labelBg, 'Label Background'));
    console.log('  ' + colorSwatch(theme.badge.labelText, 'Label Text'));
    console.log('  ' + colorSwatch(theme.badge.valueBg, 'Value Background'));
    console.log('  ' + colorSwatch(theme.badge.valueText, 'Value Text'));

    // Show graph colors
    console.log('\n' + chalk.bold('Graph Colors:'));
    console.log('  ' + colorSwatch(theme.graph.background, 'Background'));
    console.log('  ' + colorSwatch(theme.graph.text, 'Text'));
    console.log('  ' + colorSwatch(theme.graph.textSecondary, 'Text Secondary'));
    console.log('  ' + colorSwatch(theme.graph.border, 'Border'));

    // Show stat colors
    console.log('\n' + chalk.bold('Stat Colors:'));
    const statTypes = ['lines', 'code', 'files', 'chars', 'assets', 'pages'];
    statTypes.forEach(stat => {
        console.log('  ' + colorSwatch(manager.getStatColor(stat), stat));
    });

    // Show chart colors
    console.log('\n' + chalk.bold('Chart Palette:'));
    const chartColors = theme.colors || [];
    chartColors.slice(0, 8).forEach((color, i) => {
        process.stdout.write(colorSwatch(color, `${i + 1}`) + '  ');
        if ((i + 1) % 4 === 0) console.log('');
    });
    console.log('\n');
}

/**
 * List all available themes
 */
function listThemes() {
    console.log('\n' + chalk.bold('Available Themes:'));
    console.log(chalk.gray('─'.repeat(40)));

    const themes = Object.keys(PALETTES);
    const lightThemes = themes.filter(t => PALETTES[t].mode !== 'dark');
    const darkThemes = themes.filter(t => PALETTES[t].mode === 'dark');

    console.log('\n' + chalk.bold.yellow('Light Themes:'));
    lightThemes.forEach(name => {
        const theme = PALETTES[name];
        const color = theme.colors && theme.colors[0] ? theme.colors[0] : '#007ec6';
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        console.log('  ' + chalk.rgb(r, g, b)('*') + ' ' + name + chalk.gray(` - ${theme.name || name}`));
    });

    console.log('\n' + chalk.bold.blue('Dark Themes:'));
    darkThemes.forEach(name => {
        const theme = PALETTES[name];
        const color = theme.colors && theme.colors[0] ? theme.colors[0] : '#58a6ff';
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        console.log('  ' + chalk.rgb(r, g, b)('*') + ' ' + name + chalk.gray(` - ${theme.name || name}`));
    });

    console.log('\n' + chalk.gray('Use: linehook theme --preview <name> to see theme details'));
    console.log(chalk.gray('Use: linehook badge --theme <name> to use a theme'));
    console.log('');
}

/**
 * Set default theme in config
 */
function setDefaultTheme(themeName) {
    if (!PALETTES[themeName]) {
        console.error(chalk.red(`Unknown theme: ${themeName}`));
        console.log(chalk.gray('Available themes: ' + Object.keys(PALETTES).join(', ')));
        return;
    }

    const configDir = path.join(process.cwd(), '.linehook');
    const configPath = path.join(configDir, 'config.json');

    // Ensure directory exists
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }

    // Load or create config
    let config = {};
    if (fs.existsSync(configPath)) {
        try {
            config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch (e) {
            config = {};
        }
    }

    // Update theme
    config.theme = themeName;

    // Save config
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    console.log(chalk.green(`[OK] Default theme set to "${themeName}"`));
    console.log(chalk.gray(`  Saved to: ${configPath}`));
}

/**
 * Export theme as JSON
 */
function exportTheme(themeName) {
    if (!PALETTES[themeName]) {
        console.error(chalk.red(`Unknown theme: ${themeName}`));
        return;
    }

    const theme = PALETTES[themeName];
    console.log('\n' + chalk.bold(`Theme: ${themeName}`));
    console.log(chalk.gray('─'.repeat(40)));
    console.log(JSON.stringify(theme, null, 2));
    console.log('');
}

/**
 * Theme command handler
 */
async function themeCommand(options) {
    // List themes
    if (options.list) {
        listThemes();
        return;
    }

    // Preview specific theme
    if (options.preview) {
        if (!PALETTES[options.preview]) {
            console.error(chalk.red(`Unknown theme: ${options.preview}`));
            console.log(chalk.gray('Use: linehook theme --list to see available themes'));
            return;
        }
        previewTheme(options.preview);
        return;
    }

    // Set default theme
    if (options.set) {
        setDefaultTheme(options.set);
        return;
    }

    // Export theme
    if (options.export) {
        exportTheme(options.export);
        return;
    }

    // Default: show all themes
    listThemes();
}

module.exports = themeCommand;
