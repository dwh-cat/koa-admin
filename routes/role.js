const Router = require('koa-router')
const { BusinessError } = require('../middlewares/errorHandler')
const errorCode = require('../utils/errorCode')
const Role = require('../models/role.model')
const Permission = require('../models/permission.model')
const { Op } = require('sequelize')
const auth = require('../middlewares/auth')
const router = new Router({ prefix: '/api/roles' })
const authorize = require('../middlewares/authorize')
// 创建角色（需要角色管理权限）
router.post('/create',auth(), authorize(['role:create']), async ctx => {
    const { name, description, permissionIds } = ctx.request.body

    if (!name) {
        throw BusinessError(errorCode.PARAM_ERROR, '角色名称不能为空')
    }

    const exists = await Role.findOne({ where: { name } })
    if (exists) {
        throw BusinessError(errorCode.PARAM_ERROR, '角色名称已存在')
    }

    const role = await Role.create({
        name,
        description: description || ''
    })

    if (permissionIds?.length) {
        await role.setPermissions(permissionIds)
    }

    ctx.success(role.get({ plain: true }), '角色创建成功')
})
// 获取角色列表（需要角色查看权限）
router.get('/list',auth(), authorize(['role:read']), async ctx => {
    const { page = 1, pageSize = 10, search } = ctx.query

    const where = {}
    if (search) {
        where[Op.or] = [
            { name: { [Op.like]: `%${search}%` } },
            { description: { [Op.like]: `%${search}%` } }
        ]
    }

    const { count, rows } = await Role.findAndCountAll({
        where,
        limit: Number(pageSize),
        offset: (page - 1) * pageSize,
        order: [['created_at', 'DESC']],
        include: [Permission]
    })

    ctx.success({
        total: count,
        list: rows.map(r => ({
            ...r.get({ plain: true }),
            permissions: r.permissions.map(p => ({id:p.id,code:p.code}))
        }))
    })
})

// 更新角色（需要角色更新权限）
router.put('/update',auth(), authorize(['role:update']), async ctx => {
    const { roleId, name, description, permissionIds } = ctx.request.body

    if (!roleId) {
        throw BusinessError(errorCode.PARAM_ERROR, '角色ID不能为空')
    }

    const role = await Role.findByPk(roleId)
    if (!role) {
        throw BusinessError(errorCode.NOT_FOUND, '角色不存在')
    }

    if (name && name !== role.name) {
        const exists = await Role.findOne({ where: { name } })
        if (exists) {
            throw BusinessError(errorCode.PARAM_ERROR, '角色名称已存在')
        }
        role.name = name
    }

    if (description !== undefined) {
        role.description = description
    }

    if (permissionIds) {
        await role.setPermissions(permissionIds)
    }

    await role.save()
    ctx.success(role.get({ plain: true }), '角色更新成功')
})

// 删除角色（需要角色删除权限）
router.delete('/delete',auth(), authorize(['role:delete']), async ctx => {
    const { roleId } = ctx.request.body

    if (!roleId) {
        throw BusinessError(errorCode.PARAM_ERROR, '角色ID不能为空')
    }

    const role = await Role.findByPk(roleId)
    if (!role) {
        throw BusinessError(errorCode.NOT_FOUND, '角色不存在')
    }

    // 检查是否有用户关联
    const userCount = await role.countUsers()
    if (userCount > 0) {
        throw BusinessError(errorCode.FORBIDDEN, '存在关联用户，无法删除')
    }

    await role.destroy({force:true})
    ctx.success(null, '角色删除成功')
})
// 分配菜单（需要角色管理权限）
router.post('/assign-menus', auth(), authorize(['role:manage']), async ctx => {
    const { roleId, menuIds } = ctx.request.body

    if (!roleId || !menuIds) {
        throw BusinessError(errorCode.PARAM_ERROR, '角色ID和菜单列表不能为空')
    }

    const role = await Role.findByPk(roleId)
    if (!role) {
        throw BusinessError(errorCode.NOT_FOUND, '角色不存在')
    }

    // 确保 menuIds 是数组
    const menuIdArray = (Array.isArray(menuIds) ? menuIds : [menuIds])
        .map(id => Number(id))

    // 验证菜单是否存在
    const menus = await Menu.findAll({
        where: {
            id: { [Op.in]: menuIdArray }
        }
    })

    if (menus.length !== menuIdArray.length) {
        throw BusinessError(errorCode.PARAM_ERROR, '包含无效的菜单ID')
    }

    // 设置角色菜单关联
    await role.setMenus(menuIdArray)

    ctx.success({
        ...role.get({ plain: true }),
        menuIds: menuIdArray
    }, '菜单分配成功')
})
module.exports = router 