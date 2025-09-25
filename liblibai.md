在这一部分，我们将展示如何开通API的权益，以及如何创建你的API密钥。
2.1 访问地址
Liblib开放平台域名：https://openapi.liblibai.cloud（无法直接打开，需配合密钥访问）
2.2 计费规则
非固定消耗，每次生图任务消耗的积分与以下参数有关：
选用模型
采样步数（steps）
采样方法（sampler，SDE系列会产生额外消耗）
生成图片宽度
生成图片高度
生成图片张数
重绘幅度（denoisingStrength）
高分辨率修复的重绘步数和重绘幅度
Controlnet数量
2.3 并发数和QPS
生图任务并发数，默认5（因生图需要时间，指同时可进行的生图任务数）
发起生图任务接口，QPS默认1秒1次，（可用每天预计生图张数/24h/60m/60s来估算平均值）
查询生图结果接口，QPS无限制
2.4 生成API密钥
在登录Liblib领取API试用积分或购买API积分后，Liblib会生成开放平台访问密钥，用于后续API接口访问，密钥包括：
AccessKey，API访问凭证，唯一识别访问用户，长度通常在20-30位左右，如：KIQMFXjHaobx7wqo9XvYKA
SecretKey，API访问密钥，用于加密请求参数，避免请求参数被篡改，长度通常在30位以上，如：KppKsn7ezZxhi6lIDjbo7YyVYzanSu2d
2.4.1 使用密钥
申请API密钥之后，需要在每次请求API接口的查询字符串中固定传递以下参数：
参数
类型
是否必需
说明
AccessKey
String
是
开通开放平台授权的访问AccessKey
Signature
String
是
加密请求参数生成的签名，签名公式见下节“生成签名”
Timestamp
String
是
生成签名时的毫秒时间戳，整数字符串，有效期5分钟
SignatureNonce
String
是
生成签名时的随机字符串
如请求地址：https://test.xxx.com/api/genImg?AccessKey=KIQMFXjHaobx7wqo9XvYKA&Signature=test1232132&Timestamp=1725458584000&SignatureNonce=random1232
2.4.2 生成签名
签名生成公式如下：
1. 用"&"拼接参数
URL地址：以上方请求地址为例，为“/api/genImg”
毫秒时间戳：即上节“使用密钥”中要传递的“Timestamp”
随机字符串：即上节“使用密钥”中要传递的“SignatureNonce”
原文 = URL地址 + "&" + 毫秒时间戳 + "&" + 随机字符串
2. 用SecretKey加密原文，使用hmacsha1算法
密文 = hmacSha1(原文, SecretKey)
3. 生成url安全的base64签名
注：base64编码时不要补全位数
签名 = encodeBase64URLSafeString(密文)
Java生成签名示例，以访问上方“使用密钥”的请求地址为例：
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.apache.commons.codec.binary.Base64;
import org.apache.commons.lang3.RandomStringUtils;
public class SignUtil {
code
Code
/**
 * 生成请求签名
 * 其中相关变量均为示例，请替换为您的实际数据
 */
public static String makeSign() {

    // API访问密钥
    String secretKey = "KppKsn7ezZxhi6lIDjbo7YyVYzanSu2d";
    
    // 请求API接口的uri地址
    String uri = "/api/generate/webui/text2img";
    // 当前毫秒时间戳
    Long timestamp = System.currentTimeMillis();
    // 随机字符串
    String signatureNonce = RandomStringUtils.randomAlphanumeric(10);
    // 拼接请求数据
    String content = uri + "&" + timestamp + "&" + signatureNonce;

    try {
        // 生成签名
        SecretKeySpec secret = new SecretKeySpec(secretKey.getBytes(), "HmacSHA1");
        Mac mac = Mac.getInstance("HmacSHA1");
        mac.init(secret);
        return Base64.encodeBase64URLSafeString(mac.doFinal(content.getBytes()));
    } catch (NoSuchAlgorithmException e) {
        throw new RuntimeException("no such algorithm");
    } catch (InvalidKeyException e) {
        throw new RuntimeException(e);
    }
}
}
Python生成签名示例，以访问上方“使用密钥”的请求地址为例：
import hmac
from hashlib import sha1
import base64
import time
import uuid
def make_sign():
"""
生成签名
"""
code
Code
# API访问密钥
secret_key = 'KppKsn7ezZxhi6lIDjbo7YyVYzanSu2d'

