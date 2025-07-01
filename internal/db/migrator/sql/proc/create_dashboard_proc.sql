-- 创建获取仪表盘数据的存储过程
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS `get_dashboard_data`(IN days INT,IN p_limit_count INT)
BEGIN
    SELECT
        (
            SELECT JSON_ARRAYAGG(
                           JSON_OBJECT(
                                   'date', DATE_FORMAT(date_col, '%m月%d日'),
                                   'value', count_val
                           )
                   )
            FROM (
                     SELECT DATE(created_at) AS date_col, COUNT(*) AS count_val
                     FROM users
                     WHERE created_at >= CURDATE() - INTERVAL days DAY
                     GROUP BY DATE(created_at)
                     ORDER BY date_col DESC
                 ) AS tmp_user_growth
        ) AS userGrowth,
        (
            SELECT JSON_ARRAYAGG(
                           JSON_OBJECT(
                                   'date', DATE_FORMAT(date_col, '%m月%d日'),
                                   'value', count_val
                           )
                   )
            FROM (
                     SELECT DATE(received_at) AS date_col, COUNT(*) AS count_val
                     FROM project_items
                     WHERE received_at >= CURDATE() - INTERVAL 14 DAY
                     GROUP BY DATE(received_at)
                     ORDER BY date_col DESC
                 ) AS tmp_activity
        ) AS activityData,
        (
            SELECT JSON_ARRAYAGG(
                           JSON_OBJECT('name', tag, 'value', tag_count)
                   )
            FROM (
                     SELECT tag, COUNT(*) AS tag_count
                     FROM project_tags
                     GROUP BY tag
                 ) AS tag_stats
        ) AS projectTags,
        (
            SELECT JSON_ARRAYAGG(
                           JSON_OBJECT('name', distribution_type, 'value', dist_count)
                   )
            FROM (
                     SELECT distribution_type, COUNT(*) AS dist_count
                     FROM projects
                     GROUP BY distribution_type
                 ) AS dist_stats
        ) AS distributeModes,
        (
            SELECT
                JSON_ARRAYAGG( JSON_OBJECT( 'name', name, 'tags', tags, 'receiveCount', receive_count ) )
            FROM
                (
                    SELECT p.name, pt.tags, pi.receive_count FROM projects p
                    JOIN (
                        SELECT project_id, COUNT(*) AS receive_count
                        FROM project_items
                        WHERE receiver_id IS NOT NULL
                        GROUP BY project_id
                    ) pi ON pi.project_id = p.id
                    LEFT JOIN (
                        SELECT project_id, JSON_ARRAYAGG(tag) AS tags
                        FROM project_tags
                        GROUP BY project_id
                    ) pt ON pt.project_id = p.id
                    ORDER BY pi.receive_count DESC
                    LIMIT p_limit_count
                ) AS hot_stats
        ) AS hotProjects,
        (
            SELECT JSON_ARRAYAGG(
                           JSON_OBJECT('avatar', avatar_url, 'name', nickname, 'projectCount', project_count)
                   )
            FROM (
                     SELECT u.avatar_url, u.nickname, COUNT(p.id) AS project_count
                     FROM projects p
                              JOIN users u ON u.id = p.creator_id
                     GROUP BY u.id, u.avatar_url, u.nickname
                     ORDER BY project_count DESC
                     LIMIT p_limit_count
                 ) AS creator_stats
        ) AS activeCreators,
        (
            SELECT JSON_ARRAYAGG(
                           JSON_OBJECT('avatar', avatar_url, 'name', nickname, 'receiveCount', receive_count)
                   )
            FROM (
                     SELECT u.avatar_url, u.nickname, COUNT(pi.id) AS receive_count
                     FROM project_items pi
                              JOIN users u ON u.id = pi.receiver_id
                     WHERE pi.receiver_id IS NOT NULL
                     GROUP BY u.id, u.avatar_url, u.nickname
                     ORDER BY receive_count DESC
                     LIMIT p_limit_count
                 ) AS receiver_stats
        ) AS activeReceivers,
        (
            SELECT JSON_OBJECT(
                           'totalUsers', (SELECT COUNT(*) FROM users),
                           'newUsers', (SELECT COUNT(*) FROM users WHERE created_at >= CURDATE() - INTERVAL days DAY),
                           'totalProjects', (SELECT COUNT(*) FROM projects),
                           'totalReceived', (SELECT COUNT(*) FROM project_items WHERE received_at IS NOT NULL),
                           'recentReceived', (SELECT COUNT(*) FROM project_items WHERE received_at >= CURDATE() - INTERVAL days DAY)
                   )
        ) AS summary;
END $$

DELIMITER ;