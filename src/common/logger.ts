import chalk from "chalk";

export const logger = {
    info: (msg: string) => console.log(chalk.magenta(msg)),
    success: (msg: string) => console.log(chalk.green(msg)),
    error: (msg: string) => console.error(chalk.red(msg)),
    warning: (msg: string) => console.log(chalk.yellow(msg)),
    cyan: (msg: string) => console.log(chalk.cyan(msg)),
};
