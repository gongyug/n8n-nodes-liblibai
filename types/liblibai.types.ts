// LiblibAI API 相关类型定义
export interface ILiblibAICredentials {
	accessKey: string;
	secretKey: string;
	baseUrl: string;
}

// 生图参数接口
export interface GenerateParams {
	prompt: string;
	aspectRatio?: 'square' | 'portrait' | 'landscape';
	imageSize?: {
		width: number;
		height: number;
	};
	imgCount?: number;
	steps?: number;
	sourceImage?: string; // 图生图源图片URL
	controlnet?: {
		controlType: 'line' | 'depth' | 'pose' | 'IPAdapter' | 'subject';
		controlImage: string;
	};
}

// 文生图请求参数
export interface Text2ImgParams {
	templateUuid: string;
	generateParams: GenerateParams;
}

// 图生图请求参数
export interface Img2ImgParams {
	templateUuid: string; // 经测试验证：API使用templateUuid（驼峰式）
	generateParams: GenerateParams & {
		sourceImage: string; // 图生图必需源图片
	};
}

// 生图任务响应
export interface GenerateResponse {
	code: number;
	msg: string;
	data: {
		generateUuid: string;
	};
}

// 状态查询响应
export interface StatusResponse {
	code: number;
	msg: string;
	data: {
		generateUuid: string;
		generateStatus: GenerateStatus;
		percentCompleted: number;
		generateMsg: string;
		pointsCost: number;
		accountBalance: number;
		images: GeneratedImage[];
	};
}

// 生成的图片信息
export interface GeneratedImage {
	imageUrl: string;
	seed: number;
	auditStatus: AuditStatus;
}

// 生图状态枚举
export enum GenerateStatus {
	QUEUED = 1,      // 队列中
	PROCESSING = 2,  // 进行中
	COMPLETED = 5,   // 完成
	FAILED = 6,      // 失败
}

// 审核状态枚举
export enum AuditStatus {
	PENDING = 1,     // 审核中
	APPROVED = 3,    // 审核通过
	REJECTED = 4,    // 审核拒绝
}

// 模板UUID枚举
export enum TemplateUuid {
	STAR3_TEXT2IMG = '5d7e67009b344550bc1aa6ccbfa1d7f4', // 星流Star-3 Alpha文生图
	STAR3_IMG2IMG = '07e00af4fc464c7ab55ff906f8acf1b7',  // 星流Star-3 Alpha图生图
}

// 操作类型枚举
export enum OperationType {
	TEXT_TO_IMAGE = 'text2img',
	IMAGE_TO_IMAGE = 'img2img',
	CHECK_STATUS = 'checkStatus',
}

// 签名参数接口
export interface SignatureParams {
	timestamp: string;
	signatureNonce: string;
	signature: string;
}

// LiblibAI 错误类
export class LiblibAIError extends Error {
	constructor(
		message: string,
		public code?: string,
		public statusCode?: number,
		public details?: any,
	) {
		super(message);
		this.name = 'LiblibAIError';
	}
}