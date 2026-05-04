# Koa + EJS 项目

这是一个使用 Koa 框架、EJS 模板引擎和静态资源服务的 Node.js Web 应用程序。

## 项目结构

```
fbs/
├── index.js              # 应用入口文件
├── package.json          # 项目配置文件
├── views/                # EJS 模板目录
│   ├── index.ejs        # 首页模板
│   └── about.ejs        # 关于页面模板
└── public/              # 静态资源目录
    ├── css/
    │   └── style.css    # 样式文件
    ├── js/
    │   └── main.js      # JavaScript 文件
    └── images/          # 图片目录
```

## 设置nodejs环境变量
- 把 node20 的路径拷贝, 设置nodejs的环境变量


## 安装依赖
当前项目根目录运行
```bash
npm install
```

## 运行项目

```bash
# 启动服务器
npm start

# 或使用开发模式
npm run dev
```

服务器将在 http://localhost 启动。



## 仿真环境
```bash
sudo vim /etc/hosts    
```

```
127.0.0.1       adsmanager.facebook.com
```

```bash 
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
```

**如果修改了hosts文件，同时开着翻墙，会出现打不开页面的错误**

- 重启浏览器，或者无痕浏览，用Safari打开(Google Chrome会显示不安全的提示)


**如果修改了hosts文件，同时开着翻墙，会出现打不开页面的错误， 关闭翻墙软件即可**