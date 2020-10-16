const os = require('os')
const path = require('path')
const sftp = require('ssh2-sftp-client')
const { execSync } = require('child_process')
const { red, green } = require('ansi-colors')

class Build {
  constructor() {
    const packageJson = require(path.join(process.cwd(), 'package.json'))
    const releaseConfig = packageJson && packageJson.release
    if (!releaseConfig) {
      throw(new Error(red('没有在package.json找到release配置项！')))
    }
    // 操作系统类型
    this.systemType = os.type()
    // 命令执行参数
    this.execParams = {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: 'inherit'
    }

    // windows操作系统打包命令
    this.windowsOrder = (typeof releaseConfig.order === 'object' ? releaseConfig.order.windows : releaseConfig.order)
      || 'node -max_old_space_size=4096 \"node_modules\\@angular\\cli\\bin\\umi\" build'
    // linux或mac操作系统打包命令
    this.maxOrLinuxOrder = (typeof releaseConfig.order === 'object' ? releaseConfig.order.maxOrLinux : releaseConfig.order)
      || 'node --max_old_space_size=4096 ./node_modules/.bin/umi build'
    
    // ftp服务
    this.client = new sftp()
    // 远程服务配置
    this.clientConfig = {
      host: releaseConfig.host,
      port: releaseConfig.port || '22',
      username: releaseConfig.username,
      password: releaseConfig.password
    }
    // 本地打包地址
    this.buildUrl = releaseConfig.buildUrl || './dist'
    // 远程前端文件地址
    this.serverUrl = releaseConfig.serverUrl
    if (!releaseConfig.serverUrl || !Object.keys(releaseConfig.serverUrl)) {
      throw(new Error(red('没有在package.json的release配置项中找到前端远程文件地址！')))
    }
  }

  /**
   * 连接远程服务器
   */
  connect() {
    // 当前环境类型
    const envType = Array.from(process.argv)[1]
    // 连接服务器
    this.client.connect(this.clientConfig)
    .then(() => {
      return this.client.exists(this.serverUrl[envType])
    })
    .then((exist) =>{
      if (exist) {
        console.log(green('清空服务器前端文件夹...'))
        return this.client.rmdir(this.serverUrl[envType], true)
      } else {
        return Promise.resolve(false)
      }
    })
    .then((status) =>{
      if (status) {
        console.log(green('服务器前端文件夹清空完成！'))
      }
      console.log(green('开始上传服务器...'))
      return this.client.uploadDir(this.buildUrl, this.serverUrl[envType])
    })
    .then(() =>{
      console.log(green('服务器上传完成！'))
      this.client.end()
    })
    .catch((err) => {
      console.log(red(err))
      this.client.end()
    })
  }

  /**
   * 运行
   */
  start() {
    console.log(green('安装模块包...'))
    execSync('npm install', this.execParams)
    console.log(green('安装完成！'))
    console.log(green('开始打包...'))
    if (this.systemType === 'Windows_NT') {
      // windows系统
      execSync(this.windowsOrder, this.execParams)
    } else {
      // linux或mac操作系统
      execSync(this.maxOrLinuxOrder, this.execParams)
    }
    console.log(green('打包完成！'))
    this.connect()
  }
}

const build = new Build()
build.start()
