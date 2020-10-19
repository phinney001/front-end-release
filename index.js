const path = require('path')
const sftp = require('ssh2-sftp-client')
const compressing = require('compressing')
const { execSync } = require('child_process')
const { red, green } = require('ansi-colors')

class Build {
  constructor() {
    const packageJson = require(path.join(process.cwd(), 'package.json'))
    if (!(packageJson && packageJson.release)) {
      throw(new Error(red('没有在package.json找到release配置项！')))
    }
    // 当前环境类型
    const envType = Array.from(process.argv)[2]
    // 当前环境配置
    this.config = envType ? packageJson.release[envType] : packageJson.release
    if (envType && !this.config) {
      throw(new Error(red(`没有在release中找到${envType}！`)))
    }
    // 命令执行参数
    this.execParams = {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: 'inherit'
    }

    // 打包命令
    this.buildOrder = this.config.buildOrder
      || `node -max_old_space_size=4096 "${path.join(process.cwd(), './node_modules/umi/bin/umi.js')}" build`
    
    // ftp服务
    this.client = new sftp()
    // 远程服务配置
    this.clientConfig = {
      host: this.config.host,
      port: this.config.port || '22',
      username: this.config.username,
      password: this.config.password || ''
    }
    if (!this.config.host) {
      throw(new Error(red('没有在release配置项中找到host！')))
    }
    if (!this.config.username) {
      throw(new Error(red('没有在release配置项中找到username！')))
    }
    // 本地打包地址
    this.buildUrl = this.config.buildUrl || './dist'
    // 远程前端文件地址
    this.serverUrl = this.config.serverUrl
    if (!this.config.serverUrl) {
      throw(new Error(red('没有在release配置项中找到serverUrl！')))
    }
    // 远程命令
    this.serverOrder = this.config.serverOrder
  }

  /**
   * 连接远程服务器-上传文件
   */
  connect() {
    // 连接服务器
    this.client.connect(this.clientConfig)
    .then(() => {
      return this.client.exists(this.serverUrl)
    })
    .then((exist) =>{
      if (exist) {
        console.log(green('清空服务器前端文件夹...'))
        return this.client.rmdir(this.serverUrl, true)
      } else {
        return Promise.resolve(false)
      }
    })
    .then((status) =>{
      if (status) {
        console.log(green('服务器前端文件夹清空完成！'))
      }
      console.log(green('开始上传服务器...'))
      return this.client.uploadDir(this.buildUrl, this.serverUrl)
    })
    .then(() =>{
      console.log(green('服务器上传完成！'))
      this.client.end()
    })
    .catch((err) => {
      this.client.end()
      throw(new Error(red(err)))
    })
  }

  /**
   * 连接远程服务器-执行命令
   */
  connectOrder() {
    const localZipUrl = `${this.buildUrl}.zip`
    const serverZipUrl = this.serverUrl + (localZipUrl.startsWith('.') ? localZipUrl.substr(1) : localZipUrl)
    console.log(green('打包目录压缩中...'))
    compressing.zip.compressDir(this.buildUrl, localZipUrl)
    .then(() => {
      console.log(green('打包目录压缩成功！'))
      // 连接服务器
      return this.client.connect(this.clientConfig)
    })
    .then(() =>{
      console.log(green('开始上传服务器...'))
      return this.client.fastPut(path.join(process.cwd(), localZipUrl), serverZipUrl)
    })
    .then(() =>{
      console.log(green('服务器上传完成！'))
      console.log(green('命令执行中...'))
      return new Promise((resolve, reject) => {
        this.client.client.exec(`cd ${this.serverUrl}\n${this.serverOrder}`, (err, stream) => {
          if (err) reject(err)
          stream.on('close', () => {
            resolve(true)
          }).on('data', () => {
          }).stderr.on('data', (data) => {
            reject(data)
          })
        })
      })
    })
    .then(() => {
      console.log(green('命令执行完成！'))
      this.client.end()
    })
    .catch((err) => {
      this.client.end()
      throw(new Error(red(err)))
    })
  }

  /**
   * 运行
   */
  start() {
    // 是否跳过安装模块包
    if (!this.config.skipInstall) {
      console.log(green('开始安装模块包...'))
      execSync('npm install', this.execParams)
      console.log(green('安装完成！'))
    }

    // 是否跳过打包
    if (!this.config.skipBuild) {
      console.log(green('开始打包...'))
      execSync(this.buildOrder, this.execParams)
      console.log(green('打包完成！'))
    }

    // 是否执行服务端命令
    if (this.serverUrl && this.serverOrder) {
      this.connectOrder()
    } else {
      this.connect()
    }
  }
}

const build = new Build()
build.start()
