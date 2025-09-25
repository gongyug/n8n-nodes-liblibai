import * as crypto from 'crypto';
import { SignatureParams } from '../types/liblibai.types';

/**
 * LiblibAI API 签名生成工具类
 * 实现 HMAC-SHA1 签名算法
 */
export class SignatureGenerator {
	/**
	 * 生成 HMAC-SHA1 签名
	 * @param uri API接口路径，如 '/api/generate/webui/text2img/ultra'
	 * @param secretKey 密钥
	 * @returns 签名相关参数对象
	 */
	static generateSignature(uri: string, secretKey: string): SignatureParams {
		// 生成时间戳（毫秒）
		const timestamp = Date.now().toString();

		// 生成随机字符串
		const signatureNonce = this.generateRandomString(16);

		// 拼接原文: uri + "&" + timestamp + "&" + signatureNonce
		const content = `${uri}&${timestamp}&${signatureNonce}`;

		// 使用 HMAC-SHA1 算法加密
		const hmac = crypto.createHmac('sha1', secretKey);
		hmac.update(content, 'utf8');
		const digest = hmac.digest();

		// 生成 URL 安全的 Base64 编码（移除末尾的 = 号）
		const signature = digest
			.toString('base64')
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=+$/, '');

		return {
			timestamp,
			signatureNonce,
			signature,
		};
	}

	/**
	 * 生成指定长度的随机字符串
	 * @param length 字符串长度
	 * @returns 随机字符串
	 */
	private static generateRandomString(length: number): string {
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		let result = '';

		for (let i = 0; i < length; i++) {
			const randomIndex = Math.floor(Math.random() * chars.length);
			result += chars[randomIndex];
		}

		return result;
	}

	/**
	 * 验证签名是否正确（用于测试）
	 * @param uri API路径
	 * @param timestamp 时间戳
	 * @param signatureNonce 随机字符串
	 * @param signature 签名
	 * @param secretKey 密钥
	 * @returns 是否验证通过
	 */
	static verifySignature(
		uri: string,
		timestamp: string,
		signatureNonce: string,
		signature: string,
		secretKey: string,
	): boolean {
		const content = `${uri}&${timestamp}&${signatureNonce}`;
		const expectedSignature = crypto
			.createHmac('sha1', secretKey)
			.update(content, 'utf8')
			.digest('base64')
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=+$/, '');

		return signature === expectedSignature;
	}

	/**
	 * 检查时间戳是否在有效期内（5分钟）
	 * @param timestamp 时间戳字符串
	 * @returns 是否有效
	 */
	static isTimestampValid(timestamp: string): boolean {
		const now = Date.now();
		const requestTime = parseInt(timestamp, 10);
		const fiveMinutes = 5 * 60 * 1000; // 5分钟的毫秒数

		return Math.abs(now - requestTime) <= fiveMinutes;
	}
}