/**
 * Webhook Command
 * Manage webhooks for real-time stat updates
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const chalk = require('chalk');
const ora = require('ora');
const StatsEngine = require('../core/stats-engine');
const BadgeGenerator = require('../core/badge-generator');
const GraphGenerator = require('../core/graph-generator');

/**
 * Simple webhook server
 */
function createWebhookServer(port, options) {
    const server = http.createServer(async (req, res) => {
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Hub-Signature-256');

        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }

        const url = new URL(req.url, `http://localhost:${port}`);

        // Health check
        if (url.pathname === '/health' || url.pathname === '/') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok', service: 'linehook' }));
            return;
        }

        // Get current stats (JSON)
        if (url.pathname === '/stats' || url.pathname === '/stats.json') {
            try {
                const engine = new StatsEngine({});
                const stats = await engine.analyze();

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(stats, null, 2));
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
            return;
        }

        // Get badge SVG
        if (url.pathname.startsWith('/badge/')) {
            const badgeType = url.pathname.split('/')[2] || 'lines';
            const style = url.searchParams.get('style') || 'flat';
            const color = url.searchParams.get('color') || 'blue';

            try {
                const engine = new StatsEngine({});
                const stats = await engine.analyze();
                const generator = new BadgeGenerator({ style, color });

                const badgeConfigs = {
                    lines: { label: 'lines', value: stats.totalLines },
                    code: { label: 'code lines', value: stats.codeLines },
                    files: { label: 'files', value: stats.textFiles },
                    chars: { label: 'characters', value: stats.characters },
                    assets: { label: 'assets', value: stats.assets.total },
                    pages: { label: 'pages', value: stats.pages }
                };

                const config = badgeConfigs[badgeType] || badgeConfigs.lines;
                const svg = generator.generate(config.label, config.value, { style, color });

                res.writeHead(200, {
                    'Content-Type': 'image/svg+xml',
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                });
                res.end(svg);
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end(`Error: ${error.message}`);
            }
            return;
        }

        // Get graph SVG
        if (url.pathname.startsWith('/graph/')) {
            const graphType = url.pathname.split('/')[2] || 'summary';

            try {
                const engine = new StatsEngine({});
                const stats = await engine.analyze();
                const generator = new GraphGenerator({});

                const svg = generator.generate(graphType, stats);

                res.writeHead(200, {
                    'Content-Type': 'image/svg+xml',
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                });
                res.end(typeof svg === 'object' ? svg.summary || svg.bars : svg);
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end(`Error: ${error.message}`);
            }
            return;
        }

        // GitHub webhook endpoint
        if (url.pathname === '/webhook' && req.method === 'POST') {
            let body = '';

            req.on('data', chunk => {
                body += chunk.toString();
            });

            req.on('end', async () => {
                try {
                    const payload = JSON.parse(body);
                    const event = req.headers['x-github-event'];

                    console.log(chalk.blue(`Received ${event} event`));

                    // Only process push events
                    if (event === 'push') {
                        console.log(chalk.gray(`   Branch: ${payload.ref}`));
                        console.log(chalk.gray(`   Commits: ${payload.commits?.length || 0}`));

                        // Trigger stat regeneration
                        const engine = new StatsEngine({});
                        const stats = await engine.analyze();

                        console.log(chalk.green(`   [OK] Stats updated: ${stats.totalLines.toLocaleString()} lines`));

                        // Save updated stats
                        const linehookDir = path.join(process.cwd(), '.linehook');
                        if (fs.existsSync(linehookDir)) {
                            fs.writeFileSync(
                                path.join(linehookDir, 'stats.json'),
                                JSON.stringify(stats, null, 2)
                            );
                        }
                    }

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ received: true }));
                } catch (error) {
                    console.error(chalk.red('Webhook error:'), error.message);
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: error.message }));
                }
            });
            return;
        }

        // 404
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    });

    return server;
}

/**
 * Manual update function
 */
