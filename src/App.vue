<template>
  <div class="notebook-container">
    <header class="header">
      <button class="back-button" @click="goBack"><</button>
      <h1>记事本</h1>
      <div class="connection-status" :class="{ connected: isConnected, disconnected: !isConnected }">
        <span>{{ connectionStatusText }}</span>
      </div>
    </header>
    
    <main class="content">
      <textarea 
        v-model="noteContent" 
        class="note-input" 
        placeholder="输入笔记内容..." 
        @input="onNoteInput"
      ></textarea>
      
      <button class="save-button" @click="saveNote">保存</button>
      
      <section class="history-section">
        <h2>历史记录</h2>
        <div class="history-list">
          <div 
            v-for="(note, index) in notesHistory" 
            :key="index" 
            class="history-item"
            @click="loadNoteFromHistory(index)"
          >
            <span class="history-number">{{ index + 1 }}</span>
            <span class="history-content">{{ note.content || '空笔记' }}</span>
            <button class="delete-history-btn" @click.stop="deleteNoteFromHistory(index)">×</button>
          </div>
        </div>
      </section>
      
      <div class="action-buttons">
        <button class="upload-button" @click="uploadToGitHub">上传</button>
        <button class="download-button" @click="downloadFromGitHub">下载</button>
      </div>
    </main>
    
    <div v-if="message" class="message" :class="messageType">
      {{ message }}
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import githubService from './services/githubService.js'

export default {
  name: 'App',
  setup() {
    const noteContent = ref('')
    const notesHistory = ref([])
    const isConnected = ref(false)
    const connectionStatusText = ref('未连接')
    const message = ref('')
    const messageType = ref('success')
    
    // 显示消息
    const showMessage = (text, type = 'success') => {
      message.value = text
      messageType.value = type
      setTimeout(() => {
        message.value = ''
      }, 3000)
    }
    
    // 验证GitHub连接
    const verifyConnection = async () => {
      try {
        const status = await githubService.verifyGitHubConnection()
        isConnected.value = status
        connectionStatusText.value = status ? '已连接' : '未连接'
        showMessage(status ? 'GitHub连接成功' : 'GitHub连接失败')
      } catch (error) {
        isConnected.value = false
        connectionStatusText.value = '连接错误'
        showMessage('GitHub连接验证失败：' + error.message, 'error')
      }
    }
    
    // 保存笔记
    const saveNote = async () => {
      if (!noteContent.value.trim()) {
        showMessage('请输入笔记内容', 'error')
        return
      }
      
      try {
        // 保存到本地历史
        notesHistory.value.push({ 
          content: noteContent.value, 
          timestamp: new Date().toISOString()
        })
        
        // 保存到GitHub
        const filename = `note_${Date.now()}.txt`
        await githubService.updateFileContent(filename, noteContent.value)
        
        showMessage('笔记保存成功')
      } catch (error) {
        showMessage('笔记保存失败：' + error.message, 'error')
      }
    }
    
    // 从历史记录加载笔记
    const loadNoteFromHistory = (index) => {
      noteContent.value = notesHistory.value[index].content
    }
    
    // 从历史记录删除笔记
    const deleteNoteFromHistory = async (index) => {
      try {
        const noteToDelete = notesHistory.value[index]
        notesHistory.value.splice(index, 1)
        
        // 从GitHub删除
        const filename = `note_${new Date(noteToDelete.timestamp).getTime()}.txt`
        await githubService.deleteNoteFromGitHub(filename)
        
        showMessage('笔记已删除')
      } catch (error) {
        showMessage('笔记删除失败：' + error.message, 'error')
      }
    }
    
    // 上传到GitHub
    const uploadToGitHub = async () => {
      try {
        for (const note of notesHistory.value) {
          const filename = `note_${new Date(note.timestamp).getTime()}.txt`
          await githubService.updateFileContent(filename, note.content)
        }
        showMessage('所有笔记已上传到GitHub')
      } catch (error) {
        showMessage('上传失败：' + error.message, 'error')
      }
    }
    
    // 从GitHub下载
    const downloadFromGitHub = async () => {
      try {
        const notes = await githubService.listNotesFromGitHub()
        
        // 清空当前历史并添加下载的笔记
        notesHistory.value = []
        for (const note of notes) {
          const content = await githubService.getFileContent(note.path)
          notesHistory.value.push({
            content: content,
            timestamp: note.last_modified
          })
        }
        
        showMessage('成功从GitHub下载笔记')
      } catch (error) {
        showMessage('下载失败：' + error.message, 'error')
      }
    }
    
    // 返回按钮处理
    const goBack = () => {
      // 这里可以实现返回上一页的逻辑
      showMessage('返回上一页')
    }
    
    // 笔记输入处理
    const onNoteInput = () => {
      // 可以在这里实现自动保存等功能
    }
    
    // 组件挂载时执行的操作
    onMounted(() => {
      verifyConnection()
      
      // 从本地存储加载历史记录
      const savedHistory = localStorage.getItem('notesHistory')
      if (savedHistory) {
        try {
          notesHistory.value = JSON.parse(savedHistory)
        } catch (e) {
          console.error('Failed to parse saved notes history', e)
        }
      }
    })
    
    // 监听历史记录变化，保存到本地存储
    watch(notesHistory, (newHistory) => {
      localStorage.setItem('notesHistory', JSON.stringify(newHistory))
    }, { deep: true })
    
    return {
      noteContent,
      notesHistory,
      isConnected,
      connectionStatusText,
      message,
      messageType,
      saveNote,
      loadNoteFromHistory,
      deleteNoteFromHistory,
      uploadToGitHub,
      downloadFromGitHub,
      goBack,
      onNoteInput
    }
  }
}
</script>

<style scoped>
.notebook-container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.back-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  margin-right: 20px;
  padding: 5px;
  color: #666;
}

.header h1 {
  flex: 1;
  text-align: center;
  margin: 0;
  font-size: 24px;
  color: #333;
}

.connection-status {
  padding: 5px 10px;
  border-radius: 10px;
  font-size: 12px;
}

.connection-status.connected {
  background-color: #e6f7e6;
  color: #389e0d;
}

.connection-status.disconnected {
  background-color: #fff1f0;
  color: #cf1322;
}

.note-input {
  width: 100%;
  height: 200px;
  padding: 15px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  resize: none;
  font-size: 16px;
  margin-bottom: 15px;
  box-sizing: border-box;
}

.save-button {
  width: 100%;
  padding: 10px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  margin-bottom: 20px;
}

.save-button:hover {
  background-color: #40a9ff;
}

.history-section {
  margin-bottom: 20px;
}

.history-section h2 {
  font-size: 18px;
  margin-bottom: 10px;
  color: #333;
}

.history-list {
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  position: relative;
}

.history-item:last-child {
  border-bottom: none;
}

.history-item:hover {
  background-color: #f5f5f5;
}

.history-number {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #1890ff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  margin-right: 10px;
  flex-shrink: 0;
}

.history-content {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  color: #666;
}

.delete-history-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #ff4d4f;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 5px;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.upload-button {
  flex: 1;
  padding: 10px;
  background-color: #52c41a;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

.upload-button:hover {
  background-color: #73d13d;
}

.download-button {
  flex: 1;
  padding: 10px;
  background-color: #fa8c16;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

.download-button:hover {
  background-color: #ffa940;
}

.message {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 10px 20px;
  border-radius: 4px;
  color: white;
  font-size: 14px;
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
}

.message.success {
  background-color: #52c41a;
}

.message.error {
  background-color: #ff4d4f;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>