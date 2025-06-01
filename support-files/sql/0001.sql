-- 创建数据库
CREATE DATABASE IF NOT EXISTS linux_do_cdk DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 切换数据库
USE linux_do_cdk;

-- 用户表
CREATE TABLE IF NOT EXISTS `users`
(
    `id`          bigint COMMENT '用户ID',
    `username`    varchar(255) UNIQUE COMMENT '用户名',
    `nickname`    varchar(255) DEFAULT NULL COMMENT '昵称',
    `avatar`      varchar(255) COMMENT '头像URL',
    `is_active`   tinyint COMMENT '状态: 0-禁用, 1-启用',
    `trust_level` tinyint COMMENT '信任等级',
    PRIMARY KEY (`id`)
) COMMENT ='用户表';
