import {
	ICredentialDataDecryptedObject,
	ICredentialType,
	INodeProperties,
	NodePropertyTypes,
} from 'n8n-workflow';

export class LiblibAIApi implements ICredentialType {
	name = 'liblibAIApi';
	displayName = 'LiblibAI API';
	documentationUrl = 'https://openapi.liblibai.cloud';
	properties: INodeProperties[] = [
		{
			displayName: 'Access Key',
			name: 'accessKey',
			type: 'string' as NodePropertyTypes,
			default: '',
			required: true,
			description: 'API访问凭证，从LiblibAI开放平台获取，长度通常在20-30位左右',
			placeholder: '例如: KIQMFXjHaobx7wqo9XvYKA',
		},
		{
			displayName: 'Secret Key',
			name: 'secretKey',
			type: 'string' as NodePropertyTypes,
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'API访问密钥，用于生成请求签名，长度通常在30位以上',
			placeholder: '例如: KppKsn7ezZxhi6lIDjbo7YyVYzanSu2d',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string' as NodePropertyTypes,
			default: 'https://openapi.liblibai.cloud',
			required: true,
			description: 'LiblibAI开放平台API服务地址',
		},
		{
			displayName: '环境配置',
			name: 'notice',
			type: 'notice' as NodePropertyTypes,
			default: '',
			displayOptions: {
				show: {},
			},
			description: `
				<h4>获取API密钥步骤：</h4>
				<ol>
					<li>访问 <a href="https://www.liblibai.com" target="_blank">LiblibAI官网</a> 注册登录</li>
					<li>前往开放平台申请API试用积分或购买API积分</li>
					<li>获取 Access Key 和 Secret Key</li>
					<li>将密钥填入上方配置项</li>
				</ol>
				<p><strong>注意：</strong>请妥善保管您的Secret Key，避免泄露给他人</p>
			`,
		},
	];

	/**
	 * 验证凭证是否有效
	 */
	async authenticate(
		credentials: ICredentialDataDecryptedObject,
		requestOptions: any,
	): Promise<any> {
		// 这里可以添加凭证验证逻辑，比如发送一个测试请求
		return requestOptions;
	}

	/**
	 * 测试凭证连接性
	 */
	test: ICredentialType['test'] = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/api/generate/webui/status',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: {
				generateUuid: 'test-connection-uuid',
			},
		},
	};
}