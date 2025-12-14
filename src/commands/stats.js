/**
 * Stats Command
 * Analyze project and display statistics
 */

const chalk = require('chalk');
const ora = require('ora');
const StatsEngine = require('../core/stats-engine');

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format number with commas
 */
function formatNumber(num) {
    return num.toLocaleString();
}

/**
 * Create a simple text-based bar
 */
function createBar(percentage, width = 20) {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    return chalk.blue('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
}

/**
 * Output as table (default)
 */
function outputTable(stats) {
    console.log('');
    console.log(chalk.bold.blue('╔════════════════════════════════════════════════════════════╗'));
    console.log(chalk.bold.blue('║') + chalk.bold('                      PROJECT STATISTICS                     ') + chalk.bold.blue('║'));
    console.log(chalk.bold.blue('╚════════════════════════════════════════════════════════════╝'));
    console.log('');

    // Main counts
    console.log(chalk.bold.white('  [FILES]'));
    console.log(chalk.gray('  ─────────────────────────────────────'));
    console.log(`     Total Files:     ${chalk.cyan(formatNumber(stats.totalFiles))}`);
    console.log(`     Text Files:      ${chalk.green(formatNumber(stats.textFiles))}`);
    console.log(`     Binary Files:    ${chalk.yellow(formatNumber(stats.binaryFiles))}`);
    console.log(`     Total Size:      ${chalk.magenta(formatBytes(stats.totalSize))}`);
    console.log('');

    // Line counts
    console.log(chalk.bold.white('  [LINES]'));
    console.log(chalk.gray('  ─────────────────────────────────────'));
    console.log(`     Total Lines:     ${chalk.cyan.bold(formatNumber(stats.totalLines))}`);
    console.log(`     Code Lines:      ${chalk.green(formatNumber(stats.codeLines))}`);
    console.log(`     Blank Lines:     ${chalk.gray(formatNumber(stats.blankLines))}`);
    console.log('');

    // Character counts
    console.log(chalk.bold.white('  [CHARACTERS]'));
    console.log(chalk.gray('  ─────────────────────────────────────'));
    console.log(`     Total Chars:     ${chalk.cyan(formatNumber(stats.characters))}`);
    console.log(`     Non-whitespace:  ${chalk.green(formatNumber(stats.charactersNoWhitespace))}`);
    console.log('');

    // Asset counts
    if (stats.assets.total > 0) {
        console.log(chalk.bold.white('  [ASSETS]'));
        console.log(chalk.gray('  ─────────────────────────────────────'));
        console.log(`     Total Assets:    ${chalk.cyan(formatNumber(stats.assets.total))}`);
        if (stats.assets.images > 0) console.log(`       Images:        ${chalk.yellow(formatNumber(stats.assets.images))}`);
        if (stats.assets.videos > 0) console.log(`       Videos:        ${chalk.red(formatNumber(stats.assets.videos))}`);
        if (stats.assets.audio > 0) console.log(`       Audio:         ${chalk.magenta(formatNumber(stats.assets.audio))}`);
        if (stats.assets.fonts > 0) console.log(`       Fonts:         ${chalk.blue(formatNumber(stats.assets.fonts))}`);
        if (stats.assets.documents > 0) console.log(`       Documents:     ${chalk.green(formatNumber(stats.assets.documents))}`);
        console.log('');
    }

    // Pages
    if (stats.pages > 0) {
        console.log(chalk.bold.white('  [PAGES]'));
        console.log(chalk.gray('  ─────────────────────────────────────'));
        console.log(`     Index Pages:     ${chalk.cyan(formatNumber(stats.pages))}`);
        if (stats.pageFiles.length <= 5) {
            stats.pageFiles.forEach(file => {
                console.log(`       ${chalk.gray('→')} ${chalk.white(file)}`);
            });
        }
        console.log('');
    }

    // Language breakdown
    if (stats.languagesSorted.length > 0) {
        console.log(chalk.bold.white('  [LANGUAGES]'));
        console.log(chalk.gray('  ─────────────────────────────────────'));

        const topLanguages = stats.languagesSorted.slice(0, 10);
        topLanguages.forEach(lang => {
            const bar = createBar(parseFloat(lang.percentage));
            const name = lang.name.padEnd(20);
            const lines = formatNumber(lang.lines).padStart(10);
            const pct = `${lang.percentage}%`.padStart(6);
            console.log(`     ${chalk.white(name)} ${bar} ${chalk.cyan(lines)} ${chalk.gray(pct)}`);
        });

        if (stats.languagesSorted.length > 10) {
            console.log(chalk.gray(`     ... and ${stats.languagesSorted.length - 10} more languages`));
        }
        console.log('');
    }

    // Footer
    console.log(chalk.gray(`  Completed in ${stats.analysisTime}ms`));
    console.log('');
}

/**
 * Output as JSON
 */
function outputJSON(stats) {
    // Remove fileList for cleaner output unless very few files
    const output = { ...stats };
    if (output.fileList && output.fileList.length > 20) {
        output.fileList = `[${output.fileList.length} files - use --verbose to see all]`;
    }
    console.log(JSON.stringify(output, null, 2));
}

/**
 * Output as Markdown
 */
function outputMarkdown(stats) {
    console.log('# Project Statistics\n');

    console.log('## Overview\n');
    console.log('| Metric | Value |');
    console.log('|--------|-------|');
    console.log(`| Total Files | ${formatNumber(stats.totalFiles)} |`);
    console.log(`| Total Lines | ${formatNumber(stats.totalLines)} |`);
    console.log(`| Code Lines | ${formatNumber(stats.codeLines)} |`);
    console.log(`| Characters | ${formatNumber(stats.characters)} |`);
    console.log(`| Assets | ${formatNumber(stats.assets.total)} |`);
    console.log(`| Pages | ${formatNumber(stats.pages)} |`);
    console.log('');

    if (stats.languagesSorted.length > 0) {
        console.log('## Languages\n');
        console.log('| Language | Files | Lines | % |');
        console.log('|----------|-------|-------|---|');
        stats.languagesSorted.slice(0, 10).forEach(lang => {
            console.log(`| ${lang.name} | ${lang.files} | ${formatNumber(lang.lines)} | ${lang.percentage}% |`);
        });
        console.log('');
    }

    console.log(`*Generated by [LineHook](https://github.com/NagusameCS/lineHook) on ${new Date().toISOString().split('T')[0]}*`);
}

/**
 * Main stats command handler
 */
async function statsCommand(options) {
    const spinner = ora('Analyzing project...').start();

    try {
        const engine = new StatsEngine({
            dir: options.dir || '.',
            extensions: options.extensions,
            exclude: options.exclude,
            includeHidden: options.includeHidden
        });

        const stats = await engine.analyze();
        spinner.stop();

        // Output based on format
        switch (options.output) {
            case 'json':
                outputJSON(stats);
                break;
            case 'markdown':
            case 'md':
                outputMarkdown(stats);
                break;
            case 'table':
            default:
                outputTable(stats);
                break;
        }

        return stats;
    } catch (error) {
        spinner.fail('Analysis failed');
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
    }
}

module.exports = statsCommand;
