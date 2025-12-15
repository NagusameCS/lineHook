/**
 * Graph Command
 * Generate visual statistics graphs with theme support
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const StatsEngine = require('../core/stats-engine');
const GraphGenerator = require('../core/graph-generator');

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
 * Main graph command handler
 */
async function graphCommand(options) {
    const spinner = ora('Generating graph...').start();

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

        // Check if we have language data
        if (stats.languagesSorted.length === 0) {
            spinner.warn('No language data found. Generating summary card only.');
            options.type = 'summary';
        }

        const generator = new GraphGenerator({
            width: options.width,
            height: options.height,
            theme: theme,
            title: options.title || null,
            subtitle: options.subtitle || null,
            footer: options.footer || null,
            link: options.link || null,
            hideTitle: options.hideTitle || false
        });

        // Generate graph (use generateWithLink to apply link wrapping if needed)
        const svg = generator.generateWithLink(options.type, stats);

        spinner.stop();

        console.log(chalk.gray(`Theme: ${theme}`));

        // Output or save
        if (options.output) {
            const outputPath = path.resolve(options.output);
            const outputDir = path.dirname(outputPath);

            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            // Handle dashboard (multiple outputs)
            if (typeof svg === 'object') {
                const baseName = path.basename(outputPath, path.extname(outputPath));
                const ext = path.extname(outputPath) || '.svg';

                for (const [type, content] of Object.entries(svg)) {
                    const themeSuffix = theme !== 'default' ? `-${theme}` : '';
                    const filePath = path.join(outputDir, `${baseName}-${type}${themeSuffix}${ext}`);
                    fs.writeFileSync(filePath, content);
                    console.log(chalk.green('  [OK]') + ` Saved ${path.basename(filePath)}`);
                }
            } else {
                fs.writeFileSync(outputPath, svg);
                console.log(chalk.green('  [OK]') + ` Saved ${path.basename(outputPath)}`);
            }

            console.log('');
            console.log(chalk.bold('Add to your README:'));
            console.log(chalk.gray(`  ![Stats](${path.relative(process.cwd(), outputPath)})`));
            console.log('');

        } else {
            // Print to stdout
            if (typeof svg === 'object') {
                for (const [type, content] of Object.entries(svg)) {
                    console.log(chalk.gray(`\n<!-- ${type} chart -->`));
                    console.log(content);
                }
            } else {
                console.log(svg);
            }
        }

    } catch (error) {
        spinner.fail('Graph generation failed');
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
    }
}

module.exports = graphCommand;
