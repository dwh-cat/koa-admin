if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
require('./models') // 加载所有模型及其关联关系
const Koa = require('koa')
const sequelize = require('./config/db')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')
const cors = require('@koa/cors')
const responseFormatter = require('./middlewares/responseFormatter')
const { errorHandler } = require('./middlewares/errorHandler')
const authRouter = require('./routes/auth')
const usersRouter = require('./routes/users')
const roleRouter = require('./routes/role')
const permissionRouter = require('./routes/permission')
const menuRouter = require('./routes/menu')
// error handler
onerror(app)
// 添加 CORS 中间件配置
app.use(cors({
  origin: ctx => {
    // 在开发环境下允许所有来源
    if (process.env.NODE_ENV !== 'production') {
      return '*'
    }
    // 在生产环境下只允许特定域名
    const whitelist = process.env.CORS_WHITELIST 
      ? process.env.CORS_WHITELIST.split(',') 
      : ['http://localhost:3000']
    const requestOrigin = ctx.get('Origin')
    return whitelist.includes(requestOrigin) ? requestOrigin : false
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'],
  maxAge: 5 * 60 // 预检请求缓存5分钟
}))
// middlewares
app.use(bodyparser({
  enableTypes: ['json', 'form', 'text']
}))
app.use(json())
app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))

app.use(views(__dirname + '/views', {
  extension: 'pug'
}))

// 中间件顺序很重要
app.use(errorHandler())
app.use(responseFormatter)


// logger
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})
// routes
app.use(authRouter.routes())
app.use(usersRouter.routes())
app.use(roleRouter.routes())
app.use(permissionRouter.routes())
app.use(menuRouter.routes())

// 添加启动信息打印函数
function printStartupInfo() {
  const env = process.env.NODE_ENV || 'development'
  const port = process.env.APP_PORT || 3000
  const dbStatus = sequelize.config ? 'Connected' : 'Disconnected'

  console.log(`
\x1b[32m
===============================================
    🚀 后台管理系统服务已启动!
===============================================
\x1b[0m
环境模式:    \x1b[33m${env}\x1b[0m
监听端口:    \x1b[36m${port}\x1b[0m
数据库状态:  \x1b[${dbStatus === 'Connected' ? '32' : '31'}m${dbStatus}\x1b[0m
启动时间:    \x1b[35m${new Date().toLocaleString()}\x1b[0m


\x1b[34m[开发工具]\x1b[0m
API文档:     \x1b[36mhttp://localhost:${port}/swagger\x1b[0m
数据库配置:  ${JSON.stringify({
    host: sequelize.config.host,
    port: sequelize.config.port,
    database: sequelize.config.database
  }, null, 2)}
`)
}

// 在数据库连接成功后启动服务
sequelize.authenticate()
  .then(() => {
    app.listen(process.env.APP_PORT, () => {
      printStartupInfo()
    })
  })
  .catch(err => {
    console.error('\x1b[31m[启动失败] 数据库连接异常:\x1b[0m', err)
    process.exit(1)
  })

module.exports = app
