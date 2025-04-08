const { DataTypes } = require('sequelize')
const sequelize = require('../config/db')

const UserRole = sequelize.define('user_role', {
    userId: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    roleId: {
        type: DataTypes.INTEGER,
        primaryKey: true
    }
})

module.exports = UserRole 