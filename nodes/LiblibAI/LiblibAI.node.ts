import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodePropertyTypes,
	NodeOperationError,
	IBinaryKeyData,
} from 'n8n-workflow';

import { LiblibAIClient } from '../../utils/api-client';
import { TaskPoller } from '../../utils/task-poller';
import {
	ILiblibAICredentials,
	OperationType,
	TemplateUuid,
	GenerateParams,
	AuditStatus,
	GenerateStatus,
	LiblibAIError,
} from '../../types/liblibai.types';

export class LiblibAI implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'LiblibAI',
		name: 'liblibAI',
		icon: 'file:liblibai.png',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: '基于星流Star-3 Alpha模型的AI图片生成服务',
		defaults: {
			name: 'LiblibAI',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'liblibAIApi',
				required: true,
			},
		],
		properties: [
			// 操作类型选择
			{
				displayName: '操作类型',
				name: 'operation',
				type: 'options' as NodePropertyTypes,
				noDataExpression: true,
				options: [
					{
						name: '文生图',
						value: OperationType.TEXT_TO_IMAGE,
						description: '根据文字提示生成图片',
						action: '使用文字提示生成图片',
					},
					{
						name: '图生图',
						value: OperationType.IMAGE_TO_IMAGE,
						description: '基于参考图片生成新图片',
						action: '使用参考图片生成新图片',
					},
					{
						name: '查询状态',
						value: OperationType.CHECK_STATUS,
						description: '查询生图任务的执行状态',
						action: '查询任务状态',
					},
				],
				default: OperationType.TEXT_TO_IMAGE,
				required: true,
			},

			// ===== 通用参数 =====
			{
				displayName: '提示词',
				name: 'prompt',
				type: 'string' as NodePropertyTypes,
				default: '',
				placeholder: '例如: 1 girl, masterpiece, best quality, beautiful and aesthetic',
				description: '生图的正向提示词，纯英文文本，不超过2000字符',
				displayOptions: {
					show: {
						operation: [OperationType.TEXT_TO_IMAGE, OperationType.IMAGE_TO_IMAGE],
					},
				},
				required: true,
			},

			{
				displayName: '生成数量',
				name: 'imgCount',
				type: 'number' as NodePropertyTypes,
				default: 1,
				description: '单次生成的图片数量',
				typeOptions: {
					minValue: 1,
					maxValue: 4,
				},
				displayOptions: {
					show: {
						operation: [OperationType.TEXT_TO_IMAGE, OperationType.IMAGE_TO_IMAGE],
					},
				},
			},

			// ===== 尺寸配置 =====
			{
				displayName: '尺寸配置方式',
				name: 'sizeMode',
				type: 'options' as NodePropertyTypes,
				options: [
					{
						name: '预设比例',
						value: 'aspectRatio',
						description: '使用预设的宽高比',
					},
					{
						name: '自定义尺寸',
						value: 'custom',
						description: '指定具体的宽度和高度',
					},
				],
				default: 'aspectRatio',
				displayOptions: {
					show: {
						operation: [OperationType.TEXT_TO_IMAGE, OperationType.IMAGE_TO_IMAGE],
					},
				},
			},

			{
				displayName: '图片比例',
				name: 'aspectRatio',
				type: 'options' as NodePropertyTypes,
				options: [
					{
						name: '方形 (1:1, 1024×1024)',
						value: 'square',
						description: '适合头像、logo等',
					},
					{
						name: '肖像 (3:4, 768×1024)',
						value: 'portrait',
						description: '适合人物肖像',
					},
					{
						name: '横屏 (16:9, 1280×720)',
						value: 'landscape',
						description: '适合风景、影视画幅',
					},
				],
				default: 'portrait',
				displayOptions: {
					show: {
						operation: [OperationType.TEXT_TO_IMAGE, OperationType.IMAGE_TO_IMAGE],
						sizeMode: ['aspectRatio'],
					},
				},
			},

			{
				displayName: '图片宽度',
				name: 'imageWidth',
				type: 'number' as NodePropertyTypes,
				default: 768,
				typeOptions: {
					minValue: 512,
					maxValue: 2048,
				},
				displayOptions: {
					show: {
						operation: [OperationType.TEXT_TO_IMAGE, OperationType.IMAGE_TO_IMAGE],
						sizeMode: ['custom'],
					},
				},
			},

			{
				displayName: '图片高度',
				name: 'imageHeight',
				type: 'number' as NodePropertyTypes,
				default: 1024,
				typeOptions: {
					minValue: 512,
					maxValue: 2048,
				},
				displayOptions: {
					show: {
						operation: [OperationType.TEXT_TO_IMAGE, OperationType.IMAGE_TO_IMAGE],
						sizeMode: ['custom'],
					},
				},
			},

			// ===== 图生图特有参数 =====
			{
				displayName: '参考图片URL',
				name: 'sourceImage',
				type: 'string' as NodePropertyTypes,
				default: '',
				placeholder: 'https://example.com/image.jpg',
				description: '作为参考的源图片URL地址',
				displayOptions: {
					show: {
						operation: [OperationType.IMAGE_TO_IMAGE],
					},
				},
				required: true,
			},

			// ===== 高级参数 =====
			{
				displayName: '高级设置',
				name: 'advancedSettings',
				type: 'collection' as NodePropertyTypes,
				placeholder: '添加高级设置',
				default: {},
				displayOptions: {
					show: {
						operation: [OperationType.TEXT_TO_IMAGE, OperationType.IMAGE_TO_IMAGE],
					},
				},
				options: [
					{
						displayName: '采样步数',
						name: 'steps',
						type: 'number' as NodePropertyTypes,
						default: 30,
						description: '生图的采样步数，建议30，数值越高质量越好但耗时更长',
						typeOptions: {
							minValue: 10,
							maxValue: 100,
						},
					},
					{
						displayName: '启用ControlNet',
						name: 'enableControlNet',
						type: 'boolean' as NodePropertyTypes,
						default: false,
						description: '是否启用构图控制功能',
					},
					{
						displayName: 'ControlNet类型',
						name: 'controlType',
						type: 'options' as NodePropertyTypes,
						options: [
							{
								name: '线稿轮廓 (Line)',
								value: 'line',
								description: '保持图片的线条结构',
							},
							{
								name: '空间关系 (Depth)',
								value: 'depth',
								description: '保持图片的深度和空间布局',
							},
							{
								name: '人物姿态 (Pose)',
								value: 'pose',
								description: '保持人物的姿势和动作',
							},
							{
								name: '风格迁移 (IPAdapter)',
								value: 'IPAdapter',
								description: '迁移参考图片的风格',
							},
							{
								name: '主体参考 (Subject)',
								value: 'subject',
								description: '参考图片中的主体对象',
							},
						],
						default: 'depth',
						displayOptions: {
							show: {
								enableControlNet: [true],
							},
						},
					},
					{
						displayName: 'ControlNet参考图',
						name: 'controlImage',
						type: 'string' as NodePropertyTypes,
						default: '',
						placeholder: 'https://example.com/control-image.jpg',
						description: 'ControlNet使用的参考图片URL',
						displayOptions: {
							show: {
								enableControlNet: [true],
							},
						},
						required: true,
					},
				],
			},

			// ===== 状态查询参数 =====
			{
				displayName: '任务UUID',
				name: 'generateUuid',
				type: 'string' as NodePropertyTypes,
				default: '',
				placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
				description: '要查询的生图任务UUID',
				displayOptions: {
					show: {
						operation: [OperationType.CHECK_STATUS],
					},
				},
				required: true,
			},

			// ===== 异步执行设置 =====
			{
				displayName: '异步执行设置',
				name: 'asyncSettings',
				type: 'collection' as NodePropertyTypes,
				placeholder: '添加异步执行设置',
				default: {},
				displayOptions: {
					show: {
						operation: [OperationType.TEXT_TO_IMAGE, OperationType.IMAGE_TO_IMAGE],
					},
				},
				options: [
					{
						displayName: '等待任务完成',
						name: 'waitForCompletion',
						type: 'boolean' as NodePropertyTypes,
						default: true,
						description: '是否等待生图任务完成后再返回结果。关闭时只返回任务UUID',
					},
					{
						displayName: '最大等待时间（秒）',
						name: 'maxWaitTime',
						type: 'number' as NodePropertyTypes,
						default: 300,
						description: '等待任务完成的最大时间，超时后抛出错误',
						typeOptions: {
							minValue: 30,
							maxValue: 1800, // 30分钟
						},
						displayOptions: {
							show: {
								waitForCompletion: [true],
							},
						},
					},
					{
						displayName: '轮询间隔（秒）',
						name: 'pollInterval',
						type: 'number' as NodePropertyTypes,
						default: 5,
						description: '检查任务状态的间隔时间',
						typeOptions: {
							minValue: 1,
							maxValue: 60,
						},
						displayOptions: {
							show: {
								waitForCompletion: [true],
							},
						},
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// 获取认证凭据
		const credentials = (await this.getCredentials('liblibAIApi')) as ILiblibAICredentials;

		// 创建API客户端
		const client = new LiblibAIClient(credentials);

		// 处理每个输入项
		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as OperationType;

				let result: INodeExecutionData;

				switch (operation) {
					case OperationType.TEXT_TO_IMAGE:
						result = await LiblibAI.handleText2Img(this, client, i);
						break;

					case OperationType.IMAGE_TO_IMAGE:
						result = await LiblibAI.handleImg2Img(this, client, i);
						break;

					case OperationType.CHECK_STATUS:
						result = await LiblibAI.handleCheckStatus(this, client, i);
						break;

					default:
						throw new NodeOperationError(
							this.getNode(),
							`未支持的操作类型: ${operation}`,
							{ itemIndex: i },
						);
				}

				returnData.push(result);
			} catch (error) {
				// 错误处理：根据节点配置决定是继续还是抛出错误
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							success: false,
							error: error instanceof Error ? error.message : '未知错误',
							details: error instanceof LiblibAIError ? error.details : undefined,
						},
						binary: {},
						pairedItem: { item: i },
					});
				} else {
					// 包装为 n8n 错误格式
					if (error instanceof LiblibAIError) {
						throw new NodeOperationError(this.getNode(), error.message, {
							itemIndex: i,
							description: error.details,
						});
					} else {
						throw error;
					}
				}
			}
		}

		return [returnData];
	}

	/**
	 * 处理文生图请求
	 */
	private static async handleText2Img(
		context: IExecuteFunctions,
		client: LiblibAIClient,
		itemIndex: number,
	): Promise<INodeExecutionData> {
		// 验证参数
		LiblibAI.validateText2ImgParameters(context, itemIndex);

		// 构建请求参数
		const generateParams = LiblibAI.buildGenerateParams(context, itemIndex);
		const text2imgParams = {
			templateUuid: TemplateUuid.STAR3_TEXT2IMG,
			generateParams,
		};

		// 发起生图请求
		const generateResult = await client.text2img(text2imgParams);

		if (generateResult.code !== 0) {
			throw new LiblibAIError(`文生图请求失败: ${generateResult.msg}`, generateResult.code.toString());
		}

		// 处理异步结果
		return await LiblibAI.handleAsyncResult(
			context,
			client,
			generateResult.data.generateUuid,
			itemIndex,
			'text2img',
		);
	}

	/**
	 * 处理图生图请求
	 */
	private static async handleImg2Img(
		context: IExecuteFunctions,
		client: LiblibAIClient,
		itemIndex: number,
	): Promise<INodeExecutionData> {
		// 验证参数
		LiblibAI.validateImg2ImgParameters(context, itemIndex);

		// 构建请求参数
		const generateParams = {
			...LiblibAI.buildGenerateParams(context, itemIndex),
			sourceImage: context.getNodeParameter('sourceImage', itemIndex) as string,
		};

		const img2imgParams = {
			templateUUID: TemplateUuid.STAR3_IMG2IMG, // 注意：图生图使用UUID而非Uuid
			generateParams,
		};

		// 发起图生图请求
		const generateResult = await client.img2img(img2imgParams);

		if (generateResult.code !== 0) {
			throw new LiblibAIError(`图生图请求失败: ${generateResult.msg}`, generateResult.code.toString());
		}

		// 处理异步结果
		return await LiblibAI.handleAsyncResult(
			context,
			client,
			generateResult.data.generateUuid,
			itemIndex,
			'img2img',
		);
	}

	/**
	 * 处理状态查询请求
	 */
	private static async handleCheckStatus(
		context: IExecuteFunctions,
		client: LiblibAIClient,
		itemIndex: number,
	): Promise<INodeExecutionData> {
		const generateUuid = context.getNodeParameter('generateUuid', itemIndex) as string;

		if (!generateUuid || generateUuid.trim().length === 0) {
			throw new NodeOperationError(context.getNode(), '任务UUID不能为空', { itemIndex });
		}

		// 查询状态
		const statusResult = await client.checkStatus(generateUuid.trim());

		if (statusResult.code !== 0) {
			throw new LiblibAIError(`状态查询失败: ${statusResult.msg}`, statusResult.code.toString());
		}

		// 如果任务已完成且有图片，下载图片
		let binaryData: IBinaryKeyData = {};
		if (
			statusResult.data.generateStatus === GenerateStatus.COMPLETED &&
			statusResult.data.images?.length > 0
		) {
			binaryData = await LiblibAI.downloadImages(client, statusResult.data.images);
		}

		return {
			json: {
				success: true,
				operation: 'checkStatus',
				...statusResult.data,
			},
			binary: binaryData,
			pairedItem: { item: itemIndex },
		};
	}

	/**
	 * 处理异步生图结果
	 */
	private static async handleAsyncResult(
		context: IExecuteFunctions,
		client: LiblibAIClient,
		generateUuid: string,
		itemIndex: number,
		operation: string,
	): Promise<INodeExecutionData> {
		const asyncSettings = context.getNodeParameter('asyncSettings', itemIndex, {}) as any;
		const waitForCompletion = asyncSettings.waitForCompletion !== false; // 默认为true

		if (!waitForCompletion) {
			// 不等待完成，直接返回任务UUID
			return {
				json: {
					success: true,
					operation,
					generateUuid,
					status: 'submitted',
					message: '任务已提交，请使用UUID查询状态',
				},
				binary: {},
				pairedItem: { item: itemIndex },
			};
		}

		// 等待任务完成
		const maxWaitTime = asyncSettings.maxWaitTime || 300;
		const pollInterval = asyncSettings.pollInterval || 5;

		const poller = new TaskPoller(client, maxWaitTime, pollInterval);

		// 轮询直到完成
		const finalResult = await poller.pollUntilComplete(generateUuid, (statusResponse) => {
			// 可以在这里添加进度回调逻辑
			const statusMsg = TaskPoller.getStatusDescription(statusResponse.data.generateStatus);
			console.log(`任务 ${generateUuid} 状态: ${statusMsg}`);
		});

		// 下载生成的图片
		let binaryData: IBinaryKeyData = {};
		if (finalResult.data.images?.length > 0) {
			binaryData = await LiblibAI.downloadImages(client, finalResult.data.images);
		}

		return {
			json: {
				success: true,
				operation,
				...finalResult.data,
			},
			binary: binaryData,
			pairedItem: { item: itemIndex },
		};
	}

	/**
	 * 构建生成参数
	 */
	private static buildGenerateParams(context: IExecuteFunctions, itemIndex: number): GenerateParams {
		const prompt = context.getNodeParameter('prompt', itemIndex) as string;
		const imgCount = context.getNodeParameter('imgCount', itemIndex, 1) as number;
		const sizeMode = context.getNodeParameter('sizeMode', itemIndex, 'aspectRatio') as string;
		const advancedSettings = context.getNodeParameter('advancedSettings', itemIndex, {}) as any;

		const params: GenerateParams = {
			prompt: prompt.trim(),
			imgCount,
		};

		// 设置图片尺寸
		if (sizeMode === 'aspectRatio') {
			params.aspectRatio = context.getNodeParameter('aspectRatio', itemIndex, 'portrait') as any;
		} else {
			params.imageSize = {
				width: context.getNodeParameter('imageWidth', itemIndex, 768) as number,
				height: context.getNodeParameter('imageHeight', itemIndex, 1024) as number,
			};
		}

		// 高级设置
		if (advancedSettings.steps) {
			params.steps = advancedSettings.steps;
		}

		// ControlNet设置
		if (advancedSettings.enableControlNet && advancedSettings.controlImage) {
			params.controlnet = {
				controlType: advancedSettings.controlType || 'depth',
				controlImage: advancedSettings.controlImage,
			};
		}

		return params;
	}

	/**
	 * 下载图片为二进制数据
	 */
	private static async downloadImages(client: LiblibAIClient, images: any[]): Promise<IBinaryKeyData> {
		const binaryData: IBinaryKeyData = {};

		for (let i = 0; i < images.length; i++) {
			const image = images[i];

			// 只下载审核通过的图片
			if (image.auditStatus === AuditStatus.APPROVED && image.imageUrl) {
				try {
					const imageBuffer = await client.downloadImage(image.imageUrl);

					binaryData[`image_${i}`] = {
						data: imageBuffer.toString('base64'),
						mimeType: 'image/png',
						fileExtension: 'png',
						fileName: `liblibai_generated_${Date.now()}_${i}.png`,
					};
				} catch (error) {
					console.warn(`下载图片 ${i} 失败:`, (error as Error).message);
					// 继续处理其他图片，不中断整个流程
				}
			}
		}

		return binaryData;
	}

	/**
	 * 验证文生图参数
	 */
	private static validateText2ImgParameters(context: IExecuteFunctions, itemIndex: number): void {
		const prompt = context.getNodeParameter('prompt', itemIndex) as string;

		if (!prompt || prompt.trim().length === 0) {
			throw new NodeOperationError(context.getNode(), '提示词不能为空', { itemIndex });
		}

		if (prompt.length > 2000) {
			throw new NodeOperationError(context.getNode(), '提示词长度不能超过2000个字符', {
				itemIndex,
			});
		}

		// 验证自定义尺寸
		const sizeMode = context.getNodeParameter('sizeMode', itemIndex) as string;
		if (sizeMode === 'custom') {
			const width = context.getNodeParameter('imageWidth', itemIndex) as number;
			const height = context.getNodeParameter('imageHeight', itemIndex) as number;

			if (width < 512 || width > 2048 || height < 512 || height > 2048) {
				throw new NodeOperationError(context.getNode(), '图片尺寸必须在512-2048像素范围内', {
					itemIndex,
				});
			}
		}
	}

	/**
	 * 验证图生图参数
	 */
	private static validateImg2ImgParameters(context: IExecuteFunctions, itemIndex: number): void {
		// 首先验证文生图的通用参数
		LiblibAI.validateText2ImgParameters(context, itemIndex);

		// 验证源图片URL
		const sourceImage = context.getNodeParameter('sourceImage', itemIndex) as string;
		if (!sourceImage || sourceImage.trim().length === 0) {
			throw new NodeOperationError(context.getNode(), '图生图模式需要提供源图片URL', { itemIndex });
		}

		if (!LiblibAI.isValidUrl(sourceImage.trim())) {
			throw new NodeOperationError(context.getNode(), '源图片URL格式不正确', { itemIndex });
		}
	}

	/**
	 * 验证URL格式
	 */
	private static isValidUrl(url: string): boolean {
		try {
			const urlObj = new URL(url);
			return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
		} catch {
			return false;
		}
	}
}