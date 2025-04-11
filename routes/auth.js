const Router = require('koa-router')
const User = require('../models/user.model')
const { BusinessError } = require('../middlewares/errorHandler')
const errorCode = require('../utils/errorCode')
const { jwtSecret, jwtExpiresIn } = require('../config/auth')
const jwt = require('jsonwebtoken')
const Role = require('../models/role.model')
const TokenBlacklist = require('../models/tokenBlacklist.model')
const { Op } = require('sequelize')
const router = new Router({ prefix: '/api/auth' })
const auth = require('../middlewares/auth')
const Menu = require('../models/menu.model')
// 用户注册
router.post('/register', async ctx => {
    const { username, password, email, phone } = ctx.request.body

    // 基本参数校验
    if (!username || !password) {
        throw BusinessError(errorCode.PARAM_ERROR, '用户名和密码不能为空')
    }

    // 检查用户名是否已存在
    const exists = await User.findOne({ 
        where: { 
            [Op.or]: [
                { username },
                ...(email ? [{ email }] : []),
                ...(phone ? [{ phone }] : [])
            ]
        } 
    })

    if (exists) {
        if (exists.username === username) {
            throw BusinessError(errorCode.PARAM_ERROR, '用户名已被注册')
        }
        if (email && exists.email === email) {
            throw BusinessError(errorCode.PARAM_ERROR, '邮箱已被注册')
        }
        if (phone && exists.phone === phone) {
            throw BusinessError(errorCode.PARAM_ERROR, '手机号已被注册')
        }
    }

    // 创建用户
    const user = await User.create({
        username,
        password,
        email,
        phone,
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
// 获取当前登录用户信息
router.get('/userinfo', auth(), async ctx => {
    const userId = ctx.state.user.userId

    const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] },
        include: [{
            model: Role,
            through: { attributes: [] },
            include: [{
                model: Menu,
                through: { attributes: [] },
                attributes: ['id', 'name', 'path', 'component', 'icon']
            }]
        }]
    })

    if (!user) {
        throw BusinessError(errorCode.NOT_FOUND, '用户不存在')
    }

    // 构建用户信息响应
    const userInfo = {
        ...user.filterSafeFields(),
        roles: user.roles.map(role => ({
            id: role.id,
            name: role.name,
            code: role.code,
            description: role.description
        }))
    }

    ctx.success(userInfo, '获取用户信息成功')
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
//获取用户的菜单树
router.get('/menus', auth(), async ctx => {
    const userId = ctx.state.user.userId
    
    // 获取用户及其角色信息
    const user = await User.findByPk(userId, {
        include: [{
            model: Role,
            include: [{
                model: Menu,
                through: { attributes: [] },
                order: [['sort', 'ASC']],
                attributes: ['id', 'parent_id', 'name', 'path', 'component', 'icon', 'sort','title','closable','cache','guard','badge','dot','hidden']
            }]
        }]
    })

    if (!user) {
        throw BusinessError(errorCode.NOT_FOUND, '用户不存在')
    }

    let menus = []
    // 检查是否为超级管理员
    const isSuperAdmin = user.roles.some(role => role.name === 'superadmin')

    if (isSuperAdmin) {
        // 超级管理员获取所有菜单
        menus = await Menu.findAll({
            order: [['sort', 'ASC']],
            attributes: ['id', 'parent_id', 'name', 'path', 'component', 'icon', 'sort','title','closable','cache','guard','badge','dot','hidden']
        })
    } else {
        // 普通用户获取角色关联的菜单
        const menuSet = new Set()
        user.roles.forEach(role => {
            role.menus.forEach(menu => {
                if (!menuSet.has(menu.id)) {
                    menuSet.add(menu.id)
                    menus.push(menu)
                }
            })
        })
    }

    // 构建菜单树
    const buildMenuTree = (items, parentId = 0) => {
        console.log(items)
        return items
            .filter(item => item.parent_id === parentId)
            .map(item => ({
                
                path: item.path,
                name: item.name,
                component: item.component,
                meta: {
                    title: item.title,
                    icon: item.icon,
                    noClosable: !item.closable,
                    noKeepAlive: !item.cache,
                },
                children: buildMenuTree(items, item.id)
            }))
            .filter(item => item.children.length > 0 || item.component)
    }

    const menuTree = buildMenuTree(menus.map(m => m.get ? m.get({ plain: true }) : m))
    ctx.success(menuTree, '获取菜单成功')
})

module.exports = router 