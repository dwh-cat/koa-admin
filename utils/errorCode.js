module.exports = {
    SUCCESS: 1,//成功
    PARAM_ERROR: 4001,//参数错误
    AUTH_FAILED: 4010,//认证失败
    FORBIDDEN: 4030,//无权限访问,
    NOT_FOUND: 4040,//资源不存在,
    SERVER_ERROR: 5000,//服务器内部错误,
    ROLE_MANAGE: 3001,//角色管理错误,
    PERMISSION_MANAGE: 4001,//权限管理错误,
    UNAUTHORIZED: 4011,//未授权访问,
    OPERATION_FORBIDDEN: 4031,//操作被禁止,
    RESOURCE_IN_USE: 4032,//资源被占用,
    ROLE_IN_USE: 4033,//角色被占用,
    ROLE_DUPLICATE: 4034,//角色名称已存在,
    PERMISSION_IN_USE: 4035,//权限被占用,
    DUPLICATE_PERMISSION: 4036,//权限名称已存在,
    USER_DUPLICATE: 4037,//用户名称已存在,
    SELF_DELETE_FORBIDDEN: 4038//不能删除自己
} 