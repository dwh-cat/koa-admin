const Router = require('koa-router')
const authorize = require('../middlewares/authorize')
const { BusinessError } = require('../middlewares/errorHandler')
const errorCode = require('../utils/errorCode')
const Permission = require('../models/permission.model')
const { Op } = require('sequelize')
const auth = require('../middlewares/auth')

const router = new Router({ prefix: '/api/permissions' })

// 创建权限（需要权限管理权限）
router.post('/create', auth(), authorize(['permission:create']), async ctx => {
    const { code, name, type, description, data_scope, action } = ctx.request.body

    if (!code || !name || !type) {
        throw BusinessError(errorCode.PARAM_ERROR, '权限编码、名称和类型不能为空')
    }

    const exists = await Permission.findOne({ where: { code } })
    if (exists) {
        throw BusinessError(errorCode.PARAM_ERROR, '权限编码已存在')
    }

    const permission = await Permission.create({
        code, name, type, description, data_scope, action
    })

    ctx.success(permission.get({ plain: true }), '权限创建成功')
})

// 获取权限列表（需要权限查看权限）
router.get('/list', auth(), authorize(['permission:read']), async ctx => {
    const { page = 1, pageSize = 10, search, type } = ctx.query

    const where = {}
    if (search) {
        where[Op.or] = [
            { code: { [Op.like]: `%${search}%` } },
            { name: { [Op.like]: `%${search}%` } }
        ]
    }
    if (type) {
        where.type = type
    }

    const { count, rows } = await Permission.findAndCountAll({
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

// 更新权限（需要权限更新权限）
router.put('/update', auth(), authorize(['permission:update']), async ctx => {
    const { id, code, name, type, description, data_scope, action } = ctx.request.body

    if (!id) {
        throw BusinessError(errorCode.PARAM_ERROR, '权限ID不能为空')
    }

    const permission = await Permission.findByPk(id)
    if (!permission) {
        throw BusinessError(errorCode.NOT_FOUND, '权限不存在')
    }

    if (code && code !== permission.code) {
        const exists = await Permission.findOne({ where: { code } })
        if (exists) {
            throw BusinessError(errorCode.PARAM_ERROR, '权限编码已存在')
        }
    }

    // 更新字段
    const fields = { code, name, type, description, data_scope, action }
    for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined) {
            permission[key] = value
        }
    }

    await permission.save()
    ctx.success(permission.get({ plain: true }), '权限更新成功')
})

// 删除权限（需要权限删除权限）
router.delete('/delete', auth(), authorize(['permission:delete']), async ctx => {
    const { id } = ctx.request.body

    if (!id) {
        throw BusinessError(errorCode.PARAM_ERROR, '权限ID不能为空')
    }

    const permission = await Permission.findByPk(id)
    if (!permission) {
        throw BusinessError(errorCode.NOT_FOUND, '权限不存在')
    }

    // 检查是否有角色关联
    const roleCount = await permission.countRoles()
    if (roleCount > 0) {
        throw BusinessError(errorCode.FORBIDDEN, '存在关联角色，无法删除')
    }

    await permission.destroy({ force: true })
    ctx.success(null, '权限删除成功')
})

module.exports = router