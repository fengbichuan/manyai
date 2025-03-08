import { Stomp } from '@stomp/stompjs'
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

  let stomp = null

  onMounted(() => {
    // 使用 STOMP 连接 WebSocket
    stomp = Stomp.over(new WebSocket(url))

    stomp.connect({}, frame => {
      console.log('STOMP connected: ' + frame)

      // 订阅后端消息
      stomp.subscribe('/topic/answers', message => {
        const data = JSON.parse(message.body)
        const aiName = data.ai  // 消息中标明哪个AI的回复
        
        if (!responses[aiName]) {
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
      })
    }, error => {
      console.error('STOMP error:', error)
    })
  })

  onUnmounted(() => {
    if (stomp) {
      stomp.disconnect(() => {
        console.log('STOMP disconnected')
      })
    }
  })

  // 提供一个发送提问的方法
  const sendQuestion = question => {
    // 发送问题到后端的 STOMP 消息通道
    stomp.send('/app/ask', {}, JSON.stringify({ event: 'ask', question, ai: aiList }))
  }

  return { responses, sendQuestion }
}
