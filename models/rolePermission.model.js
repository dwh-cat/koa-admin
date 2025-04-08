const { DataTypes } = require('sequelize')
const sequelize = require('../config/db')

const RolePermission = sequelize.define('role_permission', {
    role_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '角色ID'
    },
    permission_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '权限ID'
    }
}, {
    tableName: 'role_permissions',
    underscored: true,
    timestamps: false,
    id: false
})

module.exports = RolePermission