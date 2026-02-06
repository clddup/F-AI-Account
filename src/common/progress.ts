import chalk from "chalk";
import ProgressBar from "progress";
import async from "async";
import { CONCURRENCY_LIMIT, PROGRESS_BAR_WIDTH } from "./config";
import { logger } from "./logger";

/**
 * 通用并发处理器：对列表中的每个元素并发执行任务，带进度条
 */
export function concurrentProcess<T, R>(
    items: T[],
    label: string,
    processor: (item: T) => Promise<R>,
    defaultValue: R
): Promise<R[]> {
    logger.info(`\n${label} (并发数: ${CONCURRENCY_LIMIT})`);

    const progressBar = new ProgressBar(chalk.blueBright('  处理中 [:bar] :current/:total :percent'), {
        complete: '=',
        incomplete: ' ',
        width: PROGRESS_BAR_WIDTH,
        total: items.length
    });

    return new Promise((resolve, reject) => {
        async.mapLimit<T, R>(
            items,
            CONCURRENCY_LIMIT,
            (item, callback) => {
                processor(item)
                    .then(result => {
                        progressBar.tick();
                        callback(null, result);
                    })
                    .catch(() => {
                        progressBar.tick();
                        callback(null, defaultValue);
                    });
            },
            (err, results) => {
                if (err) reject(err);
                else resolve((results || []).filter(Boolean) as R[]);
            }
        );
    });
}
