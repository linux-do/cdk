package config

import (
	"fmt"

	"github.com/spf13/viper"
)

var AppConfig *Config

// Config 应用配置结构
type Config struct {
	App      appConfig      `mapstructure:"app"`
	OAuth2   OAuth2Config   `mapstructure:"oauth2"`
	Database databaseConfig `mapstructure:"database"`
	Redis    redisConfig    `mapstructure:"redis"`
	Log      logConfig      `mapstructure:"log"`
}

// appConfig 应用基本配置
type appConfig struct {
	Name         string   `mapstructure:"name"`
	Env          string   `mapstructure:"env"`
	Debug        bool     `mapstructure:"debug"`
	Port         int      `mapstructure:"port"`
	ReadTimeout  int      `mapstructure:"read_timeout"`
	WriteTimeout int      `mapstructure:"write_timeout"`
	IdleTimeout  int      `mapstructure:"idle_timeout"`
	APIPrefix    string   `mapstructure:"api_prefix"`
	AllowCORS    bool     `mapstructure:"allow_cors"`
	CORSDomains  []string `mapstructure:"cors_domains"`
	JWTSecret    string   `mapstructure:"jwt_secret"`
	JWTTTL       int      `mapstructure:"jwt_ttl"`
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
	Driver          string `mapstructure:"driver"`
	Host            string `mapstructure:"host"`
	Port            int    `mapstructure:"port"`
	Username        string `mapstructure:"username"`
	Password        string `mapstructure:"password"`
	Database        string `mapstructure:"database"`
	MaxIdleConns    int    `mapstructure:"max_idle_conns"`
	MaxOpenConns    int    `mapstructure:"max_open_conns"`
	ConnMaxLifetime int    `mapstructure:"conn_max_lifetime"`
	LogLevel        string `mapstructure:"log_level"`
}

// redisConfig Redis配置
type redisConfig struct {
	Host            string `mapstructure:"host"`
	Port            int    `mapstructure:"port"`
	Password        string `mapstructure:"password"`
	DB              int    `mapstructure:"db"`
	PoolSize        int    `mapstructure:"pool_size"`
	MinIdleConns    int    `mapstructure:"min_idle_conns"`
	DialTimeout     int    `mapstructure:"dial_timeout"`
	ReadTimeout     int    `mapstructure:"read_timeout"`
	WriteTimeout    int    `mapstructure:"write_timeout"`
	MaxRetries      int    `mapstructure:"max_retries"`
	MinRetryBackoff int    `mapstructure:"min_retry_backoff"`
	MaxRetryBackoff int    `mapstructure:"max_retry_backoff"`
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

// InitConfig 初始化配置，应在应用启动时调用
func InitConfig(configPath string) error {
	// 设置配置文件
	viper.SetConfigFile(configPath)
	viper.AutomaticEnv()

	// 读取配置文件
	if err := viper.ReadInConfig(); err != nil {
		return fmt.Errorf("读取配置文件失败: %w", err)
	}

	// 解析配置到结构体
	var config Config
	if err := viper.Unmarshal(&config); err != nil {
		return fmt.Errorf("解析配置失败: %w", err)
	}

	// 设置全局配置
	AppConfig = &config
	return nil
}

// GetDSN 获取数据库连接字符串（使用结构体配置）
func GetDSN() string {
	if AppConfig == nil {
		panic("配置未初始化，请先调用InitConfig")
	}

	db := AppConfig.Database
	return fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		db.Username, db.Password, db.Host, db.Port, db.Database)
}
