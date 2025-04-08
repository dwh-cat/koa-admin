const { Sequelize } = require('sequelize')

// 先定义实例再导出
const sequelize = new Sequelize({
    dialect: 'mysql',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    timezone: '+08:00', // 设置中国时区
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    define: {
        timestamps: true, // 自动添加createdAt和updatedAt字段
        paranoid: true, // 开启软删除
        underscored: true // 使用下划线命名风格
    }
})

// 测试数据库连接（使用已定义的sequelize变量）
sequelize.authenticate()
    .then(() => console.log('Database connection has been established successfully.'))
    .catch(err => console.error('Unable to connect to the database:', err))

module.exports = sequelize // 导出已定义的实例 