async function manualUpdate() {
    const spinner = ora('Updating stats...').start();

    try {
        const engine = new StatsEngine({});
        const stats = await engine.analyze();

        const linehookDir = path.join(process.cwd(), '.linehook');
        const badgeDir = path.join(linehookDir, 'badges');

        // Ensure directories exist
        if (!fs.existsSync(badgeDir)) {
            fs.mkdirSync(badgeDir, { recursive: true });
        }

        // Save stats
        fs.writeFileSync(
            path.join(linehookDir, 'stats.json'),
            JSON.stringify(stats, null, 2)
        );

        // Regenerate badges
        const badgeGenerator = new BadgeGenerator({});
        const badgeConfigs = {
            lines: { label: 'lines', value: stats.totalLines, color: 'blue' },
            code: { label: 'code lines', value: stats.codeLines, color: 'green' },
            files: { label: 'files', value: stats.textFiles, color: 'purple' },
            chars: { label: 'characters', value: stats.characters, color: 'orange' },
            assets: { label: 'assets', value: stats.assets.total, color: 'pink' },
            pages: { label: 'pages', value: stats.pages, color: 'teal' }
        };

        for (const [type, config] of Object.entries(badgeConfigs)) {
            const svg = badgeGenerator.generate(config.label, config.value, { color: config.color });
            fs.writeFileSync(path.join(badgeDir, `${type}.svg`), svg);
        }

        // Regenerate summary card
        const graphGenerator = new GraphGenerator({});
        const summaryCard = graphGenerator.generateSummaryCard(stats);
        fs.writeFileSync(path.join(linehookDir, 'stats-card.svg'), summaryCard);

        spinner.succeed('Stats updated successfully');

        console.log('');
        console.log(chalk.bold('Updated files:'));
        console.log(chalk.gray('  .linehook/stats.json'));
        console.log(chalk.gray('  .linehook/stats-card.svg'));
        console.log(chalk.gray('  .linehook/badges/*.svg'));
        console.log('');

    } catch (error) {
        spinner.fail('Update failed');
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
    }
}

/**
 * Main webhook command handler
 */
async function webhookCommand(options) {
    // Manual update
    if (options.update) {
        await manualUpdate();
        return;
    }

    // Setup webhook instructions
    if (options.setup) {
        console.log('');
        console.log(chalk.bold.blue('Webhook Setup'));
        console.log(chalk.gray('-'.repeat(40)));
        console.log('');
        console.log(chalk.bold('Option 1: Local Development Server'));
        console.log(chalk.gray('  Start a local server that provides live badge endpoints:'));
        console.log(chalk.cyan('  $ linehook webhook --serve'));
        console.log('');
        console.log(chalk.bold('Option 2: GitHub Actions (Recommended)'));
        console.log(chalk.gray('  Auto-update badges on every push:'));
        console.log(chalk.cyan('  $ linehook init --github-action'));
        console.log('');
        console.log(chalk.bold('Option 3: Manual Trigger'));
        console.log(chalk.gray('  Update stats anytime from command line:'));
        console.log(chalk.cyan('  $ linehook webhook --update'));
        console.log('');
        console.log(chalk.bold('Option 4: GitHub Webhook (Advanced)'));
        console.log(chalk.gray('  If you have a server, set up a webhook at:'));
        console.log(chalk.gray('  https://github.com/YOUR_REPO/settings/hooks/new'));
        console.log(chalk.gray('  '));
        console.log(chalk.gray('  Payload URL: https://your-server.com/webhook'));
        console.log(chalk.gray('  Content type: application/json'));
        console.log(chalk.gray('  Events: Just the push event'));
        console.log('');
        return;
    }

    // Start server
    if (options.serve) {
        const port = parseInt(options.port) || 3456;
        const server = createWebhookServer(port);

        server.listen(port, () => {
            console.log('');
            console.log(chalk.bold.blue('LineHook Server Running'));
            console.log(chalk.gray('-'.repeat(40)));
            console.log('');
            console.log(chalk.bold('Endpoints:'));
            console.log(`  ${chalk.green('GET')}  http://localhost:${port}/stats       ${chalk.gray('→ JSON stats')}`);
            console.log(`  ${chalk.green('GET')}  http://localhost:${port}/badge/lines  ${chalk.gray('→ Lines badge SVG')}`);
            console.log(`  ${chalk.green('GET')}  http://localhost:${port}/badge/files  ${chalk.gray('→ Files badge SVG')}`);
            console.log(`  ${chalk.green('GET')}  http://localhost:${port}/badge/chars  ${chalk.gray('→ Characters badge SVG')}`);
            console.log(`  ${chalk.green('GET')}  http://localhost:${port}/graph/summary ${chalk.gray('→ Summary card SVG')}`);
            console.log(`  ${chalk.blue('POST')} http://localhost:${port}/webhook      ${chalk.gray('→ GitHub webhook')}`);
            console.log('');
            console.log(chalk.bold('Badge URL examples:'));
            console.log(chalk.gray(`  http://localhost:${port}/badge/lines?style=flat-square&color=green`));
            console.log('');
            console.log(chalk.gray('Press Ctrl+C to stop'));
            console.log('');
        });

        // Keep process running
        process.on('SIGINT', () => {
            console.log(chalk.yellow('\nShutting down...'));
            server.close();
            process.exit(0);
        });

        return;
    }

    // Default: show setup help
    webhookCommand({ setup: true });
}

module.exports = webhookCommand;
