/**
 * Init Command
 * Set up LineHook in a project with interactive mode selection
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');

const GITHUB_ACTION_TEMPLATE = `name: Update LineHook Stats

on:
  push:
    branches: [main, master]
  workflow_dispatch:

jobs:
  update-stats:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install LineHook
        run: npm install -g linehook
      
      - name: Generate Stats
        run: |
          mkdir -p .linehook/badges
          linehook badge --save --type all
          linehook graph --type summary --output .linehook/stats-card.svg
      
      - name: Commit Stats
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add .linehook/
          git diff --staged --quiet || git commit -m "Update LineHook stats [skip ci]"
          git pull --rebase
          git push
`;

const LINEHOOK_CONFIG_TEMPLATE = {
    version: '1.0.0',
    mode: 'offline',  // 'offline' or 'auto'
    autoPull: true,   // Pull before push to avoid SVG conflicts
    directories: ['.'],
    extensions: [],
    exclude: [
        'node_modules', '.git', 'vendor', 'dist', 'build',
        '__pycache__', '.venv', 'coverage'
    ],
    badges: {
        style: 'flat',
        color: 'blue'
    },
    graphs: {
        width: 600,
        height: 400
    }
};

/**
 * Create directory if it doesn't exist
 */
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

/**
 * Display mode explanation
 */
function displayModeInfo() {
    console.log('');
    console.log(chalk.bold('How do you want LineHook to work?'));
    console.log('');
    console.log(chalk.cyan('  [1] Offline Mode') + chalk.gray(' (Manual Updates)'));
    console.log(chalk.gray('      - Generate badges locally with `linehook badge --save`'));
    console.log(chalk.gray('      - Commit and push the SVG files to your repo'));
    console.log(chalk.gray('      - Badges are static files - work forever, no server needed'));
    console.log(chalk.gray('      - Update manually whenever you want'));
    console.log('');
    console.log(chalk.cyan('  [2] Auto Mode') + chalk.gray(' (GitHub Actions)'));
    console.log(chalk.gray('      - Creates a GitHub Action workflow in your repo'));
    console.log(chalk.gray('      - Badges auto-update on every push to main/master'));
    console.log(chalk.gray('      - Runs on GitHub\'s servers (free, always-on)'));
    console.log(chalk.gray('      - No external server or webhook service needed'));
    console.log('');
}

/**
 * Interactive mode selection
 */
async function selectMode(options) {
    // If flags provided, skip interactive
    if (options.offline) return 'offline';
    if (options.auto || options.githubAction) return 'auto';
    if (options.yes) return 'auto'; // Default for non-interactive is now AUTO

    displayModeInfo();

    const { mode } = await inquirer.prompt([
        {
            type: 'list',
            name: 'mode',
            message: 'Select update mode:',
            choices: [
                {
                    name: 'Auto - GitHub Actions (updates on every push) [Recommended]',
                    value: 'auto',
                    short: 'Auto'
                },
                {
                    name: 'Offline - Manual updates (static files, always work)',
                    value: 'offline',
                    short: 'Offline'
                }
            ],
            default: 'auto'
        }
    ]);

    return mode;
}

/**
 * Ask for additional options
 */
async function selectOptions(mode, cmdOptions) {
    if (cmdOptions.yes) {
        return {
            generateNow: true,
            theme: 'default',
            dark: false
        };
    }

    const questions = [
        {
            type: 'confirm',
            name: 'generateNow',
            message: 'Generate badges now?',
            default: true
        },
        {
            type: 'list',
            name: 'theme',
            message: 'Select a color theme:',
            choices: [
                { name: 'Default (Blue)', value: 'default' },
                { name: 'GitHub Light', value: 'github' },
                { name: 'GitHub Dark', value: 'githubDark' },
                { name: 'Dracula', value: 'dracula' },
                { name: 'Nord', value: 'nord' },
                { name: 'Tokyo Night', value: 'tokyoNight' },
                { name: 'Catppuccin', value: 'catppuccin' },
                { name: 'Monokai', value: 'monokai' },
                { name: 'Neon', value: 'neon' },
                { name: 'Ocean', value: 'ocean' }
            ],
            default: 'default'
        }
    ];

    return inquirer.prompt(questions);
}

/**
 * Main init command handler
 */
