const { DataTypes } = require('sequelize')
const sequelize = require('../config/db')
const bcrypt = require('bcryptjs')

const User = sequelize.define('user', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    nickname: {
        type: DataTypes.STRING(50),
        comment: '用户昵称'
    },
    avatar: {
        type: DataTypes.STRING(255),
        comment: '头像地址'
    },
    email: {
        type: DataTypes.STRING(100),
        validate: {
            isEmail: true
        }
    },
    phone: {
        type: DataTypes.STRING(20),
        validate: {
            is: /^1[3-9]\d{9}$/
        }
    },
    status: {
        type: DataTypes.TINYINT,
        defaultValue: 1,
        comment: '0-禁用 1-启用'
    },
    last_login: {
        type: DataTypes.DATE,
        comment: '最后登录时间'
    }
}, {
    indexes: [
        { fields: ['username'] },
        { fields: ['email'] }
    ]
})

// 添加密码加密钩子
User.beforeCreate(async (user) => {
    if (user.password) {
        user.password = await bcrypt.hash(user.password, 10)
    }
})

// 添加密码验证方法
User.prototype.validPassword = async function (password) {
    return await bcrypt.compare(password, this.password)
}
// 同步模型到数据库
sequelize.sync({ force: false }) // 生产环境设为false
    .then(() => console.log('User table created successfully'))
    .catch(err => console.error('Unable to create table:', err))

module.exports = User 