const errorCode = require('../utils/errorCode')

class HttpError extends Error {
    constructor(status, code, message, details = {}) {
        super(message)
        this.status = status
        this.code = code
        this.details = details
        this.isOperational = true
        Error.captureStackTrace(this, this.constructor)
    }
}

const BusinessError = (code, message, details) =>
    new HttpError(400, code, message, details)

const errorHandler = () => async (ctx, next) => {
    try {
        await next()
    } catch (err) {
        const isDevelopment = process.env.NODE_ENV === 'development'

        // Handle HttpErrors
        if (err instanceof HttpError) {
            ctx.status = err.status
            ctx.body = {
                code: err.code,
                message: err.message,
                ...(err.details && Object.keys(err.details).length && { details: err.details })
            }
            return
        }

        // Sequelize validation errors
        if (err.name === 'SequelizeValidationError') {
            ctx.status = 400
            ctx.body = {
                code: 'VALIDATION_FAILED',
                message: 'Validation error',
                details: {
                    errors: err.errors.map(e => ({
                        field: e.path,
                        message: e.message
                    }))
                }
            }
            return
        }

        // Default error handling
        ctx.status = err.status || 500
        ctx.body = {
            code: 'INTERNAL_ERROR',
            message: isDevelopment ? err.message : 'Internal server error'
        }

        // Development logging
        if (isDevelopment) {
            console.error('[Error]', {
                method: ctx.method,
                path: ctx.path,
                status: ctx.status,
                error: err.stack
            })
        }
    }
}

module.exports = {
    errorHandler,
    BusinessError,
    HttpError
}