const jwt = require('jsonwebtoken')
const { BusinessError } = require('./errorHandler')
const errorCode = require('../utils/errorCode')
const { jwtSecret } = require('../config/auth')
const TokenBlacklist = require('../models/tokenBlacklist.model')

module.exports = (options = {}) => {
    return async (ctx, next) => {
        // 排除不需要认证的路径
        const excludePaths = options.excludePaths || ['/api/auth/login', '/api/auth/register']
        if (excludePaths.includes(ctx.path)) {
            return next()
        }

        const authHeader = ctx.headers.authorization
        if (!authHeader) {
            throw BusinessError(errorCode.AUTH_FAILED, '缺少Authorization头')
        }

        // 更健壮的token提取方式
        const token = authHeader.replace(/^Bearer\s+/i, '')
        if (!token) {
            throw BusinessError(errorCode.AUTH_FAILED, '令牌格式错误')
        }
        console.log(token)
        let decoded=null
        // 验证令牌有效性
        try {
            decoded = jwt.verify(token, jwtSecret) 
        } catch (err) {
            console.log(err)
            throw BusinessError(errorCode.AUTH_FAILED, '令牌无效') 
        }

        // 检查黑名单
        const isBlacklisted = await TokenBlacklist.findOne({ where: { token } })
        if (isBlacklisted) {
            throw BusinessError(errorCode.AUTH_FAILED, '令牌已失效')
        }

        // 验证用户信息结构
        if (!decoded.userId || typeof decoded.userId !== 'number') {
            throw BusinessError(errorCode.AUTH_FAILED, '无效的用户标识')
        }

        ctx.state.user = decoded
        await next()
    }
} 