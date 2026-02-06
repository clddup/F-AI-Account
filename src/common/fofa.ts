import { FofaClient } from "fofa-sdk";
import { FOFA_KEY, FOFA_SIZE } from "./config";
import { logger } from "./logger";

export const fofaClient = new FofaClient({
    key: FOFA_KEY!,
    timeout: 30000,
    retries: 3,
});

export async function queryFofa(queryString: string): Promise<string[]> {
    logger.info(`正在查询 FOFA: ${queryString}`);
    try {
        const response = await fofaClient.search(queryString, {
            fields: ["link"],
            size: FOFA_SIZE,
        });
        if (!response.results || response.results.length === 0) {
            logger.warning("未找到任何结果");
            return [];
        }
        const links = response.results.map((r) => r.link as string).filter(Boolean);
        logger.success(`找到 ${links.length} 个结果`);
        return links;
    } catch (error: any) {
        logger.error(`查询失败: ${error.message}`);
        throw error;
    }
}
