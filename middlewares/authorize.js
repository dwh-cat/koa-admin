const { BusinessError } = require('./errorHandler')
const errorCode = require('../utils/errorCode')
const User = require('../models/user.model')
const Role = require('../models/role.model')
const Permission = require('../models/permission.model')
const authorize = (requiredPermissions = []) => {
    return async (ctx, next) => {
        const user = ctx.state.user
        // 检查用户是否为超级管理员
        const isAdmin=user.userId==1
        if(isAdmin){
            return await next()
        }
        // 获取用户所有角色及关联权限
        const userWithRoles = await User.findByPk(user.userId, {
            include: [{
                model: Role,
                through: { attributes: [] }, // 不返回UserRole表字段
                include: [{
                    model: Permission,
                    through: { attributes: [] } // 不返回RolePermission表字段
                }]
            }]
        })
        if(!userWithRoles){
            throw BusinessError(errorCode.NOT_FOUND, '用户没有角色，无法获取权限')
        }
        
        // 如果是超级管理员角色
        const isSuperAdmin = userWithRoles.roles.some(role => role.name === 'superadmin')
       
        
        if (isSuperAdmin) {
            return await next()
        }
        
        // 提取所有权限码
        const permissions = userWithRoles.roles
            .flatMap(role => role.permissions)
            .reduce((acc, permission) => {
                acc.add(permission.code)
                return acc
            }, new Set())

        // 验证权限
        const hasAllPermissions = requiredPermissions.every(p =>
            permissions.has(p)
        )

        if (!hasAllPermissions) {
            throw BusinessError(errorCode.FORBIDDEN, '权限不足')
        }

        await next()
    }
}
module.exports = authorize 
