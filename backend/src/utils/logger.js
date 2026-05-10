const isDev = process.env.NODE_ENV !== 'production';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

const timestamp = () => new Date().toISOString();

const logger = {
  info: (...args) => console.log(`${colors.green}[INFO]${colors.reset} ${timestamp()}`, ...args),
  warn: (...args) => console.warn(`${colors.yellow}[WARN]${colors.reset} ${timestamp()}`, ...args),
  error: (...args) => console.error(`${colors.red}[ERROR]${colors.reset} ${timestamp()}`, ...args),
  http: (...args) => isDev && console.log(`${colors.cyan}[HTTP]${colors.reset} ${timestamp()}`, ...args),
  debug: (...args) => isDev && console.log(`${colors.gray}[DEBUG]${colors.reset} ${timestamp()}`, ...args),
};

module.exports = logger;