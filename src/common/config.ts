import { exit } from "process";
import chalk from "chalk";

export const FOFA_KEY = process.env.FOFA_KEY;
export const FOFA_SIZE = parseInt(process.env.FOFA_SIZE || "100", 10);
export const CONCURRENCY_LIMIT = parseInt(process.env.CONCURRENCY_LIMIT || "10", 10);
export const REQUEST_TIMEOUT = 5000;
export const PROGRESS_BAR_WIDTH = 20;

export function validateConfig() {
    if (!FOFA_KEY) {
        console.error(chalk.red("错误：请配置环境变量 FOFA_KEY。"));
        console.log("您可以从 https://fofa.info/userInfo 获取您的key");
        exit(1);
    }
    if (FOFA_SIZE < 1) {
        console.error(chalk.red("错误：FOFA_SIZE 必须大于 0。"));
        exit(1);
    }
}
