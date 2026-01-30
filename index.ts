import { exit } from "process";
import { Buffer } from "buffer";
import chalk from 'chalk';
import { say } from 'cfonts';
import async from 'async';
import ProgressBar from 'progress';

// --- 常量配置 ---
const FOFA_SEARCH_PATH = "/api/v1/search/all";
const EXPORT_PATH = "/api/accounts/export";
const REQUEST_TIMEOUT = 5000;
const CONCURRENCY_LIMIT = parseInt(process.env.CONCURRENCY_LIMIT || '10', 10);
const PROGRESS_BAR_WIDTH = 20;

// --- Fofa API 配置 ---
const key = process.env.FOFA_KEY;
const fields = "link";
const size = parseInt(process.env.FOFA_SIZE || '100', 10);

// --- 配置验证 ---
function validateConfig() {
    if (!key) {
        console.error(chalk.red("错误：请配置环境变量 FOFA_KEY。"));
        console.log("您可以从 https://fofa.info/userInfo 获取您的key");
        exit(1);
    }

    if (size < 1) {
        console.error(chalk.red("错误：FOFA_SIZE 必须大于 0。"));
        exit(1);
    }
}

validateConfig();

// --- 类型定义 ---
interface FofaResponse {
    error?: boolean;
    errmsg?: string;
    results?: string[];
}

interface AccountInfo {
    email: string;
    refresh_token: string;
}

// --- 日志工具 ---
const logger = {
    info: (message: string) => console.log(chalk.magenta(message)),
    success: (message: string) => console.log(chalk.green(message)),
    error: (message: string) => console.error(chalk.red(message)),
    warning: (message: string) => console.log(chalk.yellow(message)),
    cyan: (message: string) => console.log(chalk.cyan(message))
};

/**
 * 查询 Fofa API
 */
function queryFofaApi(queryString: string): Promise<string[]> {
    // logger.info(`正在查询 FOFA: ${queryString}`);

    const queryBase64 = Buffer.from(queryString).toString("base64");
    const fofaUrl = `https://fofa.info${FOFA_SEARCH_PATH}?key=${key}&qbase64=${queryBase64}&fields=${fields}&size=${size}`;
    return fetch(fofaUrl, { tls: { rejectUnauthorized: false } })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Fofa API 请求失败，状态码: ${response.status}`);
            }
            return response.json() as Promise<FofaResponse>;
        })
        .then(fofaData => {
            if (fofaData.error) {
                throw new Error(`Fofa API 错误: ${fofaData.errmsg}`);
            }

            if (!fofaData.results || fofaData.results.length === 0) {
                return [];
            }

            return fofaData.results;
        })
        .catch((error: any) => {
            logger.error(`查询失败: ${error.message}`);
            throw error;
        });
}

/**
 * 从单个链接获取账号信息
 */
function fetchAccountsFromLink(link: string): Promise<AccountInfo[]> {
    const url = `${link}${EXPORT_PATH}`;

    return fetch(url, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
        tls: { rejectUnauthorized: false }
    })
        .then(response => {
            if (!response.ok) {
                return [];
            }
            return response.json() as Promise<AccountInfo[]>;
        })
        .catch(() => {
            return [];
        });
}

/**
 * 从所有链接获取账号信息（使用并发控制）
 */
function fetchAllAccounts(links: string[]): Promise<AccountInfo[]> {
    logger.info(`\n正在从 ${links.length} 个链接获取账号信息... (并发数: ${CONCURRENCY_LIMIT})`);

    const progressBar = new ProgressBar(chalk.blueBright('  fetching [:bar] :current/:total :percent'), {
        complete: '=',
        incomplete: ' ',
        width: PROGRESS_BAR_WIDTH,
        total: links.length
    });

    return new Promise((resolve, reject) => {
        async.mapLimit<string, AccountInfo[]>(
            links,
            CONCURRENCY_LIMIT,
            (link, callback) => {
                fetchAccountsFromLink(link)
                    .then(accounts => {
                        progressBar.tick();
                        callback(null, accounts);
                    })
                    .catch(() => {
                        progressBar.tick();
                        callback(null, []); // 失败时返回空数组，不中断整体流程
                    });
            },
            (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    const allAccounts = (results || []).filter(Boolean).flat();
                    logger.info(`\n获取完成，共找到 ${allAccounts.length} 个账号`);
                    resolve(allAccounts as AccountInfo[]);
                }
            }
        );
    });
}

/**
 * 报告结果
 */
function reportResults(links: string[], accounts: AccountInfo[]) {
    logger.info("\n========================================");

    if (links.length === 0) {
        logger.warning("未找到任何 Antigravity 链接");
        return;
    }

    logger.success(`找到 ${links.length} 个 Antigravity 链接`);

    if (accounts.length === 0) {
        logger.warning("\n未找到任何账号信息");
    } else {
        logger.success(`\n共获取到 ${accounts.length} 个账号:\n`);
        accounts.forEach((account, index) => {
            console.log(chalk.cyan(`  ${index + 1}. ${account.email}`));
            console.log(chalk.gray(`     Token: ${account.refresh_token}`));
        });
    }

    logger.info("\n========================================");
}

/**
 * 保存账号信息到文件
 */
function saveAccountsToFile(accounts: AccountInfo[]): Promise<void> {
    const filePath = './token.json';
    const content = JSON.stringify(accounts, null, 2);

    return Bun.write(filePath, content)
        .then(() => {
            logger.success(`\n账号信息已保存到: ${filePath}`);
        })
        .catch((error: any) => {
            logger.error(`\n保存文件失败: ${error.message}`);
            throw error;
        });
}

// --- 主函数 ---
function main() {
    say('Antigravity Key', {
        font: 'block',
        align: 'left',
        gradient: ['#ff6b6b', '#4ecdc4'],
        independentGradient: true,
        env: 'node'
    });

    const searchQuery = 'title="Antigravity Console"';
    queryFofaApi(searchQuery)
        .then(links => {
            if (links.length === 0) {
                reportResults([], []);
                return;
            }
            return fetchAllAccounts(links)
                .then(accounts => {
                    reportResults(links, accounts);
                    if (accounts.length > 0) {
                        return saveAccountsToFile(accounts);
                    }
                });
        })
        .catch((error: any) => {
            logger.error(`\n处理过程中发生错误: ${error.message}`);
            exit(1);
        });
}

main();
