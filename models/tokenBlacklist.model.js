const { DataTypes } = require('sequelize')
const sequelize = require('../config/db')

const TokenBlacklist = sequelize.define('TokenBlacklist', {
    token: {
        type: DataTypes.STRING(512),
        primaryKey: true
    },
    expiration: {
        type: DataTypes.DATE,
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'sys_token_blacklist',
    timestamps: true
})

module.exports = TokenBlacklist 