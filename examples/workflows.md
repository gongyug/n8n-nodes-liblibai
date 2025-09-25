# LiblibAI n8n 节点示例工作流

本文档提供了多个实用的 LiblibAI 工作流示例，帮助您快速上手使用。

## 1. 基础文生图工作流

### 工作流描述
最简单的文生图工作流，适合快速测试和单张图片生成。

### 节点配置
```json
{
  "nodes": [
    {
      "parameters": {},
      "type": "n8n-nodes-base.start",
      "typeVersion": 1,
      "position": [250, 300],
      "id": "start"
    },
    {
      "parameters": {
        "operation": "text2img",
        "prompt": "1 girl, masterpiece, best quality, beautiful portrait, anime style",
        "aspectRatio": "portrait",
        "imgCount": 1,
        "asyncSettings": {
          "waitForCompletion": true,
          "maxWaitTime": 300,
          "pollInterval": 5
        }
      },
      "type": "n8n-nodes-liblibai.liblibAI",
      "typeVersion": 1,
      "position": [450, 300],
      "id": "liblibai-text2img",
      "credentials": {
        "liblibAIApi": {
          "id": "1",
          "name": "LiblibAI API"
        }
      }
    }
  ],
  "connections": {
    "start": {
      "main": [[{"node": "liblibai-text2img", "type": "main", "index": 0}]]
    }
  }
}
```

### 使用说明
1. 配置 LiblibAI API 凭据
2. 修改提示词为您想要的内容
3. 执行工作流，等待图片生成完成
4. 在输出中查看生成的图片

---

## 2. 批量文生图工作流

### 工作流描述
从 CSV 文件读取多个提示词，批量生成图片，适合内容创作和批量处理。

### 工作流配置
```json
{
  "nodes": [
    {
      "parameters": {
        "filePath": "./prompts.csv",
        "options": {
          "delimiter": ","
        }
      },
      "type": "n8n-nodes-base.readfile",
      "typeVersion": 1,
      "position": [250, 300],
      "id": "read-csv"
    },
    {
      "parameters": {
        "operation": "text2img",
        "prompt": "={{$json.prompt}}",
        "aspectRatio": "={{$json.aspectRatio || 'square'}}",
        "imgCount": 1,
        "advancedSettings": {
          "steps": "={{parseInt($json.steps) || 30}}"
        },
        "asyncSettings": {
          "waitForCompletion": true,
          "maxWaitTime": 600
        }
      },
      "type": "n8n-nodes-liblibai.liblibAI",
      "typeVersion": 1,
      "position": [450, 300],
      "id": "batch-generation",
      "credentials": {
        "liblibAIApi": {
          "id": "1",
          "name": "LiblibAI API"
        }
      }
    },
    {
      "parameters": {
        "options": {
          "fileName": "={{$json.prompt.substring(0, 30)}}_{{Date.now()}}.png"
        }
      },
      "type": "n8n-nodes-base.writebinaryfile",
      "typeVersion": 1,
      "position": [650, 300],
      "id": "save-images"
    }
  ],
  "connections": {
    "read-csv": {
      "main": [[{"node": "batch-generation", "type": "main", "index": 0}]]
    },
    "batch-generation": {
      "main": [[{"node": "save-images", "type": "main", "index": 0}]]
    }
  }
}
```

### CSV 文件格式 (prompts.csv)
```csv
prompt,aspectRatio,steps
"1 girl, beautiful anime character, masterpiece",portrait,30
"landscape, mountains, sunset, beautiful scenery",landscape,35
"cute cat, fluffy, adorable, high quality",square,25
```

---

## 3. 图生图风格转换工作流

### 工作流描述
上传参考图片，使用 LiblibAI 进行风格转换或图像优化。

### 工作流配置
```json
{
  "nodes": [
    {
      "parameters": {},
      "type": "n8n-nodes-base.start",
      "typeVersion": 1,
      "position": [250, 300],
      "id": "start"
    },
    {
      "parameters": {
        "operation": "img2img",
        "prompt": "anime style, high quality, beautiful colors, masterpiece",
        "sourceImage": "https://example.com/source-image.jpg",
        "aspectRatio": "portrait",
        "advancedSettings": {
          "steps": 40,
          "enableControlNet": true,
          "controlType": "IPAdapter",
          "controlImage": "https://example.com/style-reference.jpg"
        },
        "asyncSettings": {
          "waitForCompletion": true,
          "maxWaitTime": 400
        }
      },
      "type": "n8n-nodes-liblibai.liblibAI",
      "typeVersion": 1,
      "position": [450, 300],
      "id": "style-transfer",
      "credentials": {
        "liblibAIApi": {
          "id": "1",
          "name": "LiblibAI API"
        }
      }
    },
    {
      "parameters": {
        "subject": "风格转换完成",
        "text": "图片已成功转换为 {{$json.operation}} 风格\n\n生成参数:\n- 采样步数: {{$json.steps}}\n- 消耗积分: {{$json.pointsCost}}\n- 剩余积分: {{$json.accountBalance}}",
        "attachments": [
          {
            "name": "generated_image.png",
            "data": "={{$binary.image_0.data}}",
            "type": "binary"
          }
        ]
      },
      "type": "n8n-nodes-base.gmail",
      "typeVersion": 2,
      "position": [650, 300],
      "id": "send-result"
    }
  ],
  "connections": {
    "start": {
      "main": [[{"node": "style-transfer", "type": "main", "index": 0}]]
    },
    "style-transfer": {
      "main": [[{"node": "send-result", "type": "main", "index": 0}]]
    }
  }
}
```

