/**
 * LineHook - Main exports
 */

const StatsEngine = require('./core/stats-engine');
const BadgeGenerator = require('./core/badge-generator');
const GraphGenerator = require('./core/graph-generator');
const { ThemeManager, PALETTES } = require('./core/themes');

module.exports = {
    StatsEngine,
    BadgeGenerator,
    GraphGenerator,
    ThemeManager,
    PALETTES
};
