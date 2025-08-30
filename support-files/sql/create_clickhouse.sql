CREATE DATABASE IF NOT EXISTS linux_do_cdk;

USE linux_do_cdk;

CREATE TABLE IF NOT EXISTS err_receive_logs
(
    request_time       DateTime,
    trace_id           String,
    user_id            UInt64,
    user_name          String,
    project_id         String,
    project_start_time DateTime,
    project_end_time   DateTime,
    error_message      String DEFAULT '',
    client_info        String DEFAULT ''
) ENGINE = MergeTree()
      PARTITION BY toYYYYMM(request_time)
      ORDER BY (request_time, user_id, project_id)
      SETTINGS index_granularity = 8192;
ALTER TABLE err_receive_logs
    ADD INDEX idx_user_id (user_id) TYPE bloom_filter(0.01) GRANULARITY 1,
    ADD INDEX idx_project_id (project_id) TYPE bloom_filter(0.01) GRANULARITY 1;
