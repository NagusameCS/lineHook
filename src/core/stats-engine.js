/**
 * LineHook Core Stats Engine
 * Analyzes project files and generates comprehensive statistics
 */

const fs = require('fs');
const path = require('path');
const fg = require('fast-glob');

// Binary file extensions (skip these for line counting)
const BINARY_EXTENSIONS = new Set([
    // Images
    '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.svg', '.webp', '.tiff', '.tif', '.psd', '.ai', '.eps',
    // Videos
    '.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm', '.m4v', '.mpeg', '.mpg',
    // Audio
    '.mp3', '.wav', '.ogg', '.flac', '.aac', '.wma', '.m4a', '.opus',
    // Archives
    '.zip', '.tar', '.gz', '.bz2', '.7z', '.rar', '.xz', '.zst',
    // Documents (binary)
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.odt', '.ods', '.odp',
    // Fonts
    '.ttf', '.otf', '.woff', '.woff2', '.eot',
    // Executables & Libraries
    '.exe', '.dll', '.so', '.dylib', '.bin', '.app', '.msi', '.dmg', '.deb', '.rpm',
    // Other binary
    '.class', '.jar', '.pyc', '.pyo', '.o', '.a', '.lib', '.obj',
    '.db', '.sqlite', '.sqlite3', '.lock',
    '.wasm', '.map'
]);

// Asset extensions (for asset counting)
const ASSET_EXTENSIONS = {
    images: ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.svg', '.webp', '.tiff', '.psd', '.ai'],
    videos: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm', '.m4v'],
    audio: ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.wma', '.m4a'],
    fonts: ['.ttf', '.otf', '.woff', '.woff2', '.eot'],
    documents: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']
};

// Default directories to exclude
const DEFAULT_EXCLUDES = [
    'node_modules', '.git', 'vendor', 'dist', 'build', '.next', '.nuxt',
    '__pycache__', '.venv', 'venv', 'env', '.env', 'coverage', '.nyc_output',
    '.cache', '.parcel-cache', '.turbo', 'target', 'out', 'bin', 'obj',
    '.idea', '.vscode', '.vs', '*.egg-info', '.tox', '.pytest_cache'
];

// Language detection by extension
const LANGUAGE_MAP = {
    '.js': 'JavaScript',
    '.jsx': 'JavaScript (JSX)',
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript (TSX)',
    '.py': 'Python',
    '.pyi': 'Python (Stub)',
    '.rb': 'Ruby',
    '.go': 'Go',
    '.rs': 'Rust',
    '.java': 'Java',
    '.kt': 'Kotlin',
    '.scala': 'Scala',
    '.c': 'C',
    '.h': 'C Header',
    '.cpp': 'C++',
    '.hpp': 'C++ Header',
    '.cc': 'C++',
    '.cs': 'C#',
    '.fs': 'F#',
    '.swift': 'Swift',
    '.m': 'Objective-C',
    '.php': 'PHP',
    '.pl': 'Perl',
    '.pm': 'Perl Module',
    '.lua': 'Lua',
    '.r': 'R',
    '.R': 'R',
    '.jl': 'Julia',
    '.ex': 'Elixir',
    '.exs': 'Elixir Script',
    '.erl': 'Erlang',
    '.clj': 'Clojure',
    '.hs': 'Haskell',
    '.ml': 'OCaml',
    '.elm': 'Elm',
    '.dart': 'Dart',
    '.vue': 'Vue',
    '.svelte': 'Svelte',
    '.html': 'HTML',
    '.htm': 'HTML',
    '.css': 'CSS',
    '.scss': 'SCSS',
    '.sass': 'Sass',
    '.less': 'Less',
    '.styl': 'Stylus',
    '.json': 'JSON',
    '.yaml': 'YAML',
    '.yml': 'YAML',
    '.xml': 'XML',
    '.toml': 'TOML',
    '.ini': 'INI',
    '.md': 'Markdown',
    '.mdx': 'MDX',
    '.rst': 'reStructuredText',
    '.txt': 'Plain Text',
    '.sh': 'Shell',
    '.bash': 'Bash',
    '.zsh': 'Zsh',
    '.fish': 'Fish',
    '.ps1': 'PowerShell',
    '.bat': 'Batch',
    '.cmd': 'Batch',
    '.sql': 'SQL',
    '.graphql': 'GraphQL',
    '.gql': 'GraphQL',
    '.proto': 'Protocol Buffers',
    '.dockerfile': 'Dockerfile',
    '.tf': 'Terraform',
    '.hcl': 'HCL',
    '.zig': 'Zig',
    '.nim': 'Nim',
    '.v': 'V',
    '.sol': 'Solidity',
    '.asm': 'Assembly',
    '.s': 'Assembly',
    '.cob': 'COBOL',
    '.f90': 'Fortran',
    '.f95': 'Fortran'
};

