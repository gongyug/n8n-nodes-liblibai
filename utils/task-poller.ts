import { LiblibAIClient } from './api-client';
import { StatusResponse, GenerateStatus, LiblibAIError } from '../types/liblibai.types';

/**
 * 异步任务轮询器
 * 用于轮询 LiblibAI 生图任务的完成状态
 */
export class TaskPoller {
	private client: LiblibAIClient;
	private maxWaitTime: number; // 最大等待时间（秒）
	private pollInterval: number; // 基础轮询间隔（秒）
	private maxPollInterval: number; // 最大轮询间隔（秒）

	constructor(
		client: LiblibAIClient,
		maxWaitTime: number = 300, // 默认5分钟
		pollInterval: number = 5, // 默认5秒
		maxPollInterval: number = 30, // 最大30秒
	) {
		this.client = client;
		this.maxWaitTime = maxWaitTime;
		this.pollInterval = pollInterval;
		this.maxPollInterval = maxPollInterval;
	}

	/**
	 * 轮询任务直到完成或超时
	 * @param generateUuid 任务UUID
	 * @param onProgress 进度回调函数
	 * @returns 最终状态结果
	 */
	async pollUntilComplete(
		generateUuid: string,
		onProgress?: (status: StatusResponse) => void,
	): Promise<StatusResponse> {
		const startTime = Date.now();
		const maxEndTime = startTime + this.maxWaitTime * 1000;

		let attempt = 0;
		let lastStatus: StatusResponse | null = null;

		while (Date.now() < maxEndTime) {
			try {
				const statusResult = await this.client.checkStatus(generateUuid);
				lastStatus = statusResult;

				// 调用进度回调
				if (onProgress) {
					onProgress(statusResult);
				}

				// 检查任务状态
				switch (statusResult.data.generateStatus) {
					case GenerateStatus.COMPLETED:
						// 任务完成，返回结果
						return statusResult;

					case GenerateStatus.FAILED:
						// 任务失败，抛出错误
						throw new LiblibAIError(
							`生图任务失败: ${statusResult.data.generateMsg || '未知原因'}`,
							'GENERATION_FAILED',
							undefined,
							statusResult.data,
						);

					case GenerateStatus.QUEUED:
					case GenerateStatus.PROCESSING:
						// 任务进行中，继续轮询
						break;

					default:
						// 未知状态，记录并继续轮询
						console.warn(`未知的生图状态: ${statusResult.data.generateStatus}`);
						break;
				}

				// 计算下次轮询的延迟时间（指数退避算法）
				const delay = this.calculatePollingDelay(attempt);
				await this.sleep(delay);
				attempt++;
			} catch (error) {
				// 如果是 LiblibAI 的业务错误，直接抛出
				if (error instanceof LiblibAIError) {
					throw error;
				}

				// 网络错误等，记录并继续尝试
				console.warn(`轮询请求失败 (尝试 ${attempt + 1}):`, (error as Error).message);

				// 如果连续失败次数过多，抛出错误
				if (attempt >= 5) {
					throw new LiblibAIError(
						`轮询任务状态失败，已尝试 ${attempt + 1} 次`,
						'POLLING_FAILED',
						undefined,
						error,
					);
				}

				// 等待后重试
				await this.sleep(this.pollInterval * 1000);
				attempt++;
			}
		}

		// 超时处理
		const timeoutError = new LiblibAIError(
			`任务轮询超时，最大等待时间: ${this.maxWaitTime} 秒`,
			'POLLING_TIMEOUT',
		);

		// 如果有最后的状态，将其附加到错误详情中
		if (lastStatus) {
			timeoutError.details = {
				lastStatus: lastStatus.data,
				attempts: attempt,
				elapsedTime: Math.round((Date.now() - startTime) / 1000),
			};
		}

		throw timeoutError;
	}

	/**
	 * 轮询单次状态（不等待完成）
	 * @param generateUuid 任务UUID
	 * @returns 当前状态
	 */
	async pollOnce(generateUuid: string): Promise<StatusResponse> {
		return await this.client.checkStatus(generateUuid);
	}

	/**
	 * 批量轮询多个任务状态
	 * @param generateUuids 任务UUID数组
	 * @returns 状态结果数组
	 */
	async pollMultiple(generateUuids: string[]): Promise<StatusResponse[]> {
		const promises = generateUuids.map((uuid) => this.pollOnce(uuid));
		return await Promise.all(promises);
	}

	/**
	 * 计算轮询延迟时间（指数退避算法）
	 * @param attempt 尝试次数
	 * @returns 延迟时间（毫秒）
	 */
	private calculatePollingDelay(attempt: number): number {
		// 指数退避：基础间隔 * (1.2 ^ 尝试次数)
		const exponentialDelay = this.pollInterval * Math.pow(1.2, attempt);

		// 限制最大间隔时间
		const clampedDelay = Math.min(exponentialDelay, this.maxPollInterval);

		// 添加随机抖动，避免多个客户端同时请求
		const jitter = Math.random() * 0.1; // 10% 的抖动
		const finalDelay = clampedDelay * (1 + jitter);

		return Math.round(finalDelay * 1000); // 转换为毫秒
	}

	/**
	 * 睡眠指定毫秒数
	 * @param ms 毫秒数
	 * @returns Promise
	 */
	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * 获取状态的人类可读描述
	 * @param status 状态码
	 * @returns 状态描述
	 */
	static getStatusDescription(status: GenerateStatus): string {
		switch (status) {
			case GenerateStatus.QUEUED:
				return '任务已加入队列，等待处理...';
			case GenerateStatus.PROCESSING:
				return '正在生成图片，请耐心等待...';
			case GenerateStatus.COMPLETED:
				return '图片生成完成！';
			case GenerateStatus.FAILED:
				return '生成失败，请检查参数设置';
			default:
				return `未知状态 (${status})`;
		}
	}

	/**
	 * 检查任务是否已完成（成功或失败）
	 * @param status 状态码
	 * @returns 是否已完成
	 */
	static isTaskFinished(status: GenerateStatus): boolean {
		return status === GenerateStatus.COMPLETED || status === GenerateStatus.FAILED;
	}

	/**
	 * 检查任务是否成功完成
	 * @param status 状态码
	 * @returns 是否成功
	 */
	static isTaskSuccessful(status: GenerateStatus): boolean {
		return status === GenerateStatus.COMPLETED;
	}
}