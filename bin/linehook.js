#!/usr/bin/env node

/**
 * LineHook CLI
 * Dynamic code statistics, badges, and graphs for any project
 */

const { program } = require('commander');
const chalk = require('chalk');
const path = require('path');
const https = require('https');

// Import commands
const statsCommand = require('../src/commands/stats');
const initCommand = require('../src/commands/init');
const badgeCommand = require('../src/commands/badge');
const webhookCommand = require('../src/commands/webhook');
const graphCommand = require('../src/commands/graph');
const themeCommand = require('../src/commands/theme');

const packageJson = require('../package.json');

/**
 * Check for package updates (non-blocking)
 */
function checkForUpdates() {
    const options = {
        hostname: 'registry.npmjs.org',
        path: '/linehook/latest',
        method: 'GET',
        timeout: 2000
    };

    const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const latest = JSON.parse(data).version;
                const current = packageJson.version;
                
                if (latest && latest !== current) {
                    // Compare versions
                    const latestParts = latest.split('.').map(Number);
                    const currentParts = current.split('.').map(Number);
                    
                    let isNewer = false;
                    for (let i = 0; i < 3; i++) {
                        if (latestParts[i] > currentParts[i]) {
                            isNewer = true;
                            break;
                        } else if (latestParts[i] < currentParts[i]) {
                            break;
                        }
                    }
                    
                    if (isNewer) {
                        console.log();
                        console.log(chalk.yellow('  Update available: ') + 
                            chalk.gray(current) + chalk.yellow(' -> ') + chalk.green(latest));
                        console.log(chalk.gray('  Run ') + chalk.cyan('npm update -g linehook') + chalk.gray(' to update'));
                        console.log();
                    }
                }
            } catch (e) {
                // Ignore parse errors
            }
        });
    });

    req.on('error', () => {}); // Silently ignore network errors
    req.on('timeout', () => req.destroy());
    req.end();
}

// Check for updates in background (don't block CLI)
checkForUpdates();

// ASCII Banner
const banner = `
${chalk.blue('╦   ╦ ╔╗╔ ╔═╗ ╦ ╦ ╔═╗ ╔═╗ ╦╔═')}
${chalk.blue('║   ║ ║║║ ║╣  ╠═╣ ║ ║ ║ ║ ╠╩╗')}
${chalk.blue('╩═╝ ╩ ╝╚╝ ╚═╝ ╩ ╩ ╚═╝ ╚═╝ ╩ ╩')}
${chalk.gray('Dynamic code stats for any project')}
`;

// Available themes for help text
const themeList = 'default, github, dark, githubDark, dracula, monokai, nord, tokyoNight, catppuccin, neon, sunset, ocean';

program
    .name('linehook')
    .description('Dynamic code statistics, badges, and graphs for any project')
    .version(packageJson.version)
    .addHelpText('before', banner);

// Stats command - main functionality
program
    .command('stats')
    .alias('s')
    .description('Analyze project and display statistics')
    .option('-d, --dir <path>', 'Directory to analyze', '.')
    .option('-e, --extensions <list>', 'File extensions to include (comma-separated)')
    .option('-x, --exclude <list>', 'Directories to exclude (comma-separated)')
    .option('-o, --output <format>', 'Output format: table, json, markdown', 'table')
    .option('--no-colors', 'Disable colored output')
    .option('--include-hidden', 'Include hidden files and directories')
    .option('--pages-dir <path>', 'Directory to search for pages (defaults to root)')
    .option('--theme <name>', `Color theme (${themeList})`, 'default')
    .option('--dark', 'Use dark theme (shortcut for --theme dark)')
    .action(statsCommand);

// Init command - set up LineHook in a project
program
    .command('init')
    .alias('i')
    .description('Initialize LineHook in your project')
    .option('--auto', 'Use Auto Mode with GitHub Actions (updates on every push)')
    .option('--offline', 'Use Offline Mode (manual updates)')
    .option('--github-action', 'Alias for --auto')
    .option('-y, --yes', 'Skip prompts and use defaults')
    .option('--theme <name>', `Default theme for badges/graphs`, 'default')
    .action(initCommand);

