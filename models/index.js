//基础模型
const User = require('./user.model')
const Role = require('./role.model')
const Menu = require('./menu.model')
const Permission = require('./permission.model')
//关系模型
const RolePermission = require('./rolePermission.model')
const UserRole = require('./userRole.model')
const RoleMenu = require('./roleMenu.model')

const sequelize = require('../config/db')

// 用户-角色多对多关系
User.belongsToMany(Role, {
    through: UserRole,
    foreignKey: 'userId',
    otherKey: 'roleId'
})
Role.belongsToMany(User, {
    through: UserRole,
    foreignKey: 'roleId',
    otherKey: 'userId'
})
// 角色-权限多对多关系
Role.belongsToMany(Permission, {
    through: RolePermission,
    foreignKey: 'role_id',
    otherKey: 'permission_id'
})

Permission.belongsToMany(Role, {
    through: RolePermission,
    foreignKey: 'permission_id',
    otherKey: 'role_id'
})
// 建立菜单和角色的多对多关系
Menu.belongsToMany(Role, {
    through: RoleMenu,
    foreignKey: 'menu_id',
    otherKey: 'role_id'
})
Role.belongsToMany(Menu, {
    through: RoleMenu,
    foreignKey: 'role_id',
    otherKey: 'menu_id'
})
// 最后同步数据库
sequelize.sync({ force: false })
    .then(() => console.log('All tables synced'))
    .catch(err => console.error('Sync failed:', err))
