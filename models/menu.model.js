const { DataTypes } = require('sequelize')
const sequelize = require('../config/db')

const Menu = sequelize.define('menu', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: '菜单名称'
    },
    path: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: '路由路径'
    },
    component: {
        type: DataTypes.STRING(100),
        comment: '前端组件路径'
    },
    icon: {
        type: DataTypes.STRING(50),
        comment: '菜单图标'
    },
    badge: {
        type: DataTypes.STRING(50),
        comment: '菜单徽标'
    },
    dot: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: '是否显示小圆点'
    },
    sort: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '排序号'
    },
    parent_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,  // 顶级菜单使用 0 作为 parent_id
        validate: {
            customValidator(value) {
                if (value === '') {
                    this.setDataValue('parent_id', 0);
                }
                if (value !== null && value !== '' && value !== 0) {
                    if (!Number.isInteger(Number(value))) {
                        throw new Error('父级ID必须是整数');
                    }
                }
            }
        },
        comment: '父菜单ID，0表示顶级菜单'
    },
    hidden: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: '是否可见'
    },
    cache: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: '是否缓存'
    },
    closable: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: '是否可关闭'
    },
    guard: {
        type: DataTypes.STRING(50),
        comment: '权限标识'
    }
}, {
    tableName: 'menus',
    paranoid: true,
})

module.exports = Menu