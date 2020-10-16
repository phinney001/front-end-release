# front-end-release
前端打包发布

## 第一步
```javascript
npm install ng-environment-setup -g
```
## 第二步
在package.json文件添加：
```json
"release": {
  "host": "127.0.0.1",      // 服务器地址
  "port": "22",             // 服务器端口，默认22
  "username": "username",   // 服务器用户名
  "password": "password",   // 服务器密码，默认为空
  "skipInstall": true,      // 本次发布是否不npm intall，默认false
  "skipBuild": true,        // 本次发布是否不打包，默认false
  "buildUrl": "./dist",     // 前端本地打包目录地址，默认'./dist'
  "serverUrl": "/home/dev", // 服务器前端文件目录地址
},
```
或者
```json
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
```bash
在项目目录中运行release或者release dev
```