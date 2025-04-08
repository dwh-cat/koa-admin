const errorCode = require('../utils/errorCode')

module.exports = async (ctx, next) => {
    // 成功响应方法
    ctx.success = (data, message) => {
        ctx.type = 'json'
        ctx.body = {
            code: errorCode.SUCCESS,
            message: message || '操作成功',
            data: data || null
        }
    }

    // 错误响应方法
    ctx.error = (errCode, message, details) => {
        ctx.type = 'json'
        ctx.body = {
            code: errCode,
            message: message,
            data: details || null
        }
    }

    await next()
} 