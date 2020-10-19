# front-end-release
前端打包发布

## 第一步
```javascript
npm install front-end-release -g
```
## 第二步
在package.json文件添加：
```javascript
"release": {
  "host": "127.0.0.1",                                        // 服务器地址
  "port": "22",                                               // 服务器端口，默认22
  "username": "username",                                     // 服务器用户名
  "password": "password",                                     // 服务器密码，默认为空
  "skipInstall": true,                                        // 本次发布是否不npm intall，默认false
  "skipBuild": true,                                          // 本次发布是否不打包，默认false
  "buildOrder": "npm run build",                              // 打包命令
  "buildUrl": "./dist",                                       // 前端本地打包目录地址，默认'./dist'
  "serverUrl": "/home/dev",                                   // 服务器前端文件/脚本执行目录地址
  "serverOrder": "sudo /home/dev/auto_deploy_front.sh",       // 服务器脚本执行，与serverUrl同时存在时，会先把打包目录打包成zip，上传到serverUrl并执行此命令
},
```
或者
```javascript
"release": {
  "dev": {
    "host": "127.0.0.1",
    "username": "username",
    "password": "password",
    "serverUrl": "/home/dev",
  },
  ...
},
```
## 第三步
在项目目录中运行
```bash
release
```
或者
```bash
release dev
```