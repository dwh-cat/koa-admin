const Router = require('koa-router')
const authorize = require('../middlewares/authorize')
const { BusinessError } = require('../middlewares/errorHandler')
const errorCode = require('../utils/errorCode')
const User = require('../models/user.model')
const bcrypt = require('bcryptjs')
const { Op } = require('sequelize')
const Role = require('../models/role.model')
const auth = require('../middlewares/auth')
const Menu = require('../models/menu.model')
const router = new Router({ prefix: '/api/users' })
// 在用户模型中添加安全字段过滤方法
User.prototype.filterSafeFields = function () {
    const { password, deleted_at, ...safeFields } = this.get({ plain: true })
    return safeFields
}

// 获取用户列表（需要用户管理权限）
router.get('/list', auth(), authorize(['user:read']), async ctx => {
    const { page = 1, pageSize = 10, search } = ctx.query

    const where = {}
    if (search) {
        where[Op.or] = [
            { username: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } }
        ]
    }

    const { count, rows } = await User.findAndCountAll({
        attributes: { exclude: ['password'] },
        where,
        limit: Number(pageSize),
        offset: (page - 1) * pageSize,
        order: [['created_at', 'DESC']]
    })

    ctx.success({
        total: count,
        list: rows
    })
})

// 创建用户（需要用户创建权限）
router.post('/create', auth(), authorize(['user:create']), async ctx => {
    const { username, password, email, roleIds } = ctx.request.body

    // 基础参数校验
    if (!username || !password) {
        throw BusinessError(errorCode.PARAM_ERROR, '用户名和密码不能为空')
    }

    // 检查用户名是否已存在
    const exists = await User.findOne({ where: { username } })
    if (exists) {
        throw BusinessError(errorCode.PARAM_ERROR, '用户名已被使用')
    }

    // 创建用户
    const user = await User.create({
        username,
        password,
        email,
        status: 1
    })

    // 分配角色（需要角色管理权限）
    if (roleIds && roleIds.length > 0) {
        await user.setRoles(roleIds)
    }

    ctx.success(user.filterSafeFields(), '用户创建成功')
})

// 更新用户信息（需要用户更新权限）
router.put('/update', auth(), authorize(['user:update']), async ctx => {
    const { userId, ...updateData } = ctx.request.body

    if (!userId) {
        throw BusinessError(errorCode.PARAM_ERROR, '用户ID不能为空')
    }

    const user = await User.findByPk(userId)
    if (!user) {
        throw BusinessError(errorCode.NOT_FOUND, '用户不存在')
    }

    // 更新基本信息
    if (updateData.email) user.email = updateData.email
    if (updateData.status) user.status = updateData.status
    if (updateData.username) user.username = updateData.username
    if (updateData.nickname) user.nickname = updateData.nickname
    if (updateData.avatar) user.avatar = updateData.avatar
    if (updateData.phone) user.phone = updateData.phone
    if (updateData.password) {
        user.password = await bcrypt.hash(updateData.password, 10)
    }

    // 更新角色（需要角色管理权限）
    if (updateData.roleIds) {
        await user.setRoles(updateData.roleIds)
    }

    await user.save()
    ctx.success(user.filterSafeFields(), '用户更新成功')
})

// 删除用户（需要用户删除权限）
router.delete('/delete', auth(), authorize(['user:delete']), async ctx => {
    const { userId } = ctx.request.body

    if (!userId) {
        throw BusinessError(errorCode.PARAM_ERROR, '用户ID不能为空')
    }

    const user = await User.findByPk(userId)
    if (!user) {
        throw BusinessError(errorCode.NOT_FOUND, '用户不存在')
    }

    // 软删除用户
    await user.destroy()
    ctx.success(null, '用户已删除')
})

// 获取单个用户详情
router.get('/detail', auth(), authorize(['user:read']), async ctx => {
    const { userId } = ctx.query

    if (!userId) {
        throw BusinessError(errorCode.PARAM_ERROR, '用户ID不能为空')
    }

    const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] },
        include: ['roles']
    })

    if (!user) {
        throw BusinessError(errorCode.NOT_FOUND, '用户不存在')
    }

    ctx.success(user,'获取成功')
})

// 分配角色给用户（需要用户管理或角色管理权限）
router.post('/assign-roles',auth(), authorize(['user:manage', 'role:manage']), async ctx => {
    const { userId, roleIds } = ctx.request.body

    if (!userId || !roleIds) {
        throw BusinessError(errorCode.PARAM_ERROR, '用户ID和角色列表不能为空')
    }

    const user = await User.findByPk(userId, {
        include: [Role]
    })
    if (!user) {
        throw BusinessError(errorCode.NOT_FOUND, '用户不存在')
    }

    // 验证角色是否存在
    const roles = await Role.findAll({
        where: { id: roleIds }
    })
    if (roles.length !== roleIds.length) {
        throw BusinessError(errorCode.PARAM_ERROR, '包含无效的角色ID')
    }

    await user.setRoles(roleIds)

    ctx.success({
        ...user.filterSafeFields(),
        roles: roleIds
    }, '角色分配成功')
})

// 管理员重置用户密码（需要用户管理权限）
router.post('/reset-password', auth(), authorize(['user:manage']), async ctx => {
    const { userId } = ctx.request.body

    if (!userId) {
        throw BusinessError(errorCode.PARAM_ERROR, '用户ID不能为空')
    }

    const user = await User.findByPk(userId)
    if (!user) {
        throw BusinessError(errorCode.NOT_FOUND, '用户不存在')
    }

    // 加密新密码并更新
    user.password = await bcrypt.hash('123456', 10)
    await user.save()

    ctx.success(null, '密码重置成功')
})

module.exports = router