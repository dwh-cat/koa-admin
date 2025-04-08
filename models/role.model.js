const { DataTypes } = require('sequelize')
const sequelize = require('../config/db')

const Role = sequelize.define('role', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false
    },
    description: DataTypes.STRING(200)
})

module.exports = Role 