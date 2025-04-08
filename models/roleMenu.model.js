const { DataTypes } = require('sequelize')
const sequelize = require('../config/db')

const RoleMenu = sequelize.define('role_menu', {
    role_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '角色ID'
    },
    menu_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '菜单ID'
    }
}, {
    tableName: 'role_menus',
    underscored: true,
    // 不需要默认的时间戳字段
    timestamps: false,
    // 不需要 id 主键
    id: false
})

module.exports = RoleMenu