# 请求API接口的uri地址
uri = "/api/genImg"
# 当前毫秒时间戳
timestamp = str(int(time.time() * 1000))
# 随机字符串
signature_nonce= str(uuid.uuid4())
# 拼接请求数据
content = '&'.join((uri, timestamp, signature_nonce))

# 生成签名
digest = hmac.new(secret_key.encode(), content.encode(), sha1).digest()
# 移除为了补全base64位数而填充的尾部等号
sign = base64.urlsafe_b64encode(digest).rstrip(b'=').decode()
return sign
NodeJs 生成签名示例，以访问上方“使用密钥”的请求地址为例：
const hmacsha1 = require("hmacsha1");
const randomString = require("string-random");
// 生成签名
const urlSignature = (url) => {
if (!url) return;
const timestamp = Date.now(); // 当前时间戳
const signatureNonce = randomString(16); // 随机字符串，你可以任意设置，这个没有要求
// 原文 = URl地址 + "&" + 毫秒时间戳 + "&" + 随机字符串
const str = ${url}&${timestamp}&${signatureNonce};
const secretKey = "官网上的 SecretKey "; // 下单后在官网中，找到自己的 SecretKey'
const hash = hmacsha1(secretKey, str);
// 最后一步： encodeBase64URLSafeString(密文)
// 这一步很重要，生成安全字符串。java、Python 以外的语言，可以参考这个 JS 的处理
let signature = hash
.replace(/+/g, "-")
.replace(///g, "_")
.replace(/=+
{url}?AccessKey=
{signature}&Timestamp=
{signatureNonce}`;
};
星流Star-3 Alpha
3.1 星流Star-3 Alpha生图
3.1.1 星流Star-3 Alpha文生图
接口：POST /api/generate/webui/text2img/ultra
headers：
header
value
备注
Content-Type
application/json
请求body：
参数
类型
是否必需
说明
备注
templateUuid
string
是
星流Star-3 Alpha文生图：5d7e67009b344550bc1aa6ccbfa1d7f4
generateParams
object
是
生图参数，json结构
参数中的图片字段需提供可访问的完整图片地址
返回值：
参数
类型
备注
generateUuid
string
生图任务uuid，使用该uuid查询生图进度
参数说明
变量名
格式
备注
数值范围
必填
示例
prompt
string
正向提示词，文本
不超过2000字符
纯英文文本
是
{
"templateUuid":"5d7e67009b344550bc1aa6ccbfa1d7f4",
"generateParams":{
"prompt":"1 girl,lotus leaf,masterpiece,best quality,finely detail,highres,8k,beautiful and aesthetic,no watermark,",
"aspectRatio":"portrait",
//或者配置imageSize设置具体宽高
"imageSize": {
"width": 768,
"height": 1024
},
"imgCount":1,
"steps": 30, // 采样步数，建议30
code
Code
//高级设置，可不填写
  "controlnet":{
      "controlType":"depth",
      "controlImage": "https://liblibai-online.liblib.cloud/img/081e9f07d9bd4c2ba090efde163518f9/7c1cc38e-522c-43fe-aca9-07d5420d743e.png",
  }
}
}
aspectRatio
string
图片宽高比预设
，与imageSize二选一配置即可
square：
宽高比：1:1，通用
具体尺寸：1024*1024
portrait：
宽高比：3:4，适合人物肖像
具体尺寸：768*1024
landscape：
宽高比：16:9，适合影视画幅
具体尺寸：1280*720
二选一配置
imageSize
Object
图片具体宽高，与aspectRatio二选一配置即可
width：int，512~2048
height：int，512~2048
imgCount
int
单次生图张数
1 ~ 4
是
controlnet
Object
构图控制
controlType：
line：线稿轮廓
depth：空间关系
pose：人物姿态
IPAdapter：风格迁移
controlImage：参考图可公网访问的完整URL
否
3.1.2 星流Star-3 Alpha图生图
接口：POST /api/generate/webui/img2img/ultra
headers：
header
value
备注
Content-Type
application/json
请求body：
参数
类型
是否必需
说明
备注
templateUUID
string
是
星流Star-3 Alpha图生图：07e00af4fc464c7ab55ff906f8acf1b7
generateParams
object
是
生图参数，json结构
参数中的图片字段需提供可访问的完整图片地址
返回值：
参数
类型
备注
generateUuid
string
生图任务uuid，使用该uuid查询生图进度
参数说明
变量名
格式
备注
数值范围
必填
示例
prompt
string
正向提示词，文本
不超过2000字符
纯英文文本
是
https://liblibai.feishu.cn/sync/TF7jdgTOOsQCP4bxO2bcib7znsg
sourceImage
string
参考图URL
参考图可公网访问的完整URL
是
imgCount
int
单次生图张数
1 ~ 4
是
controlnet
Object
构图控制
controlType：
line：线稿轮廓
depth：空间关系
pose：人物姿态
IPAdapter：风格迁移
controlImage：参考图可公网访问的完整URL
否
3.2 查询生图结果
接口：POST /api/generate/webui/status
headers：
header
value
备注
Content-Type
application/json
请求body：
参数
类型
是否必需
备注
generateUuid
string
是
生图任务uuid，发起生图任务时返回该字段
返回值：
参数
类型
备注
generateUuid
string
生图任务uuid，使用该uuid查询生图进度
generateStatus
int
生图状态见下方3.3.1节
percentCompleted
float
生图进度，0到1之间的浮点数，（暂未实现）
generateMsg
string
生图信息，提供附加信息，如生图失败信息
pointsCost
int
本次生图任务消耗积分数
accountBalance
int
账户剩余积分数
images
[]object
图片列表，只提供审核通过的图片
images.0.imageUrl
string
图片地址，可直接访问，地址有时效性：7天
images.0.seed
int
随机种子值
images.0.auditStatus
int
审核状态见下方4.3.1节
示例：
{
"code": 0,
"msg": "",
"data": {
"generateUuid": "8dcbfa2997444899b71357ccb7db378b",
"generateStatus": 5,
"percentCompleted": 0,
"generateMsg": "",
"pointsCost": 10,// 本次任务消耗积分数
"accountBalance": 1356402,// 账户剩余积分数
"images": [
{
"imageUrl": "https://liblibai-online.liblib.cloud/sd-images/08efe30c1cacc4bb08df8585368db1f9c082b6904dd8150e6e0de5bc526419ee.png",
"seed": 12345,
"auditStatus": 3
}
]
}
}
3.3 参数模版预设
还提供了一些封装后的参数预设，您可以只提供必要的生图参数，极大简化了配置成本，欢迎体验~
3.3.1 模版选择（templateUuid）
模板名称
模板UUID
备注
星流Star-3 Alpha文生图
5d7e67009b344550bc1aa6ccbfa1d7f4
Checkpoint默认为官方自研模型Star-3 Alpha
支持指定的几款Controlnet
星流Star-3 Alpha图生图
07e00af4fc464c7ab55ff906f8acf1b7
Checkpoint默认为官方自研模型Star-3 Alpha
支持指定的几款Controlnet
3.3.2 模版传参示例
以下提供了调用各类模版时的传参示例，方便您理解不同模版的使用方式。
注：如果要使用如下参数示例生图，请把其中的注释删掉后再使用。
星流Star-3 Alpha文生图 - 简易版本
https://liblibai.feishu.cn/sync/AjdCdCiVHsxk2IblvGzcINM1nde
星流Star-3 Alpha图生图 - 简易版本
https://liblibai.feishu.cn/sync/TF7jdgTOOsQCP4bxO2bcib7znsg
F.1 - 主体参考参数示例（仅支持文生图）
接口：POST /api/generate/webui/text2img/ultra
{
"templateUuid":"5d7e67009b344550bc1aa6ccbfa1d7f4",
"generateParams":{
"prompt": "A fluffy cat lounges on a plush cushion.",
"promptMagic": 1,
"aspectRatio":"square",
"imgCount":1 ,
code
Code
"controlnet":{
      "controlType":"subject",
      "controlImage": "https://liblibai-online.liblib.cloud/img/081e9f07d9bd4c2ba090efde163518f9/3c65a38d7df2589c4bf834740385192128cf035c7c779ae2bbbc354bf0efcfcb.png",
  }
}
}