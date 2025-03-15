<template>
  <!-- WebGL Canvas 用于绘制思维链 -->
  <canvas ref="canvas" class="chain-canvas"></canvas>
</template>

<script setup>

import { onMounted, watch, ref } from 'vue'

// 定义组件的 props
const props = defineProps({
  chainData: { type: Array, default: () => [] },      // 思维链步骤数据数组
  currentStep: { type: Number, default: -1 }          // 当前高亮的步骤索引
})

const canvas = ref(null)

onMounted(() => {
  const gl = canvas.value.getContext('webgl')
  if (!gl) {
    console.error('WebGL not supported')
    return
  }

  // 定义简单的顶点着色器和片元着色器源码
  const vsSource = `
    attribute vec2 aPosition;
    uniform float u_highlightIndex;
    varying float v_highlight;
    void main() {
      v_highlight = float(gl_VertexID) == u_highlightIndex ? 1.0 : 0.0;
      gl_Position = vec4(aPosition, 0.0, 1.0);
      gl_PointSize = 8.0;  // 设置点的大小
    }
  `
  const fsSource = `
    precision mediump float;
    varying float v_highlight;
    void main() {
      if (v_highlight > 0.5) {
        gl_FragColor = vec4(1.0, 0.5, 0.0, 1.0);  // 高亮节点用橙色
      } else {
        gl_FragColor = vec4(0.2, 0.6, 1.0, 1.0);  // 其他节点用蓝色
      }
    }
  `

  // 编译着色器并创建程序
  function compileShader(src, type) {
    const shader = gl.createShader(type)
    gl.shaderSource(shader, src)
    gl.compileShader(shader)
    return shader
  }

  const vs = compileShader(vsSource, gl.VERTEX_SHADER)
  const fs = compileShader(fsSource, gl.FRAGMENT_SHADER)
  const program = gl.createProgram()
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  gl.useProgram(program)

  // 获取 attribute/uniform 变量位置
  const posAttrib = gl.getAttribLocation(program, 'aPosition')
  const highlightUniform = gl.getUniformLocation(program, 'u_highlightIndex')

  // 根据 chainData 计算顶点位置数据（简单将步骤均匀排列成一条折线）
  function updateVertices() {
    const N = props.chainData.length
    if (N === 0) return null
    const vertices = new Float32Array(N * 2)
    for (let i = 0; i < N; i++) {
      const t = N > 1 ? i / (N - 1) : 0.5
      vertices[2*i]   = (i % 2 === 0 ? -0.5 : 0.5) * (1 - t)  // 奇偶交替左右摆动
      vertices[2*i+1] = 0.8 - 1.6 * t
    }
    return vertices
  }

  // 创建缓冲区并传入初始顶点数据
  const vertexBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
  let vertices = updateVertices()
  if (vertices) {
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW)
  }
  gl.enableVertexAttribArray(posAttrib)
  gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, 0, 0)

  // 设置初始高亮索引
  gl.uniform1f(highlightUniform, props.currentStep)

  // 清屏并绘制初始图形
  gl.clearColor(1.0, 1.0, 1.0, 1.0)    // 白色背景
  gl.clear(gl.COLOR_BUFFER_BIT)
  if (vertices) {
    gl.drawArrays(gl.LINE_STRIP, 0, props.chainData.length)
    gl.drawArrays(gl.POINTS, 0, props.chainData.length)
  }

  // 监听 props.chainData 和 props.currentStep 变化，更新 WebGL 绘制
  watch([() => props.chainData, () => props.currentStep], () => {
    vertices = updateVertices()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    if (vertices) {
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW)
    }
    gl.uniform1f(highlightUniform, props.currentStep)
    gl.clear(gl.COLOR_BUFFER_BIT)
    if (vertices) {
      gl.drawArrays(gl.LINE_STRIP, 0, props.chainData.length)
      gl.drawArrays(gl.POINTS, 0, props.chainData.length)
    }
  })
})
</script>

<style scoped>
.chain-canvas {
  width: 100%;
  height: 300px;
  display: block;
  margin-top: 16px;
}
</style>