---

## 4. 异步任务管理工作流

### 工作流描述
提交生图任务后不等待完成，通过定时器定期检查任务状态，适合处理大量长时间任务。

### 工作流配置
```json
{
  "nodes": [
    {
      "parameters": {},
      "type": "n8n-nodes-base.start",
      "typeVersion": 1,
      "position": [250, 200],
      "id": "start"
    },
    {
      "parameters": {
        "operation": "text2img",
        "prompt": "complex artwork, highly detailed, masterpiece, 4k resolution",
        "aspectRatio": "landscape",
        "advancedSettings": {
          "steps": 50
        },
        "asyncSettings": {
          "waitForCompletion": false
        }
      },
      "type": "n8n-nodes-liblibai.liblibAI",
      "typeVersion": 1,
      "position": [450, 200],
      "id": "submit-task",
      "credentials": {
        "liblibAIApi": {
          "id": "1",
          "name": "LiblibAI API"
        }
      }
    },
    {
      "parameters": {
        "unit": "seconds",
        "amount": 30
      },
      "type": "n8n-nodes-base.wait",
      "typeVersion": 1,
      "position": [650, 200],
      "id": "wait"
    },
    {
      "parameters": {
        "operation": "checkStatus",
        "generateUuid": "={{$json.generateUuid}}"
      },
      "type": "n8n-nodes-liblibai.liblibAI",
      "typeVersion": 1,
      "position": [850, 200],
      "id": "check-status",
      "credentials": {
        "liblibAIApi": {
          "id": "1",
          "name": "LiblibAI API"
        }
      }
    },
    {
      "parameters": {
        "conditions": {
          "number": [
            {
              "value1": "={{$json.generateStatus}}",
              "operation": "equal",
              "value2": 5
            }
          ]
        }
      },
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [1050, 200],
      "id": "check-completed"
    },
    {
      "parameters": {
        "amount": 5,
        "unit": "seconds"
      },
      "type": "n8n-nodes-base.wait",
      "typeVersion": 1,
      "position": [850, 400],
      "id": "wait-retry"
    }
  ],
  "connections": {
    "start": {
      "main": [[{"node": "submit-task", "type": "main", "index": 0}]]
    },
    "submit-task": {
      "main": [[{"node": "wait", "type": "main", "index": 0}]]
    },
    "wait": {
      "main": [[{"node": "check-status", "type": "main", "index": 0}]]
    },
    "check-status": {
      "main": [[{"node": "check-completed", "type": "main", "index": 0}]]
    },
    "check-completed": {
      "main": [
        [],
        [{"node": "wait-retry", "type": "main", "index": 0}]
      ]
    },
    "wait-retry": {
      "main": [[{"node": "check-status", "type": "main", "index": 0}]]
    }
  }
}
```

---

## 5. ControlNet 精确控制工作流

### 工作流描述
使用 ControlNet 功能精确控制生成图片的构图、姿态或风格。

### 工作流配置
```json
{
  "nodes": [
    {
      "parameters": {},
      "type": "n8n-nodes-base.start",
      "typeVersion": 1,
      "position": [250, 300],
      "id": "start"
    },
    {
      "parameters": {
        "operation": "text2img",
        "prompt": "1 girl, beautiful face, detailed eyes, anime style, masterpiece",
        "aspectRatio": "portrait",
        "imgCount": 2,
        "advancedSettings": {
          "steps": 35,
          "enableControlNet": true,
          "controlType": "pose",
          "controlImage": "https://example.com/pose-reference.jpg"
        },
        "asyncSettings": {
          "waitForCompletion": true,
          "maxWaitTime": 500
        }
      },
      "type": "n8n-nodes-liblibai.liblibAI",
      "typeVersion": 1,
      "position": [450, 300],
      "id": "controlnet-generation",
      "credentials": {
        "liblibAIApi": {
          "id": "1",
          "name": "LiblibAI API"
        }
      }
    },
    {
      "parameters": {
        "authentication": "oAuth2",
        "resource": "file",
        "operation": "upload",
        "binaryData": true,
        "name": "LiblibAI_Generated_{{Date.now()}}.png",
        "parents": ["your-google-drive-folder-id"]
      },
      "type": "n8n-nodes-base.googledrive",
      "typeVersion": 3,
      "position": [650, 300],
      "id": "upload-to-drive"
    }
  ],
  "connections": {
    "start": {
      "main": [[{"node": "controlnet-generation", "type": "main", "index": 0}]]
    },
    "controlnet-generation": {
      "main": [[{"node": "upload-to-drive", "type": "main", "index": 0}]]
    }
  }
}
```

