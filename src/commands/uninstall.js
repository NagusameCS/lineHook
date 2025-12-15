/**
 * Uninstall Command
 * Remove LineHook from a project
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');

/**
 * Remove directory recursively
 */
function removeDir(dirPath) {
    if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
        return true;
    }
    return false;
}

/**
 * Remove LineHook entries from .gitignore
 */
function cleanGitignore(projectRoot) {
    const gitignorePath = path.join(projectRoot, '.gitignore');

    if (!fs.existsSync(gitignorePath)) {
        return false;
    }

    let content = fs.readFileSync(gitignorePath, 'utf8');
    const originalContent = content;

    // Remove LineHook section from .gitignore
    // Pattern matches the comment and the entry
    const patterns = [
        /\n?# LineHook temp files\n\.linehook\/stats\.json\n?/g,
        /\n?# LineHook\n\.linehook\/?\n?/g,
        /\n?\.linehook\/stats\.json\n?/g,
        /\n?\.linehook\/?\n?/g
    ];

    for (const pattern of patterns) {
        content = content.replace(pattern, '\n');
    }

    // Clean up multiple newlines
    content = content.replace(/\n{3,}/g, '\n\n').trim() + '\n';

    if (content !== originalContent) {
        fs.writeFileSync(gitignorePath, content);
        return true;
    }

    return false;
}

/**
 * Main uninstall command handler
 */
async function uninstallCommand(options) {
    console.log('');
    console.log(chalk.bold.red('LineHook Uninstall'));
    console.log(chalk.gray('='.repeat(50)));
    console.log('');

    const projectRoot = process.cwd();
    const linehookDir = path.join(projectRoot, '.linehook');
    const workflowPath = path.join(projectRoot, '.github', 'workflows', 'linehook.yml');

    // Check what exists
    const hasLinehookDir = fs.existsSync(linehookDir);
    const hasWorkflow = fs.existsSync(workflowPath);

    if (!hasLinehookDir && !hasWorkflow) {
        console.log(chalk.yellow('LineHook is not installed in this project.'));
        console.log('');
        return;
    }

    // Show what will be removed
    console.log(chalk.bold('The following will be removed:'));
    console.log('');

    if (hasLinehookDir) {
        console.log(chalk.red('  • ') + '.linehook/ directory (config, badges, graphs)');
    }

    if (hasWorkflow) {
        console.log(chalk.red('  • ') + '.github/workflows/linehook.yml (GitHub Action)');
    }

    console.log(chalk.red('  • ') + 'LineHook entries from .gitignore');
    console.log('');

    // Confirm unless --yes flag is passed
    if (!options.yes) {
        const { confirm } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: 'Are you sure you want to uninstall LineHook from this project?',
                default: false
            }
        ]);

        if (!confirm) {
            console.log('');
            console.log(chalk.gray('Uninstall cancelled.'));
            console.log('');
            return;
        }
    }

    console.log('');

    // Remove .linehook directory
    if (hasLinehookDir) {
        const spinner = ora('Removing .linehook directory...').start();
        try {
            removeDir(linehookDir);
            spinner.succeed('Removed .linehook directory');
        } catch (error) {
            spinner.fail(`Failed to remove .linehook directory: ${error.message}`);
        }
    }

    // Remove GitHub Action workflow
    if (hasWorkflow) {
        const spinner = ora('Removing GitHub Action workflow...').start();
        try {
            fs.unlinkSync(workflowPath);
            spinner.succeed('Removed GitHub Action workflow');

            // Clean up empty .github/workflows directory if it's empty
            const workflowsDir = path.join(projectRoot, '.github', 'workflows');
            const githubDir = path.join(projectRoot, '.github');

            if (fs.existsSync(workflowsDir)) {
                const workflowFiles = fs.readdirSync(workflowsDir);
                if (workflowFiles.length === 0) {
                    fs.rmdirSync(workflowsDir);

                    // Also remove .github if empty
                    if (fs.existsSync(githubDir)) {
                        const githubFiles = fs.readdirSync(githubDir);
                        if (githubFiles.length === 0) {
                            fs.rmdirSync(githubDir);
                        }
                    }
                }
            }
        } catch (error) {
            spinner.fail(`Failed to remove workflow: ${error.message}`);
        }
    }

    // Clean .gitignore
    const spinner = ora('Cleaning .gitignore...').start();
    try {
        const cleaned = cleanGitignore(projectRoot);
        if (cleaned) {
            spinner.succeed('Cleaned .gitignore');
        } else {
            spinner.info('No LineHook entries found in .gitignore');
        }
    } catch (error) {
        spinner.fail(`Failed to clean .gitignore: ${error.message}`);
    }

    // Success message
    console.log('');
    console.log(chalk.bold.green('[OK] LineHook has been uninstalled from this project.'));
    console.log('');

    if (!options.keepGlobal) {
        console.log(chalk.gray('To also remove LineHook globally, run:'));
        console.log(chalk.cyan('  npm uninstall -g linehook'));
        console.log('');
    }

    console.log(chalk.gray('Note: If you had LineHook badges in your README, you may want to remove them.'));
    console.log('');
}

module.exports = uninstallCommand;