class StatsEngine {
    constructor(options = {}) {
        this.rootDir = path.resolve(options.dir || '.');
        this.extensions = options.extensions ? options.extensions.split(',').map(e => e.trim()) : null;
        this.excludeDirs = options.exclude
            ? options.exclude.split(',').map(e => e.trim())
            : [...DEFAULT_EXCLUDES]; // Copy to avoid mutating default

        this.includeHidden = options.includeHidden || false;
        this.pagesDir = options.pagesDir ? path.resolve(options.pagesDir) : null;

        // Load .linehookignore if it exists
        this.loadIgnoreFile();
    }

    /**
     * Load patterns from .linehookignore
     */
    loadIgnoreFile() {
        const ignorePath = path.join(this.rootDir, '.linehookignore');
        if (fs.existsSync(ignorePath)) {
            try {
                const content = fs.readFileSync(ignorePath, 'utf8');
                const lines = content.split('\n')
                    .map(line => line.trim())
                    .filter(line => line && !line.startsWith('#')); // Skip empty lines and comments

                // Add to exclude dirs
                this.excludeDirs.push(...lines);
            } catch (e) {
                // Ignore read errors
            }
        }
    }

    /**
     * Check if a file is binary based on extension
     */
    isBinary(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        return BINARY_EXTENSIONS.has(ext);
    }

    /**
     * Get asset type for a file
     */
    getAssetType(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        for (const [type, extensions] of Object.entries(ASSET_EXTENSIONS)) {
            if (extensions.includes(ext)) {
                return type;
            }
        }
        return null;
    }

    /**
     * Get language for a file
     */
    getLanguage(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const basename = path.basename(filePath).toLowerCase();

        // Special cases
        if (basename === 'dockerfile') return 'Dockerfile';
        if (basename === 'makefile') return 'Makefile';
        if (basename === 'cmakelists.txt') return 'CMake';
        if (basename.endsWith('.d.ts')) return 'TypeScript (Declaration)';

        return LANGUAGE_MAP[ext] || null;
    }