---

## 6. 错误处理和重试工作流

### 工作流描述
包含完整错误处理机制的健壮工作流，支持重试和错误通知。

### 工作流配置
```json
{
  "nodes": [
    {
      "parameters": {},
      "type": "n8n-nodes-base.start",
      "typeVersion": 1,
      "position": [250, 300],
      "id": "start"
    },
    {
      "parameters": {
        "operation": "text2img",
        "prompt": "={{$json.prompt || 'default beautiful artwork'}}",
        "aspectRatio": "square",
        "asyncSettings": {
          "waitForCompletion": true,
          "maxWaitTime": 300
        }
      },
      "type": "n8n-nodes-liblibai.liblibAI",
      "typeVersion": 1,
      "position": [450, 300],
      "id": "generate-image",
      "credentials": {
        "liblibAIApi": {
          "id": "1",
          "name": "LiblibAI API"
        }
      },
      "continueOnFail": true
    },
    {
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{$json.success}}",
              "value2": true
            }
          ]
        }
      },
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [650, 300],
      "id": "check-success"
    },
    {
      "parameters": {
        "subject": "LiblibAI 生图成功",
        "text": "图片已成功生成！\n\n任务ID: {{$json.generateUuid}}\n消耗积分: {{$json.pointsCost}}"
      },
      "type": "n8n-nodes-base.gmail",
      "typeVersion": 2,
      "position": [850, 200],
      "id": "success-notification"
    },
    {
      "parameters": {
        "subject": "LiblibAI 生图失败",
        "text": "生图任务失败，请检查配置。\n\n错误信息: {{$json.error}}\n详细信息: {{JSON.stringify($json.details, null, 2)}}"
      },
      "type": "n8n-nodes-base.gmail",
      "typeVersion": 2,
      "position": [850, 400],
      "id": "error-notification"
    }
  ],
  "connections": {
    "start": {
      "main": [[{"node": "generate-image", "type": "main", "index": 0}]]
    },
    "generate-image": {
      "main": [[{"node": "check-success", "type": "main", "index": 0}]]
    },
    "check-success": {
      "main": [
        [{"node": "success-notification", "type": "main", "index": 0}],
        [{"node": "error-notification", "type": "main", "index": 0}]
      ]
    }
  }
}
```

---

## 使用技巧

### 1. 提示词优化
- **英文提示词**: 使用英文获得最佳效果
- **质量词汇**: 添加 "masterpiece", "best quality", "highly detailed" 等
- **风格指定**: 明确指定艺术风格，如 "anime style", "photorealistic"

### 2. 参数调优
- **采样步数**: 20-30步适合快速预览，40-50步获得高质量结果
- **图片尺寸**: 根据用途选择合适的宽高比
- **生成数量**: 批量生成时注意API限制和积分消耗

### 3. 异步处理
- **长时间任务**: 使用异步模式避免超时
- **批量处理**: 控制并发数量，避免触发API限制
- **错误恢复**: 实现重试机制处理网络问题

### 4. ControlNet 使用
- **参考图质量**: 使用清晰、高对比度的控制图
- **类型选择**: 根据需求选择合适的控制类型
- **组合使用**: 可以结合多种控制方式获得精确效果

### 5. 成本优化
- **预览模式**: 使用较少步数先预览效果
- **批量处理**: 合理安排任务减少重复成本
- **结果缓存**: 保存满意的结果避免重复生成

---

## 常见问题解决

### Q: 生图任务一直显示"进行中"状态？
A: 检查网络连接和API积分余额，适当增加最大等待时间。

### Q: 生成的图片质量不满意？
A: 尝试增加采样步数、优化提示词，或使用ControlNet进行精确控制。

### Q: API调用频率过高被限制？
A: 在批量处理时添加延迟，控制并发请求数量。

### Q: 图片下载失败？
A: 检查网络连接，图片URL有7天有效期，及时保存。

---

通过这些示例工作流，您可以快速开始使用 LiblibAI n8n 节点，并根据具体需求进行定制和扩展。