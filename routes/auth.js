const Router = require('koa-router')
const User = require('../models/user.model')
const { BusinessError } = require('../middlewares/errorHandler')
const errorCode = require('../utils/errorCode')
const { jwtSecret, jwtExpiresIn } = require('../config/auth')
const jwt = require('jsonwebtoken')
const Role = require('../models/role.model')
const TokenBlacklist = require('../models/tokenBlacklist.model')

const router = new Router({ prefix: '/api/auth' })

// 用户注册
router.post('/register', async ctx => {
    const { username, password, email } = ctx.request.body

    // 基本参数校验
    if (!username || !password) {
        throw BusinessError(errorCode.PARAM_ERROR, '用户名和密码不能为空')
    }

    // 检查用户名是否已存在
    const exists = await User.findOne({ where: { username } })
    if (exists) {
        throw BusinessError(errorCode.PARAM_ERROR, '用户名已被注册')
    }

    // 创建用户
    const user = await User.create({
        username,
        password,
        email,
        role: 'user'
    })

    ctx.success({ id: user.id }, '注册成功')
})

// 用户登录
router.post('/login', async ctx => {
    const { username, password } = ctx.request.body

    if (!username || !password) {
        throw BusinessError(errorCode.PARAM_ERROR, '用户名和密码不能为空')
    }

    // 查找用户
    const user = await User.findOne({ where: { username } })
    if (!user) {
        throw BusinessError(errorCode.AUTH_FAILED, '用户不存在')
    }

    // 验证密码
    const isValid = await user.validPassword(password)
    if (!isValid) {
        throw BusinessError(errorCode.AUTH_FAILED, '密码错误')
    }

    // 获取用户所有角色
    const userWithRoles = await User.findByPk(user.id, {
        include: {
            model: Role,
            through: { attributes: [] } // 不返回关联表字段
        }
    })

    // 签发JWT
    const token = jwt.sign(
        {
            userId: user.id
        },
        jwtSecret,
        { expiresIn: jwtExpiresIn }
    )

    // 更新最后登录时间
    await user.update({ last_login: new Date() })

    ctx.success({
        userId: user.id,
        username: user.username,
        roles: userWithRoles.roles.map(role => {
            return {
                id: role.id,
                name: role.name,
            }
        }),
        token: `Bearer ${token}`
    }, '登录成功')
})
router.post('/logout', async ctx => {
    const token = ctx.headers.authorization?.replace(/^Bearer\s+/i, '')
    if (!token) return ctx.success(null, '登出成功')

    try {
        const decoded = jwt.verify(token, jwtSecret)
        await TokenBlacklist.create({
            token,
            expiration: new Date(decoded.exp * 1000),
            userId: decoded.userId
        })
    } catch (err) {
        console.error('注销时记录黑名单失败:', err)
    }

    ctx.success(null, '登出成功')
})

module.exports = router 