async function initCommand(options) {
    console.log('');
    console.log(chalk.bold.blue('LineHook Setup'));
    console.log(chalk.gray('='.repeat(50)));

    const projectRoot = process.cwd();
    const linehookDir = path.join(projectRoot, '.linehook');

    // Mode selection
    const mode = await selectMode(options);

    console.log('');
    console.log(chalk.gray('-'.repeat(50)));
    console.log(chalk.bold(`Selected: ${mode === 'auto' ? 'Auto Mode (GitHub Actions)' : 'Offline Mode (Manual)'}`));
    console.log(chalk.gray('-'.repeat(50)));
    console.log('');

    // Create .linehook directory
    const spinner = ora('Creating .linehook directory...').start();
    ensureDir(linehookDir);
    ensureDir(path.join(linehookDir, 'badges'));
    spinner.succeed('Created .linehook directory');

    // Create config file
    const configPath = path.join(linehookDir, 'config.json');
    const config = { ...LINEHOOK_CONFIG_TEMPLATE, mode };

    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log(chalk.green('  [OK]') + ' Created config.json');
    } else {
        // Update existing config with mode
        try {
            const existing = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            existing.mode = mode;
            fs.writeFileSync(configPath, JSON.stringify(existing, null, 2));
            console.log(chalk.green('  [OK]') + ' Updated config.json');
        } catch {
            console.log(chalk.yellow('  [--]') + ' config.json already exists');
        }
    }

    // Set up GitHub Action for auto mode
    if (mode === 'auto') {
        const workflowDir = path.join(projectRoot, '.github', 'workflows');
        const workflowPath = path.join(workflowDir, 'linehook.yml');

        ensureDir(workflowDir);

        if (!fs.existsSync(workflowPath)) {
            fs.writeFileSync(workflowPath, GITHUB_ACTION_TEMPLATE);
            console.log(chalk.green('  [OK]') + ' Created GitHub Action workflow');
            console.log(chalk.gray('        .github/workflows/linehook.yml'));
        } else {
            console.log(chalk.yellow('  [--]') + ' GitHub Action already exists');
        }
    }

    // Add to .gitignore if needed
    const gitignorePath = path.join(projectRoot, '.gitignore');
    let gitignoreContent = '';

    if (fs.existsSync(gitignorePath)) {
        gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    }

    if (!gitignoreContent.includes('.linehook/stats.json')) {
        const addition = '\n# LineHook temp files\n.linehook/stats.json\n';
        fs.appendFileSync(gitignorePath, addition);
        console.log(chalk.green('  [OK]') + ' Updated .gitignore');
    }

    // Get additional options
    const userOptions = await selectOptions(mode, options);

    // Generate badges now if requested
    if (userOptions.generateNow) {
        console.log('');
        const genSpinner = ora('Generating badges...').start();

        try {
            const StatsEngine = require('../core/stats-engine');
            const BadgeGenerator = require('../core/badge-generator');
            const GraphGenerator = require('../core/graph-generator');

            const engine = new StatsEngine({});
            const stats = await engine.analyze();

            const badgeGen = new BadgeGenerator({
                style: 'flat',
                theme: userOptions.theme
            });
            const graphGen = new GraphGenerator({
                theme: userOptions.theme
            });

            // Generate badges
            const badgeTypes = ['lines', 'files', 'chars', 'code'];
            for (const type of badgeTypes) {
                const values = {
                    lines: stats.totalLines,
                    files: stats.textFiles,
                    chars: stats.characters,
                    code: stats.codeLines
                };
                const svg = badgeGen.generate(type, values[type], { statType: type });
                const badgePath = path.join(linehookDir, 'badges', `${type}.svg`);
                fs.writeFileSync(badgePath, svg);
            }

            // Generate stats card
            const summaryCard = graphGen.generate('summary', stats);
            fs.writeFileSync(path.join(linehookDir, 'stats-card.svg'), summaryCard);

            genSpinner.succeed('Generated badges and stats card');
        } catch (error) {
            genSpinner.fail('Failed to generate badges');
            console.log(chalk.red(`  Error: ${error.message}`));
        }
    }

    // Success message
    console.log('');
    console.log(chalk.bold.green('[OK] LineHook initialized successfully!'));
    console.log('');

    // Mode-specific next steps
    if (mode === 'auto') {
        console.log(chalk.bold('How it works:'));
        console.log('');
        console.log(chalk.gray('  1. Push this commit to GitHub'));
        console.log(chalk.gray('  2. GitHub Actions will run automatically'));
        console.log(chalk.gray('  3. Badges will update on every push'));
        console.log('');
        console.log(chalk.bold('Add to your README:'));
        console.log('');
        console.log(chalk.cyan('  ![Lines](.linehook/badges/lines.svg)'));
        console.log(chalk.cyan('  ![Stats](.linehook/stats-card.svg)'));
        console.log('');
        console.log(chalk.gray('  The badges are static files hosted in your repo.'));
        console.log(chalk.gray('  GitHub Actions updates them automatically - no server needed!'));
    } else {
        console.log(chalk.bold('Next steps:'));
        console.log('');
        console.log(chalk.cyan('  1.') + ' Add badges to your README:');
        console.log(chalk.gray('     ![Lines](.linehook/badges/lines.svg)'));
        console.log('');
        console.log(chalk.cyan('  2.') + ' Commit and push');
        console.log('');
        console.log(chalk.cyan('  3.') + ' To update badges later:');
        console.log(chalk.gray('     $ linehook badge --save'));
        console.log(chalk.gray('     $ git add .linehook/ && git commit -m "Update stats"'));
        console.log('');
        console.log(chalk.gray('  Tip: Run `linehook init --auto` to enable auto-updates'));
    }

    console.log('');
}

module.exports = initCommand;
