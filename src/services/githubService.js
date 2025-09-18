import axios from 'axios'

// 从环境变量或配置中获取GitHub相关配置
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN || process.env.GITHUB_TOKEN
const GITHUB_OWNER = import.meta.env.VITE_GITHUB_OWNER || process.env.GITHUB_OWNER
const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO || process.env.GITHUB_REPO
const GITHUB_NOTES_DIR = import.meta.env.VITE_GITHUB_NOTES_DIR || 'notes/'

// 创建axios实例
const githubApi = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    'Accept': 'application/vnd.github.v3+json',
  }
})

// 如果有GitHub token，添加到请求头
if (GITHUB_TOKEN) {
  githubApi.defaults.headers.common['Authorization'] = `token ${GITHUB_TOKEN}`
}

/**
 * 验证GitHub连接状态
 * @returns {Promise<boolean>} 连接状态
 */
export const verifyGitHubConnection = async () => {
  try {
    // 检查必要的配置是否存在
    if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
      throw new Error('GitHub配置不完整')
    }
    
    // 发送一个简单的请求来验证连接
    const response = await githubApi.get(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}`)
    return response.status === 200
  } catch (error) {
    console.error('GitHub连接验证失败:', error)
    throw error
  }
}

/**
 * 获取GitHub仓库中指定文件的内容
 * @param {string} filePath 文件路径
 * @returns {Promise<string>} 文件内容
 */
export const getFileContent = async (filePath) => {
  try {
    // 确保文件路径以笔记目录开头
    const fullPath = filePath.startsWith(GITHUB_NOTES_DIR) ? filePath : `${GITHUB_NOTES_DIR}${filePath}`
    
    const response = await githubApi.get(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${fullPath}`)
    
    // GitHub API返回的是base64编码的内容，需要解码
    if (response.data.content) {
      return atob(response.data.content)
    }
    
    throw new Error('文件内容为空')
  } catch (error) {
    console.error('获取文件内容失败:', error)
    throw error
  }
}

/**
 * 更新GitHub仓库中指定文件的内容
 * @param {string} filePath 文件路径
 * @param {string} content 文件内容
 * @param {string} message 提交消息
 * @returns {Promise<Object>} GitHub API响应
 */
export const updateFileContent = async (filePath, content, message = 'Update note') => {
  try {
    // 确保文件路径以笔记目录开头
    const fullPath = filePath.startsWith(GITHUB_NOTES_DIR) ? filePath : `${GITHUB_NOTES_DIR}${filePath}`
    
    let sha = null
    
    try {
      // 尝试获取文件的当前SHA值（如果文件已存在）
      const existingFile = await githubApi.get(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${fullPath}`)
      sha = existingFile.data.sha
    } catch (err) {
      // 如果文件不存在，sha保持为null
      if (err.response && err.response.status !== 404) {
        throw err
      }
    }
    
    // 对内容进行base64编码
    const encodedContent = btoa(unescape(encodeURIComponent(content)))
    
    const response = await githubApi.put(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${fullPath}`, {
      message: message,
      content: encodedContent,
      sha: sha // 如果文件存在，需要提供sha值
    })
    
    return response.data
  } catch (error) {
    console.error('更新文件内容失败:', error)
    throw error
  }
}

/**
 * 列出GitHub仓库内所有笔记文件清单
 * @returns {Promise<Array>} 文件清单
 */
export const listNotesFromGitHub = async () => {
  try {
    const response = await githubApi.get(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_NOTES_DIR}`)
    
    // 过滤出文本文件并返回必要信息
    return response.data
      .filter(file => file.type === 'file' && file.name.endsWith('.txt'))
      .map(file => ({
        name: file.name,
        path: file.path,
        size: file.size,
        last_modified: file.last_modified || new Date().toISOString()
      }))
  } catch (error) {
    console.error('列出笔记文件失败:', error)
    // 如果目录不存在，返回空数组
    if (error.response && error.response.status === 404) {
      return []
    }
    throw error
  }
}

/**
 * 删除GitHub仓库中的指定笔记文件
 * @param {string} filePath 文件路径
 * @param {string} message 提交消息
 * @returns {Promise<Object>} GitHub API响应
 */
export const deleteNoteFromGitHub = async (filePath, message = 'Delete note') => {
  try {
    // 确保文件路径以笔记目录开头
    const fullPath = filePath.startsWith(GITHUB_NOTES_DIR) ? filePath : `${GITHUB_NOTES_DIR}${filePath}`
    
    // 首先获取文件的SHA值
    const existingFile = await githubApi.get(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${fullPath}`)
    const sha = existingFile.data.sha
    
    const response = await githubApi.delete(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${fullPath}`, {
      data: {
        message: message,
        sha: sha
      }
    })
    
    return response.data
  } catch (error) {
    console.error('删除文件失败:', error)
    throw error
  }
}

// 导出所有函数
export default {
  verifyGitHubConnection,
  getFileContent,
  updateFileContent,
  listNotesFromGitHub,
  deleteNoteFromGitHub
}