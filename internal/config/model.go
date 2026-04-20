/*
 * MIT License
 *
 * Copyright (c) 2025 linux.do
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

package config

import "time"

type configModel struct {
	App        appConfig        `mapstructure:"app"`
	ProjectApp projectAppConfig `mapstructure:"projectApp"`
	OAuth2     OAuth2Config     `mapstructure:"oauth2"`
	Database   databaseConfig   `mapstructure:"database"`
	Redis      redisConfig      `mapstructure:"redis"`
	Log        logConfig        `mapstructure:"log"`
	Schedule   scheduleConfig   `mapstructure:"schedule"`
	Worker     workerConfig     `mapstructure:"worker"`
	ClickHouse clickHouseConfig `mapstructure:"clickhouse"`
	LinuxDo    linuxDoConfig    `mapstructure:"linuxdo"`
	Otel       otelConfig       `mapstructure:"otel"`
	Payment    PaymentConfig    `mapstructure:"payment"`
}

// appConfig 应用基本配置
type appConfig struct {
	AppName           string `mapstructure:"app_name"`
	Env               string `mapstructure:"env"`
	Addr              string `mapstructure:"addr"`
	APIPrefix         string `mapstructure:"api_prefix"`
	SessionCookieName string `mapstructure:"session_cookie_name"`
	SessionSecret     string `mapstructure:"session_secret"`
	SessionDomain     string `mapstructure:"session_domain"`
	SessionAge        int    `mapstructure:"session_age"`
	SessionHttpOnly   bool   `mapstructure:"session_http_only"`
	SessionSecure     bool   `mapstructure:"session_secure"`
}

// projectAppConfig 项目相关配置
type projectAppConfig struct {
	HiddenThreshold        uint8 `mapstructure:"hidden_threshold"`
	DeductionPerOffense    uint8 `mapstructure:"deduction_per_offense"`
	CreateProjectRateLimit []struct {
		IntervalSeconds int `mapstructure:"interval_seconds"`
		MaxCount        int `mapstructure:"max_count"`
	} `mapstructure:"create_project_rate_limit"`
}

// OAuth2Config OAuth2认证配置
type OAuth2Config struct {
	ClientID              string `mapstructure:"client_id"`
	ClientSecret          string `mapstructure:"client_secret"`
	RedirectURI           string `mapstructure:"redirect_uri"`
	AuthorizationEndpoint string `mapstructure:"authorization_endpoint"`
	TokenEndpoint         string `mapstructure:"token_endpoint"`
	UserEndpoint          string `mapstructure:"user_endpoint"`
}

// databaseConfig 数据库配置
type databaseConfig struct {
	Enabled                   bool          `mapstructure:"enabled"`
	Host                      string        `mapstructure:"host"`
	Port                      int           `mapstructure:"port"`
	Username                  string        `mapstructure:"username"`
	Password                  string        `mapstructure:"password"`
	Database                  string        `mapstructure:"database"`
	MaxIdleConn               int           `mapstructure:"max_idle_conn"`
	MaxOpenConn               int           `mapstructure:"max_open_conn"`
	ConnMaxLifetime           int           `mapstructure:"conn_max_lifetime"`
	LogLevel                  string        `mapstructure:"log_level"`
	SlowThreshold             time.Duration `mapstructure:"slow_threshold"`
	IgnoreRecordNotFoundError bool          `mapstructure:"ignore_record_not_found_error"`
}

// clickhouse 配置
type clickHouseConfig struct {
	Enabled         bool     `mapstructure:"enabled"`
	Hosts           []string `mapstructure:"hosts"`
	Username        string   `mapstructure:"username"`
	Password        string   `mapstructure:"password"`
	Database        string   `mapstructure:"database"`
	MaxIdleConn     int      `mapstructure:"max_idle_conn"`
	MaxOpenConn     int      `mapstructure:"max_open_conn"`
	ConnMaxLifetime int      `mapstructure:"conn_max_lifetime"`
	DialTimeout     int      `mapstructure:"dial_timeout"`
}

// redisConfig Redis配置
type redisConfig struct {
	Enabled      bool   `mapstructure:"enabled"`
	Host         string `mapstructure:"host"`
	Port         int    `mapstructure:"port"`
	Username     string `mapstructure:"username"`
	Password     string `mapstructure:"password"`
	DB           int    `mapstructure:"db"`
	PoolSize     int    `mapstructure:"pool_size"`
	MinIdleConn  int    `mapstructure:"min_idle_conn"`
	DialTimeout  int    `mapstructure:"dial_timeout"`
	ReadTimeout  int    `mapstructure:"read_timeout"`
	WriteTimeout int    `mapstructure:"write_timeout"`
}

// logConfig 日志配置
type logConfig struct {
	Level      string `mapstructure:"level"`
	Format     string `mapstructure:"format"`
	Output     string `mapstructure:"output"`
	FilePath   string `mapstructure:"file_path"`
	MaxSize    int    `mapstructure:"max_size"`
	MaxAge     int    `mapstructure:"max_age"`
	MaxBackups int    `mapstructure:"max_backups"`
	Compress   bool   `mapstructure:"compress"`
}

// scheduleConfig 定时任务配置
type scheduleConfig struct {
	UserBadgeScoreDispatchIntervalSeconds int    `mapstructure:"user_badge_score_dispatch_interval_seconds"`
	UpdateUserBadgeScoresTaskCron         string `mapstructure:"update_user_badges_scores_task_cron"`
	UpdateAllBadgesTaskCron               string `mapstructure:"update_all_badges_task_cron"`
}

// workerConfig 工作配置
type workerConfig struct {
	Concurrency int `mapstructure:"concurrency"`
}

// linuxDoConfig
type linuxDoConfig struct {
	ApiKey string `mapstructure:"api_key"`
}

// otelConfig OpenTelemetry 配置
type otelConfig struct {
	SamplingRate float64 `mapstructure:"sampling_rate"`
}

// PaymentConfig 支付相关全局配置
type PaymentConfig struct {
	// Enabled 是否启用付费功能。关闭时创建/领取付费项目会被拒绝
	Enabled bool `mapstructure:"enabled"`
	// ApiUrl LDC 易支付兼容接口基址,例如 https://credit.linux.do/epay
	ApiUrl string `mapstructure:"api_url"`
	// NotifyBaseURL 本项目对外可访问的基址(不含路径),例如 https://cdk.linux.do
	// 用于拼接 notify_url / return_url 并提示用户在 LDC 商户后台填写
	NotifyBaseURL string `mapstructure:"notify_base_url"`
	// ConfigEncryptionKey 用于加密用户 clientSecret 的密钥,必须是 32 字节长度
	// 建议直接填 32 字符 ASCII 字符串或 base64 解码得 32 字节
	ConfigEncryptionKey string `mapstructure:"config_encryption_key"`
	// OrderExpireMinutes 订单 PENDING 状态的最长保留时间(分钟),默认 10
	OrderExpireMinutes int `mapstructure:"order_expire_minutes"`
	// HTTPTimeoutSeconds 调用易支付接口的超时(秒),默认 10
	HTTPTimeoutSeconds int `mapstructure:"http_timeout_seconds"`
}
