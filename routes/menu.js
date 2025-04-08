const Router = require('koa-router')
const authorize = require('../middlewares/authorize')
const { BusinessError } = require('../middlewares/errorHandler')
const errorCode = require('../utils/errorCode')
const Menu = require('../models/menu.model')
const { Op } = require('sequelize')
const auth = require('../middlewares/auth')

const router = new Router({ prefix: '/api/menus' })

// 创建菜单
router.post('/create', auth(), authorize(['menu:create']), async ctx => {
    const { name, path, component, redirect, title, icon, badge, dot, 
            closable, cache, sort, parent_id, hidden } = ctx.request.body
    console.log(name, path, component, redirect, title, icon, badge, dot,
            closable, cache, sort, parent_id, hidden)
    if (!name || !path || !component) {
        throw BusinessError(errorCode.PARAM_ERROR, '菜单名称、路径和组件不能为空')
    }

    const exists = await Menu.findOne({ where: { path } })
    if (exists) {
        throw BusinessError(errorCode.PARAM_ERROR, '菜单路径已存在')
    }

    const menu = await Menu.create({
        name, path, component, redirect, title, icon, badge, 
        dot, closable, cache, sort, parent_id, hidden
    })

    ctx.success(menu.get({ plain: true }), '菜单创建成功')
})

// 获取菜单列表
router.get('/list', auth(), authorize(['menu:read']), async ctx => {
    const { search } = ctx.query

    const where = {}
    if (search) {
        where[Op.or] = [
            { name: { [Op.like]: `%${search}%` } },
            { path: { [Op.like]: `%${search}%` } },
            { title: { [Op.like]: `%${search}%` } }
        ]
    }

    const menus = await Menu.findAll({
        where,
        order: [
            ['parent_id', 'ASC'],
            ['sort', 'ASC']
        ]
    })

    // 构建树形结构
    const buildTree = (items, parentId = 0) => {
        const result = []
        for (const item of items) {
            if (item.parent_id === parentId) {
                const children = buildTree(items, item.id)
                if (children.length) {
                    item.children = children
                }
                result.push(item)
            }
        }
        return result
    }

    ctx.success(buildTree(menus.map(m => m.get({ plain: true }))))
})

// 更新菜单
router.put('/update', auth(), authorize(['menu:update']), async ctx => {
    const { id, name, path, component, redirect, title, icon, badge, 
            dot, no_closable, no_cache, sort, parent_id, hidden, status } = ctx.request.body

    if (!id) {
        throw BusinessError(errorCode.PARAM_ERROR, '菜单ID不能为空')
    }

    const menu = await Menu.findByPk(id)
    if (!menu) {
        throw BusinessError(errorCode.NOT_FOUND, '菜单不存在')
    }

    if (path && path !== menu.path) {
        const exists = await Menu.findOne({ where: { path } })
        if (exists) {
            throw BusinessError(errorCode.PARAM_ERROR, '菜单路径已存在')
        }
    }

    // 更新字段
    const fields = { name, path, component, redirect, title, icon, badge, 
                    dot, no_closable, no_cache, sort, parent_id, hidden, status }
    for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined) {
            menu[key] = value
        }
    }

    await menu.save()
    ctx.success(menu.get({ plain: true }), '菜单更新成功')
})

// 删除菜单
router.delete('/delete', auth(), authorize(['menu:delete']), async ctx => {
    const { id } = ctx.request.body

    if (!id) {
        throw BusinessError(errorCode.PARAM_ERROR, '菜单ID不能为空')
    }

    const menu = await Menu.findByPk(id)
    if (!menu) {
        throw BusinessError(errorCode.NOT_FOUND, '菜单不存在')
    }

    // 检查是否有子菜单
    const childCount = await Menu.count({ where: { parent_id: id } })
    if (childCount > 0) {
        throw BusinessError(errorCode.FORBIDDEN, '存在子菜单，无法删除')
    }

    await menu.destroy({ force: true })
    ctx.success(null, '菜单删除成功')
})

module.exports = router