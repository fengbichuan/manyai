import { Stomp } from '@stomp/stompjs'
import { reactive, onMounted, onUnmounted } from 'vue'

export function useAIWebSocket(url, aiList) {
  // ================= 响应式状态初始化 =================
  const responses = reactive(
    aiList.reduce((acc, name) => {
      acc[name] = reactive({
        name,
        content: '',          // 主回答内容
        reasoning: '',        // 思考过程内容
        done: false,           // 是否完成
        responseTime: 0,      // 单位：秒
        confidence: null,     // 置信度
        error: null,          // 错误信息
        lastUpdated: 0        // 最后更新时间戳
      })
      return acc
    }, {})
  )

  // ================= 连接管理 =================
  let stompClient = null
  let isConnected = false
  const retryInterval = 5000
  let retryTimer = null

  // ================= 调试工具 =================
  const debugLog = (type, message) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[WS][${new Date().toLocaleTimeString()}] ${type}:`, message)
    }
  }

  // ================= 核心消息处理 =================
  const handleIncomingMessage = (message) => {
    debugLog('收到原始消息', message.body)
    
    try {
      const rawData = message.body
      const data = JSON.parse(rawData)
      debugLog('解析消息', data)

      const aiName = validateMessage(data)
      if (!aiName) return

      // 增强日志：记录完整数据结构
      debugLog('消息结构', {
        ai: aiName,
        hasContent: !!data.content,
        contentLength: data.content?.length || 0,
        hasReasoning: !!data.reasoning,
        reasoningLength: data.reasoning?.length || 0,
        isDone: data.done
      })

      updateAIState(aiName, data)
      forceViewUpdate(aiName)

    } catch (error) {
      console.error('消息处理失败:', error)
      debugLog('解析错误', {
        error: error.message,
        raw: message.body.substring(0, 100) + '...'
      })
    }
  }

  const validateMessage = (data) => {
    // 增强验证：检查必要字段
    if (!data?.ai) {
      debugLog('非法消息', '缺少ai字段')
      return null
    }

    const aiName = data.ai
    if (!responses[aiName]) {
      debugLog('未知AI', `无法识别的AI名称: ${aiName}`)
      return null
    }
    return aiName
  }

  // ================= 状态更新 =================
  const updateAIState = (aiName, data) => {
    const aiState = responses[aiName]
    
    // 状态重置逻辑
    if ((data.content || data.reasoning) && aiState.error) {
      aiState.error = null
      aiState.content = ''
      aiState.reasoning = ''
    }

    // 错误处理（优先处理错误状态）
    if (data.error) {
      handleErrorState(aiState, data)
      return
    }

    // 内容更新处理
    processContentUpdates(aiState, data)

    // 完成状态处理
    if (data.done) {
      processCompletion(aiState, data)
    }
  }

  const handleErrorState = (aiState, data) => {
    aiState.content += `\n[ERROR] ${data.error}`
    aiState.reasoning += `\n[系统异常] ${data.error}`
    aiState.done = true
    aiState.error = data.error
    aiState.responseTime = (data.time / 1000).toFixed(1)
  }

  const processContentUpdates = (aiState, data) => {
    // 增量更新内容
    if (typeof data.content === 'string') {
      aiState.content += data.content
      aiState.lastUpdated = Date.now()
    }

    // 增量更新推理过程
    if (typeof data.reasoning === 'string') {
      aiState.reasoning += data.reasoning
      aiState.lastUpdated = Date.now()
    }
  }

  const processCompletion = (aiState, data) => {
    aiState.done = true
    aiState.responseTime = (data.time / 1000).toFixed(1)
    
    // 计算置信度（结合内容和推理）
    aiState.confidence = calculateCombinedConfidence(
      aiState.content,
      aiState.reasoning
    )

    // 最终内容清理
    aiState.content = aiState.content.trim()
    aiState.reasoning = aiState.reasoning.trim()
  }

  // ================= 响应式更新 =================
  const forceViewUpdate = (aiName) => {
    // 触发深度更新
    const current = responses[aiName]
    responses[aiName] = Object.assign({}, current)
    
    debugLog('视图更新', {
      ai: aiName,
      contentLength: current.content.length,
      reasoningLength: current.reasoning.length,
      done: current.done
    })
  }

  // ================= 连接控制 =================
  const initializeConnection = () => {
    debugLog('初始化连接', url)

    // 清理旧连接
    if (stompClient?.connected) {
      stompClient.deactivate()
    }

    stompClient = Stomp.over(() => {
      const ws = new WebSocket(url)
      ws.onerror = (e) => debugLog('WS错误', e)
      ws.onclose = (e) => {
        debugLog('连接关闭', `代码: ${e.code}, 原因: ${e.reason}`)
        handleDisconnection()
      }
      return ws
    })

    // 配置心跳检测
    stompClient.heartbeatIncoming = 4000
    stompClient.heartbeatOutgoing = 4000
    stompClient.debug = (msg) => debugLog('STOMP协议', msg)

    stompClient.connect({},
      (frame) => {
        isConnected = true
        debugLog('连接成功', frame.command)

        // 订阅消息通道
        const sub = stompClient.subscribe('/topic/answers', message => {
          handleIncomingMessage(message)
        })
        debugLog('订阅成功', sub.id)

        clearRetryTimer()
      },
      (error) => {
        isConnected = false
        debugLog('连接错误', error.headers.message)
        handleDisconnection()
      }
    )
  }

  // ================= 连接异常处理 =================
  const handleDisconnection = () => {
    isConnected = false
    debugLog('连接状态', '已断开')
    setupRetry()
    
    // 标记所有AI为异常状态
    aiList.forEach(name => {
      if (!responses[name].done) {
        responses[name].error = '连接已断开，正在尝试重连...'
        forceViewUpdate(name)
      }
    })
  }

  // ================= 重试机制 =================
  const setupRetry = () => {
    if (!retryTimer) {
      debugLog('连接重试', `将在 ${retryInterval/1000} 秒后重试`)
      retryTimer = setInterval(() => {
        if (!isConnected) {
          debugLog('尝试重连', '启动新连接...')
          initializeConnection()
        }
      }, retryInterval)
    }
  }

  const clearRetryTimer = () => {
    if (retryTimer) {
      clearInterval(retryTimer)
      retryTimer = null
      debugLog('重试清理', '已停止重试计时器')
    }
  }

  // ================= 生命周期 =================
  onMounted(() => {
    debugLog('组件挂载', '初始化WebSocket')
    initializeConnection()
  })

  onUnmounted(() => {
    debugLog('组件卸载', '清理连接')
    if (stompClient) {
      stompClient.deactivate()
    }
    clearRetryTimer()
  })

  // ================= 公共方法 =================
  const sendQuestion = (question) => {
    if (!isConnected) {
      console.error('发送失败：连接未建立')
      return false
    }

    // 重置所有AI状态
    aiList.forEach(name => {
      const aiState = responses[name]
      aiState.content = ''
      aiState.reasoning = ''
      aiState.done = false
      aiState.error = null
      aiState.responseTime = 0
      aiState.confidence = null
      forceViewUpdate(name)
    })

    const payload = {
      question,
      ais: aiList,
      timestamp: Date.now()
    }

    try {
      debugLog('发送请求', {
        question: question.substring(0, 50) + '...',
        length: question.length
      })
      
      stompClient.send('/app/ask', {}, JSON.stringify(payload))
      return true
    } catch (error) {
      console.error('消息发送失败:', error)
      debugLog('发送错误', {
        error: error.message,
        code: error.code
      })
      return false
    }
  }

  // ================= 工具方法 =================
  const calculateCombinedConfidence = (content, reasoning) => {
    const contentScore = Math.min(content.length / 500, 1)
    const reasoningScore = Math.min(reasoning.length / 1000, 1)
    const totalScore = (contentScore * 0.6) + (reasoningScore * 0.4)
    
    if (totalScore > 0.8) return '高可信度'
    if (totalScore > 0.6) return '中等可信度'
    return '低可信度'
  }

  return {
    responses,
    sendQuestion,
    connectionStatus: isConnected
  }
}




export async function askCoze(conversationId, question) {
  const url = "http://localhost:8082/api/coze/ask";
  const payload = {
    conversationId: conversationId,
    question: question
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload) // 需要手动将 JS 对象转为 JSON 字符串
    });

    if (!response.ok) { // 检查 HTTP 状态码是否表示成功
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json(); // 解析 JSON 响应体

    if (responseData && responseData.answer !== undefined) {
        console.log("成功获取到回答:");
        console.log(responseData.answer);
        return responseData.answer;
    } else {
        console.log("响应中未找到 'answer' 字段。");
        console.log("完整响应:", responseData);
        return null;
    }

  } catch (error) {
    console.error("请求出错:", error);
    return null;
  }
}