    /**
     * Count lines and characters in a file
     */
    countFileStats(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            const totalLines = lines.length;
            const blankLines = lines.filter(line => line.trim() === '').length;
            const codeLines = totalLines - blankLines;
            const characters = content.length;
            const charactersNoWhitespace = content.replace(/\s/g, '').length;

            return {
                totalLines,
                codeLines,
                blankLines,
                characters,
                charactersNoWhitespace
            };
        } catch (error) {
            // File read error (permissions, encoding, etc.)
            return null;
        }
    }

    /**
     * Check if file is an index/page file
     */
    isPageFile(filePath) {
        // If pagesDir is specified, file must be inside it
        if (this.pagesDir) {
            const absolutePath = path.resolve(filePath);
            if (!absolutePath.startsWith(this.pagesDir)) {
                return false;
            }
        }

        const basename = path.basename(filePath).toLowerCase();
        const pagePatterns = [
            'index.html', 'index.htm', 'index.php', 'index.jsx', 'index.tsx',
            'page.jsx', 'page.tsx', 'page.js', 'page.ts',
            'default.html', 'default.htm', 'default.aspx',
            'home.html', 'home.htm'
        ];
        return pagePatterns.some(pattern => basename === pattern || basename.startsWith('page.'));
    }

    /**
     * Build glob patterns for file discovery
     */
    buildGlobPatterns() {
        const patterns = [];

        if (this.extensions) {
            // Specific extensions requested
            for (const ext of this.extensions) {
                const extClean = ext.startsWith('.') ? ext : `.${ext}`;
                patterns.push(`**/*${extClean}`);
            }
        } else {
            // All files
            patterns.push('**/*');
        }

        return patterns;
    }

    /**
     * Build ignore patterns
     */
    buildIgnorePatterns() {
        const ignores = [];

        for (const dir of this.excludeDirs) {
            ignores.push(`**/${dir}/**`);
            ignores.push(`${dir}/**`);
        }

        // Always ignore common lock files for line counting purposes
        ignores.push('**/package-lock.json');
        ignores.push('**/yarn.lock');
        ignores.push('**/pnpm-lock.yaml');
        ignores.push('**/composer.lock');
        ignores.push('**/Gemfile.lock');
        ignores.push('**/poetry.lock');
        ignores.push('**/Cargo.lock');

        return ignores;
    }

    /**
     * Run full analysis
     */
    async analyze() {
        const startTime = Date.now();

        const patterns = this.buildGlobPatterns();
        const ignores = this.buildIgnorePatterns();

        // Find all files
        const files = await fg(patterns, {
            cwd: this.rootDir,
            absolute: true,
            onlyFiles: true,
            dot: this.includeHidden,
            ignore: ignores
        });

        // Initialize stats
        const stats = {
            // Counts
            totalFiles: 0,
            textFiles: 0,
            binaryFiles: 0,

            // Line stats
            totalLines: 0,
            codeLines: 0,
            blankLines: 0,

            // Character stats
            characters: 0,
            charactersNoWhitespace: 0,

            // Asset counts
            assets: {
                total: 0,
                images: 0,
                videos: 0,
                audio: 0,
                fonts: 0,
                documents: 0
            },

            // Pages
            pages: 0,
            pageFiles: [],

            // Language breakdown
            languages: {},

            // Size
            totalSize: 0,

            // Metadata
            analyzedAt: new Date().toISOString(),
            directory: this.rootDir,
            fileList: []
        };

        // Process each file
        for (const filePath of files) {
            const relativePath = path.relative(this.rootDir, filePath);
            stats.totalFiles++;

            try {
                const fileStat = fs.statSync(filePath);
                stats.totalSize += fileStat.size;
            } catch (e) {
                // Skip if can't stat
                continue;
            }

            // Check if it's a binary/asset
            if (this.isBinary(filePath)) {
                stats.binaryFiles++;

                const assetType = this.getAssetType(filePath);
                if (assetType) {
                    stats.assets.total++;
                    stats.assets[assetType]++;
                }

                continue;
            }

            // It's a text file - count lines
            stats.textFiles++;

            const fileStats = this.countFileStats(filePath);
            if (fileStats) {
                stats.totalLines += fileStats.totalLines;
                stats.codeLines += fileStats.codeLines;
                stats.blankLines += fileStats.blankLines;
                stats.characters += fileStats.characters;
                stats.charactersNoWhitespace += fileStats.charactersNoWhitespace;

                // Track by language
                const language = this.getLanguage(filePath);
                if (language) {
                    if (!stats.languages[language]) {
                        stats.languages[language] = {
                            files: 0,
                            lines: 0,
                            codeLines: 0,
                            characters: 0
                        };
                    }
                    stats.languages[language].files++;
                    stats.languages[language].lines += fileStats.totalLines;
                    stats.languages[language].codeLines += fileStats.codeLines;
                    stats.languages[language].characters += fileStats.characters;
                }

                // Check if it's a page
                if (this.isPageFile(filePath)) {
                    stats.pages++;
                    stats.pageFiles.push(relativePath);
                }

                stats.fileList.push({
                    path: relativePath,
                    lines: fileStats.totalLines,
                    characters: fileStats.characters,
                    language
                });
            }
        }

        // Sort languages by lines
        stats.languagesSorted = Object.entries(stats.languages)
            .sort((a, b) => b[1].lines - a[1].lines)
            .map(([name, data]) => ({ name, ...data }));

        // Calculate percentages
        for (const lang of stats.languagesSorted) {
            lang.percentage = stats.totalLines > 0
                ? ((lang.lines / stats.totalLines) * 100).toFixed(1)
                : 0;
        }

        stats.analysisTime = Date.now() - startTime;

        return stats;
    }
}

module.exports = StatsEngine;
