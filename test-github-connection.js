// 测试GitHub连接的脚本
import axios from 'axios';
import fs from 'fs';

// 读取.env文件中的环境变量
function loadEnv() {
  const envPath = '.env';
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    
    const envVars = {};
    envLines.forEach(line => {
      const [key, value] = line.split('=').map(part => part.trim());
      if (key && key.startsWith('VITE_')) {
        envVars[key.replace('VITE_', '')] = value.replace(/"/g, '');
      }
    });
    
    return envVars;
  } else {
    console.error('未找到.env文件，请先创建并配置');
    return null;
  }
}

// 测试GitHub连接
async function testGitHubConnection() {
  console.log('开始测试GitHub连接...');
  
  const envVars = loadEnv();
  if (!envVars) {
    return;
  }
  
  const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH, GITHUB_NOTES_DIR } = envVars;
  
  console.log('当前配置:');
  console.log(`- GITHUB_TOKEN: ${GITHUB_TOKEN ? '已配置' : '未配置'}`);
  console.log(`- GITHUB_OWNER: ${GITHUB_OWNER}`);
  console.log(`- GITHUB_REPO: ${GITHUB_REPO}`);
  console.log(`- GITHUB_BRANCH: ${GITHUB_BRANCH || 'main'}`);
  console.log(`- GITHUB_NOTES_DIR: ${GITHUB_NOTES_DIR || 'notes/'}`);
  
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    console.error('缺少必要的GitHub配置，请检查.env文件');
    return;
  }
  
  try {
    // 创建axios实例
    const githubClient = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    // 测试1: 验证认证是否有效
    console.log('\n测试1: 验证认证...');
    const userResponse = await githubClient.get('/user');
    console.log(`✓ 认证成功！登录用户: ${userResponse.data.login}`);
    
    // 测试2: 验证仓库是否存在
    console.log('\n测试2: 验证仓库是否存在...');
    const repoResponse = await githubClient.get(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}`);
    console.log(`✓ 仓库存在！仓库名称: ${repoResponse.data.full_name}`);
    
    // 测试3: 验证分支是否存在
    console.log('\n测试3: 验证分支是否存在...');
    const branchResponse = await githubClient.get(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/branches/${GITHUB_BRANCH || 'main'}`);
    console.log(`✓ 分支存在！分支名称: ${branchResponse.data.name}`);
    
    // 测试4: 测试创建一个测试文件
    console.log('\n测试4: 测试文件操作...');
    const testFilePath = `${GITHUB_NOTES_DIR || 'notes/'}/test_connection.txt`;
    const testContent = `测试连接成功！时间: ${new Date().toISOString()}`;
    
    await githubClient.put(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${testFilePath}`, {
      message: '测试GitHub连接',
      content: Buffer.from(testContent).toString('base64'),
      branch: GITHUB_BRANCH || 'main'
    });
    
    console.log(`✓ 文件操作成功！已创建测试文件: ${testFilePath}`);
    
    // 清理测试文件
    console.log('\n清理测试文件...');
    const fileInfo = await githubClient.get(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${testFilePath}?ref=${GITHUB_BRANCH || 'main'}`);
    await githubClient.delete(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${testFilePath}`, {
      data: {
        message: '删除测试文件',
        sha: fileInfo.data.sha,
        branch: GITHUB_BRANCH || 'main'
      }
    });
    
    console.log('✓ 测试文件已删除');
    console.log('\n🎉 所有测试都通过了！GitHub连接配置正确。');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    
    if (error.response) {
      console.error(`状态码: ${error.response.status}`);
      
      if (error.response.status === 401) {
        console.error('错误原因: GitHub令牌无效或权限不足。请确保令牌具有repo权限。');
      } else if (error.response.status === 404) {
        console.error('错误原因: 找不到指定的仓库、分支或路径。请检查GITHUB_OWNER、GITHUB_REPO和GITHUB_BRANCH配置是否正确。');
      } else if (error.response.status === 403) {
        console.error('错误原因: API限流或权限被拒绝。');
      }
      
      if (error.response.data && error.response.data.message) {
        console.error(`GitHub错误消息: ${error.response.data.message}`);
      }
    }
  }
}

testGitHubConnection().catch(err => {
  console.error('测试过程中出现错误:', err);
});