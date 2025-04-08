const TokenBlacklist = require('../models/tokenBlacklist.model')

// 每天清理过期黑名单
setInterval(async () => {
    try {
        await TokenBlacklist.destroy({
            where: {
                expiration: { [Op.lt]: new Date() }
            }
        })
    } catch (err) {
        console.error('清理黑名单失败:', err)
    }
}, 24 * 60 * 60 * 1000) 