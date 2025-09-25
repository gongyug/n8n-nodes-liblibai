import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { SignatureGenerator } from './signature';
import {
	ILiblibAICredentials,
	Text2ImgParams,
	Img2ImgParams,
	GenerateResponse,
	StatusResponse,
	LiblibAIError,
} from '../types/liblibai.types';

/**
 * LiblibAI API 客户端封装类
 * 处理所有与 LiblibAI API 的通信，包括签名认证
 */
export class LiblibAIClient {
	private client: AxiosInstance;
	private credentials: ILiblibAICredentials;

	constructor(credentials: ILiblibAICredentials) {
		this.credentials = credentials;

		// 创建 axios 实例
		this.client = axios.create({
			baseURL: credentials.baseUrl,
			timeout: 30000, // 30秒超时
			headers: {
				'Content-Type': 'application/json',
				'User-Agent': 'n8n-liblibai-plugin/1.0.0',
			},
		});

		// 添加请求拦截器，自动生成签名
		this.client.interceptors.request.use(
			this.addSignatureToRequest.bind(this),
			(error) => Promise.reject(error),
		);

		// 添加响应拦截器，统一处理错误
		this.client.interceptors.response.use(
			(response) => response,
			this.handleResponseError.bind(this),
		);
	}

	/**
	 * 文生图接口
	 * @param params 文生图参数
	 * @returns 生图任务响应
	 */
	async text2img(params: Text2ImgParams): Promise<GenerateResponse> {
		try {
			const response = await this.client.post<GenerateResponse>(
				'/api/generate/webui/text2img/ultra',
				params,
			);
			return response.data;
		} catch (error) {
			throw this.createLiblibAIError('文生图请求失败', error);
		}
	}

	/**
	 * 图生图接口
	 * @param params 图生图参数
	 * @returns 生图任务响应
	 */
	async img2img(params: Img2ImgParams): Promise<GenerateResponse> {
		try {
			const response = await this.client.post<GenerateResponse>(
				'/api/generate/webui/img2img/ultra',
				params,
			);
			return response.data;
		} catch (error) {
			throw this.createLiblibAIError('图生图请求失败', error);
		}
	}

	/**
	 * 查询生图状态
	 * @param generateUuid 生图任务UUID
	 * @returns 状态查询响应
	 */
	async checkStatus(generateUuid: string): Promise<StatusResponse> {
		try {
			const response = await this.client.post<StatusResponse>('/api/generate/webui/status', {
				generateUuid,
			});
			return response.data;
		} catch (error) {
			throw this.createLiblibAIError('状态查询失败', error);
		}
	}

	/**
	 * 下载图片为 Buffer
	 * @param imageUrl 图片URL
	 * @returns 图片数据Buffer
	 */
	async downloadImage(imageUrl: string): Promise<Buffer> {
		try {
			const response = await axios.get(imageUrl, {
				responseType: 'arraybuffer',
				timeout: 60000, // 图片下载延长超时时间
			});
			return Buffer.from(response.data);
		} catch (error) {
			throw this.createLiblibAIError('图片下载失败', error);
		}
	}

	/**
	 * 测试API连接性
	 * @returns 是否连接成功
	 */
	async testConnection(): Promise<boolean> {
		try {
			// 使用一个测试UUID查询状态来验证连接
			await this.checkStatus('test-connection-uuid');
			return true;
		} catch (error) {
			// 如果返回的是正常的业务错误（如UUID不存在），说明连接正常
			if (error instanceof LiblibAIError && error.statusCode === 400) {
				return true;
			}
			return false;
		}
	}

	/**
	 * 请求拦截器：为请求添加签名认证
	 * @param config 请求配置
	 * @returns 修改后的请求配置
	 */
	private addSignatureToRequest(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
		const uri = config.url || '';
		const { timestamp, signatureNonce, signature } = SignatureGenerator.generateSignature(
			uri,
			this.credentials.secretKey,
		);

		// 添加认证参数到查询字符串
		config.params = {
			...config.params,
			AccessKey: this.credentials.accessKey,
			Timestamp: timestamp,
			SignatureNonce: signatureNonce,
			Signature: signature,
		};

		return config;
	}

	/**
	 * 响应拦截器：统一处理API错误
	 * @param error 错误对象
	 * @returns 拒绝的Promise
	 */
	private handleResponseError(error: any): Promise<never> {
		if (error.response) {
			const { status, data } = error.response;
			const message = data?.msg || data?.message || `HTTP ${status} 错误`;
			throw new LiblibAIError(message, data?.code?.toString(), status, data);
		} else if (error.request) {
			throw new LiblibAIError('网络请求失败，请检查网络连接', 'NETWORK_ERROR');
		} else {
			throw new LiblibAIError(error.message || '未知错误', 'UNKNOWN_ERROR');
		}
	}

	/**
	 * 创建标准化的 LiblibAI 错误
	 * @param message 错误消息
	 * @param originalError 原始错误
	 * @returns LiblibAI错误实例
	 */
	private createLiblibAIError(message: string, originalError: any): LiblibAIError {
		if (originalError instanceof LiblibAIError) {
			return originalError;
		}

		if (originalError?.response) {
			const { status, data } = originalError.response;
			return new LiblibAIError(
				data?.msg || message,
				data?.code?.toString(),
				status,
				data,
			);
		}

		return new LiblibAIError(message, 'UNKNOWN_ERROR', undefined, originalError);
	}
}