const { DataTypes } = require('sequelize')
const sequelize = require('../config/db')

const Permission = sequelize.define('permission', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    code: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false,
        comment: '权限编码'
    },
    name: {
        type: DataTypes.STRING(50),
        comment: '权限名称'
    },
    type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'menu',
        comment: '权限类型'
    },
    description: {
        type: DataTypes.STRING(200),
        comment: '权限描述'
    },
    action: {
        type: DataTypes.STRING(50),
        comment: '操作类型：create-创建，read-读取，update-更新，delete-删除'
    }
}, {
    tableName: 'permissions',
    underscored: true,
    paranoid: true
})

module.exports = Permission