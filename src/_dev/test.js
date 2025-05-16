import winston from 'winston';
import chalk from 'chalk';

const logger = winston.createLogger({
    level: 'info',
    transports: [
        new winston.transports.Console({
            format: winston.format.printf(info => {
                let coloredLevel;
                switch (info.level) {
                    case 'error': coloredLevel = chalk.red(info.level); break;
                    case 'warn': coloredLevel = chalk.yellow(info.level); break;
                    case 'info': coloredLevel = chalk.green(info.level); break;
                    default: coloredLevel = info.level;
                }
                return `${coloredLevel}: ${info.message}`;
            })
        }),
        new winston.transports.File({
            filename: 'app.log',
            format: winston.format.printf(info => `${info.level}: ${info.message}`) // No colors in file
        })
    ]
});

logger.info('This is an info message');
logger.warn('This is a warning message');
logger.error('This is an error message');