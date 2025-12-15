/**
 * Badge Command
 * Generate badges for README with theme support
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const StatsEngine = require('../core/stats-engine');
const BadgeGenerator = require('../core/badge-generator');

/**
 * Load config from .linehook/config.json
 */
function loadConfig() {
    const configPath = path.join(process.cwd(), '.linehook', 'config.json');
    if (fs.existsSync(configPath)) {
        try {
            return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch (e) {
            return {};
        }
    }
    return {};
}

/**
 * Main badge command handler
 */
async function badgeCommand(options) {
    const spinner = ora('Generating badges...').start();

    try {
        // Load config for default theme
        const config = loadConfig();

        // Determine theme (CLI flag > --dark shortcut > config > default)
        let theme = options.theme || config.theme || 'default';
        if (options.dark) {
            theme = 'dark';
        }

        // Get stats first
        const engine = new StatsEngine({
            dir: options.dir || '.',
            extensions: options.extensions,
            exclude: options.exclude,
            includeHidden: options.includeHidden,
            pagesDir: options.pagesDir
        });
        const stats = await engine.analyze();

        const generator = new BadgeGenerator({
            style: options.style || 'flat',
            color: options.color || null,  // Let theme provide colors if not specified
            theme: theme,
            icon: options.icon || false,
            animate: options.animate || false,
            link: options.link || null,
            prefix: options.prefix || '',
            suffix: options.suffix || '',
            labelColor: options.labelColor || null
        });

        // Generate requested badge(s)
        const badges = {};
        const badgeConfigs = {
            lines: { label: 'lines', value: stats.totalLines, statType: 'lines' },
            code: { label: 'code lines', value: stats.codeLines, statType: 'code' },
            files: { label: 'files', value: stats.textFiles, statType: 'files' },
            chars: { label: 'characters', value: stats.characters, statType: 'chars' },
            assets: { label: 'assets', value: stats.assets.total, statType: 'assets' },
            pages: { label: 'pages', value: stats.pages, statType: 'pages' },
            languages: { label: 'languages', value: Object.keys(stats.languages || {}).length, statType: 'languages' }
        };

        const typesToGenerate = options.type === 'all'
            ? Object.keys(badgeConfigs)
            : [options.type || 'lines'];

        for (const type of typesToGenerate) {
            const badgeConfig = badgeConfigs[type];
            if (badgeConfig) {
                // Allow custom label override
                const label = options.label || badgeConfig.label;

                badges[type] = generator.generate(label, badgeConfig.value, {
                    style: options.style,
                    color: options.color || null,
                    statType: badgeConfig.statType,
                    icon: options.icon,
                    animate: options.animate,
                    link: options.link,
                    prefix: options.prefix,
                    suffix: options.suffix
                });
            }
        }

        spinner.stop();

        // Save badges if requested
        if (options.save) {
            const badgeDir = path.join(process.cwd(), '.linehook', 'badges');

            if (!fs.existsSync(badgeDir)) {
                fs.mkdirSync(badgeDir, { recursive: true });
            }

            for (const [type, svg] of Object.entries(badges)) {
                const themeSuffix = theme !== 'default' ? `-${theme}` : '';
                const filePath = path.join(badgeDir, `${type}${themeSuffix}.svg`);
                fs.writeFileSync(filePath, svg);
                console.log(chalk.green('  [OK]') + ` Saved ${type}${themeSuffix}.svg`);
            }

            console.log('');
            console.log(chalk.bold('Theme: ') + chalk.cyan(theme));
            console.log('');
            console.log(chalk.bold('Add to your README:'));
            console.log('');
            for (const type of Object.keys(badges)) {
                const themeSuffix = theme !== 'default' ? `-${theme}` : '';
                console.log(chalk.gray(`  ![${type}](.linehook/badges/${type}${themeSuffix}.svg)`));
            }
            console.log('');

            return;
        }

        // Output SVG or markdown
        if (options.svg) {
            // Raw SVG output
            for (const [type, svg] of Object.entries(badges)) {
                if (Object.keys(badges).length > 1) {
                    console.log(chalk.gray(`<!-- ${type} -->`));
                }
                console.log(svg);
                console.log('');
            }
        } else if (options.html) {
            // HTML embed output
            console.log('');
            console.log(chalk.bold('HTML Embed Code') + chalk.gray(` [theme: ${theme}]`));
            console.log(chalk.gray('-'.repeat(40)));
            console.log('');

            console.log(chalk.bold('Option 1: Image tags (recommended)'));
            for (const type of Object.keys(badges)) {
                console.log(chalk.cyan(`  <img src=".linehook/badges/${type}.svg" alt="${type}">`));
            }
            console.log('');

            console.log(chalk.bold('Option 2: With link wrapper'));
            for (const type of Object.keys(badges)) {
                console.log(chalk.cyan(`  <a href="https://github.com/YOUR_USER/YOUR_REPO">`));
                console.log(chalk.cyan(`    <img src=".linehook/badges/${type}.svg" alt="${type}">`));
                console.log(chalk.cyan(`  </a>`));
            }
            console.log('');

            console.log(chalk.bold('Option 3: Inline SVG (fetch)'));
            console.log(chalk.gray('  <div id="stats"></div>'));
            console.log(chalk.gray('  <script>'));
            console.log(chalk.gray("    fetch('.linehook/badges/lines.svg')"));
            console.log(chalk.gray("      .then(r => r.text())"));
            console.log(chalk.gray("      .then(svg => document.getElementById('stats').innerHTML = svg);"));
            console.log(chalk.gray('  </script>'));
            console.log('');
        } else {
            // Markdown output
            console.log('');
            console.log(chalk.bold('Generated Badge(s)') + chalk.gray(` [theme: ${theme}]`));
            console.log(chalk.gray('-'.repeat(40)));
            console.log('');

            console.log(chalk.bold('Option 1: Save locally (works offline)'));
            console.log(chalk.gray('  Run: linehook badge --save'));
            console.log(chalk.gray('  Then add to README:'));
            for (const type of Object.keys(badges)) {
                console.log(chalk.cyan(`    ![${type}](.linehook/badges/${type}.svg)`));
            }
            console.log('');

            console.log(chalk.bold('Option 2: Use shields.io (dynamic)'));
            console.log(chalk.gray('  Set up GitHub Action, then use:'));
            console.log(chalk.cyan('    ![Lines](https://img.shields.io/endpoint?url=YOUR_GIST_URL)'));
            console.log('');

            console.log(chalk.bold('Preview (copy SVG with --svg flag):'));
            for (const [type, svg] of Object.entries(badges)) {
                const config = badgeConfigs[type];
                const formatted = typeof config.value === 'number'
                    ? config.value.toLocaleString()
                    : config.value;
                console.log(`  ${type}: ${chalk.cyan(formatted)}`);
            }
            console.log('');
        }

    } catch (error) {
        spinner.fail('Badge generation failed');
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
    }
}

module.exports = badgeCommand;
