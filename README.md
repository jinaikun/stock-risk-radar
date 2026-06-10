# 股票交易纪律助手

公开版股票风控与复盘助手原型。

## 当前功能

- 持仓录入：输入 6 位股票代码、成本价、持仓天数，名称和当前价自动填入并保留显示
- 自选监控：自选代码、名称、触发价
- 规则设置：硬止损、ATR止损倍数、ATR止盈倍数、移动止盈启动、最大持仓天数
- 实时预警：严重、警戒、观察、正常四级
- AI复盘演示：生成复盘消耗 tokens
- 商业化入口：tokens 余额与充值演示
- 移动端 PWA 页面：可直接在浏览器打开

## 产品边界

第一版定位为用户自定义规则的风控提醒工具，不做荐股，不做自动下单，不承诺收益。

后续公开版建议拆成：

- App 前端：用户界面、持仓、自选、规则、复盘
- 后端服务：用户、规则、预警、tokens、复盘记录
- 行情服务：接入合规行情源，统一生成触发事件
- 推送服务：App Push、企业微信、飞书或邮件
- AI 服务：只用于解释、复盘、纪律评分和规则优化

## 本地预览

直接用浏览器打开 `index.html` 即可。

## 本地真实运行

如果你想让持仓、自选、反馈真正落到后端，而不是只存在浏览器里：

1. 打开 `scripts/start-backend.cmd`
2. 保持后端窗口不要关闭
3. 再打开前端页面
4. 页面右上区域会显示 `后端在线`

## 自动推送 GitHub

本机已经安装了 `GitHub CLI`，但还需要先登录一次：

```bash
"C:\Program Files\GitHub CLI\gh.exe" auth login
```

登录完成后，可以用下面的脚本一键提交并推送：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\publish-github.ps1
```

如果想自定义提交信息：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\publish-github.ps1 -Message "your message"
```

## 最简单免费上线

这版最适合先部署到 `Vercel`，不用买服务器，不用先学后端。

### 你需要准备

1. 一个 `GitHub` 账号
2. 一个 `Vercel` 账号
3. 当前这个项目目录

### 第一步：上传到 GitHub

如果你还没装 GitHub Desktop，也可以直接用网页新建仓库后上传文件。

建议仓库名：

- `risk-radar`
- `stock-risk-radar`
- `fengkong-leida`

### 第二步：导入到 Vercel

1. 打开 [https://vercel.com](https://vercel.com)
2. 用 GitHub 账号登录
3. 点击 `Add New...`
4. 选择 `Project`
5. 选择你刚上传的 GitHub 仓库
6. 直接点 `Deploy`

这套项目是纯静态页面，`Vercel` 一般会自动识别，不需要你配 Node 服务。

### 第三步：拿到公网链接

部署完成后，Vercel 会给你一个地址，通常像这样：

`https://your-project-name.vercel.app`

这个地址手机可以直接打开。

### 第四步：手机使用

1. 在手机浏览器打开你的 `vercel.app` 链接
2. 如果你想让它更像 App：
3. iPhone 用 Safari 打开后，点“添加到主屏幕”
4. 安卓浏览器通常也有“添加到主屏幕”

这样它就会像一个轻量 App 一样放在桌面上。

## 现在不需要做的事

先不要急着做这些：

- 不要先买云服务器
- 不要先做复杂登录系统
- 不要先做实时推送
- 不要先做 token 计费
- 不要先接真实行情接口

第一步目标只有一个：

让它变成一个别人能打开的网址，然后观察是否真的有人愿意用。

## 下一阶段

如果有人开始持续使用，再接：

1. `Supabase`：保存用户数据
2. 实时预警服务：做定时扫描或推送
3. `Cloudflare`：接入域名和防护
