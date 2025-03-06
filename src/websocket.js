// websocket.js - 使用 Composition API 建立 WebSocket 连接并处理消息
import { reactive, onMounted, onUnmounted } from 'vue'

export function useAIWebSocket(url, aiList) {
  // 保存多个AI的响应状态：内容、是否完成、耗时、置信度等
  const responses = reactive({})
  // 初始化每个AI的响应对象
  aiList.forEach(name => {
    responses[name] = {
      name,
      content: '',        // 累积的回答内容
      done: false,        // 是否完成回答
      responseTime: 0,    // 响应耗时（ms）
      confidence: null    // 置信度（如果有）
    }
  })

  let socket = null

  onMounted(() => {
    socket = new WebSocket(url)
    // 当连接打开时，可以根据需要发送初始化消息或鉴权
    socket.onopen = () => {
      console.log('WebSocket connection established')
    }
    // 处理服务器发送的消息
    socket.onmessage = event => {
      const data = JSON.parse(event.data)
      const aiName = data.ai  // 消息中标明哪个AI的回复
      if (!responses[aiName]) {
        // 若该AI不在当前列表中，初始化一个
        responses[aiName] = { name: aiName, content: '', done: false, responseTime: 0, confidence: null }
      }
      // 累加文本内容实现流式显示
      if (data.text) {
        responses[aiName].content += data.text
      }
      // 如果该消息标志回答已完成，更新完成状态、耗时和置信度
      if (data.done) {
        responses[aiName].done = true
        if (data.time) responses[aiName].responseTime = data.time  // 从后端获取的耗时
        if (data.confidence) responses[aiName].confidence = data.confidence  // 从后端获取的置信度
      }
    }
    socket.onerror = error => {
      console.error('WebSocket error:', error)
    }
    socket.onclose = () => {
      console.log('WebSocket connection closed')
    }
  })

  onUnmounted(() => {
    if (socket) {
      socket.close()
    }
  })

  // 提供一个发送提问的方法
  const sendQuestion = question => {
    // 每次提问前清空之前的回答内容状态
    Object.values(responses).forEach(resp => {
      resp.content = ''
      resp.done = false
      resp.responseTime = 0
      resp.confidence = null
    })
    // 通过 WebSocket 发送提问，后端据此调用各 AI 服务
    const payload = { event: 'ask', question, ai: aiList }
    socket.send(JSON.stringify(payload))
  }

  return { responses, sendQuestion }
}
