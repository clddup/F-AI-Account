import { exit } from "process";
import { mkdir } from "fs/promises";
import { validateConfig, queryFofa, logger, REQUEST_TIMEOUT, printBanner } from "../common";
import { concurrentProcess } from "../common/progress";

const EXPORT_PATH = "/api/accounts/export";

interface AccountInfo {
    email: string;
    refresh_token: string;
}

validateConfig();

function fetchAccountsFromLink(link: string): Promise<AccountInfo[]> {
    return fetch(`${link}${EXPORT_PATH}`, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
        tls: { rejectUnauthorized: false },
    })
        .then(res => (res.ok ? (res.json() as Promise<AccountInfo[]>) : []))
        .catch(() => []);
}

const OUTPUT_FILE = "./output/antigravity.json";

async function main() {
    printBanner("Antigravity Key");

    try {
        const links = await queryFofa('title="Antigravity Console"');
        if (links.length === 0) { logger.warning("未找到任何 Antigravity 链接"); return; }

        const results = await concurrentProcess(
            links,
            `正在从 ${links.length} 个链接获取账号信息...`,
            fetchAccountsFromLink,
            [] as AccountInfo[]
        );
        const accounts = results.flat();

        logger.info("\n========================================");
        logger.success(`  站点数: ${links.length}  |  账号数: ${accounts.length}`);
        if (accounts.length > 0) {
            await mkdir("./output", { recursive: true });
            await Bun.write(OUTPUT_FILE, JSON.stringify(accounts, null, 2));
            logger.success(`  输出文件: ${OUTPUT_FILE}`);
        }
        logger.info("========================================");
    } catch (error: any) {
        logger.error(`\n处理过程中发生错误: ${error.message}`);
        exit(1);
    }
}

main();
