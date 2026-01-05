/** @format */

import winston from "winston"

const logFormat = winston.format.combine(
	winston.format.timestamp({
		format: "YYYY-MM-DD HH:mm:ss",
	}),
	winston.format.errors({ stack: true }),
	winston.format.printf(({ timestamp, level, message, stack }) => {
		return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`
	})
)

const logger = winston.createLogger({
	level: process.env.LOG_LEVEL || "info",
	format: logFormat,
	transports: [
		new winston.transports.Console({
			format: winston.format.combine(winston.format.colorize(), logFormat),
		}),
	],
})

// 프로덕션 환경에서는 파일 로깅 추가
if (process.env.NODE_ENV === "production") {
	logger.add(
		new winston.transports.File({
			filename: "logs/error.log",
			level: "error",
		})
	)

	logger.add(
		new winston.transports.File({
			filename: "logs/combined.log",
		})
	)
}

export { logger }
export default logger
