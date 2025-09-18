# GitHub连接配置指南

本指南将帮助您正确配置GitHub连接，解决连接验证失败的问题。

## 问题诊断

根据测试结果，当前遇到的问题是：

```
测试1: 验证认证...
❌ 测试失败: Request failed with status code 401
状态码: 401
错误原因: GitHub令牌无效或权限不足。请确保令牌具有repo权限。
GitHub错误消息: Bad credentials
```

这表明您的GitHub令牌无效或权限不足。

## 步骤1：创建有效的GitHub个人访问令牌

1. 登录您的GitHub账号
2. 点击右上角的头像，选择「Settings」（设置）
3. 在左侧菜单中，选择「Developer settings」（开发者设置）
4. 选择「Personal access tokens」（个人访问令牌）
5. 点击「Generate new token」（生成新令牌）
6. 为令牌添加一个描述性名称（例如：Notebook App Token）
7. **最重要的一步**：在「Select scopes」（选择作用域）部分，勾选 **repo** 权限
8. 向下滚动页面，点击「Generate token」（生成令牌）
9. **复制生成的令牌**并妥善保存，因为它只会显示一次

## 步骤2：配置.env文件

1. 将项目中的 `.env.example` 文件重命名为 `.env`
2. 打开 `.env` 文件并填写以下配置：

```env
# GitHub个人访问令牌（必需）
VITE_GITHUB_TOKEN="您刚刚生成的GitHub令牌"

# GitHub用户名或组织名（必需）
VITE_GITHUB_OWNER="您的GitHub用户名"

# GitHub仓库名（必需）
VITE_GITHUB_REPO="您要使用的仓库名称"

# GitHub分支名（可选，默认为'main'）
VITE_GITHUB_BRANCH="master"  # 如果您的仓库默认分支是master，请保留这个设置

# 笔记文件存储目录（可选，默认为'notes/'）
VITE_GITHUB_NOTES_DIR="notes/"
```

## 步骤3：验证配置

配置完成后，您可以通过以下方式验证GitHub连接：

1. 在应用界面中，点击「重新连接」按钮
2. 或者运行测试脚本来验证配置：

```bash
node test-github-connection.js
```

## 常见问题排查

如果您仍然遇到连接问题，请检查以下几点：

### 401错误（认证失败）
- 确保GitHub令牌正确无误
- 确保令牌具有足够的权限（至少需要repo权限）
- 检查令牌是否已过期

### 404错误（未找到）
- 确保GitHub用户名（GITHUB_OWNER）正确
- 确保仓库名称（GITHUB_REPO）正确
- 确保仓库分支（GITHUB_BRANCH）正确
- 检查仓库是否存在，并且您有权限访问

### 其他错误
- 检查您的网络连接是否正常
- 确认GitHub服务器没有宕机
- 检查是否达到了API调用限制

## 步骤4：连接恢复后的操作

当GitHub连接恢复正常后，您可以：

1. 使用应用界面上的「上传」按钮，将本地笔记同步到GitHub仓库
2. 使用「下载」按钮，从GitHub获取最新的笔记
3. 正常使用应用的保存功能，笔记会自动同步到GitHub

## 注意事项

- 请妥善保管您的GitHub令牌，不要将其分享给他人或提交到公开仓库
- 如果您怀疑令牌已泄露，请立即在GitHub上撤销该令牌
- 定期更新您的令牌以确保账户安全

如果您按照上述步骤操作后仍然无法解决问题，请查看浏览器的开发者控制台，获取更详细的错误信息。