// Badge command - generate badge URLs/SVGs
program
    .command('badge')
    .alias('b')
    .description('Generate badge for your README')
    .option('-d, --dir <path>', 'Directory to analyze', '.')
    .option('-e, --extensions <list>', 'File extensions to include (comma-separated)')
    .option('-x, --exclude <list>', 'Directories to exclude (comma-separated)')
    .option('--include-hidden', 'Include hidden files and directories')
    .option('--pages-dir <path>', 'Directory to search for pages (defaults to root)')
    .option('-t, --type <type>', 'Badge type: lines, files, chars, assets, pages, all', 'lines')
    .option('-s, --style <style>', 'Badge style: flat, flat-square, plastic, for-the-badge, social', 'flat')
    .option('-c, --color <color>', 'Badge color (hex or name)', '')
    .option('-l, --label <text>', 'Custom label text (overrides default)')
    .option('--title <text>', 'Custom title/alt text for the badge')
    .option('--link <url>', 'URL to link the badge to (e.g., repo URL)')
    .option('--prefix <text>', 'Text to prepend to value')
    .option('--suffix <text>', 'Text to append to value')
    .option('--label-color <color>', 'Custom label background color')
    .option('--theme <name>', `Color theme (${themeList})`, 'default')
    .option('--dark', 'Use dark theme (shortcut for --theme dark)')
    .option('--icon', 'Include icon in badge')
    .option('--animate', 'Add subtle animation to badge')
    .option('--svg', 'Output raw SVG instead of markdown')
    .option('--html', 'Output HTML embed code for websites')
    .option('--save', 'Save badge SVG to .linehook/badges/')
    .action(badgeCommand);

// Graph command - generate visual statistics
program
    .command('graph')
    .alias('g')
    .description('Generate statistics graphs and charts')
    .option('-d, --dir <path>', 'Directory to analyze', '.')
    .option('-e, --extensions <list>', 'File extensions to include (comma-separated)')
    .option('-x, --exclude <list>', 'Directories to exclude (comma-separated)')
    .option('--include-hidden', 'Include hidden files and directories')
    .option('--pages-dir <path>', 'Directory to search for pages (defaults to root)')
    .option('-t, --type <type>', 'Graph type: breakdown, pie, summary, treemap, dashboard', 'breakdown')
    .option('-o, --output <file>', 'Output file path')
    .option('--title <text>', 'Custom title for the graph')
    .option('--subtitle <text>', 'Custom subtitle text')
    .option('--link <url>', 'URL to link the graph to (e.g., repo URL)')
    .option('--footer <text>', 'Custom footer text')
    .option('--hide-title', 'Hide the title from the graph')
    .option('--theme <name>', `Color theme (${themeList})`, 'default')
    .option('--dark', 'Use dark theme (shortcut for --theme dark)')
    .option('--format <format>', 'Output format: svg, png, html', 'svg')
    .option('--width <pixels>', 'Graph width', '600')
    .option('--height <pixels>', 'Graph height', '400')
    .action(graphCommand);

// Webhook command - manage webhooks
program
    .command('webhook')
    .alias('w')
    .description('Manage webhook for real-time stat updates')
    .option('--setup', 'Set up webhook with GitHub')
    .option('--serve', 'Start local webhook server')
    .option('--port <port>', 'Webhook server port', '3456')
    .option('--update', 'Manually trigger stat update')
    .option('--theme <name>', `Default theme for served badges`, 'default')
    .action(webhookCommand);

// Theme command - preview and manage themes
program
    .command('theme')
    .alias('t')
    .description('Preview and manage color themes')
    .option('-l, --list', 'List all available themes')
    .option('-p, --preview <name>', 'Preview a specific theme')
    .option('--set <name>', 'Set default theme in config')
    .option('--export <name>', 'Export theme as JSON')
    .action(themeCommand);

// Quick stats shortcut (default command)
program
    .argument('[directory]', 'Directory to analyze')
    .action((directory) => {
        if (directory) {
            statsCommand({ dir: directory, output: 'table' });
        } else {
            program.help();
        }
    });

// Parse arguments
program.parse();

// Show help if no arguments
if (!process.argv.slice(2).length) {
    console.log(banner);
    program.help();
}
