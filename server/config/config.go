package config

import (
	"fmt"
	"os"
	"strings"

	"github.com/joho/godotenv"
	"gopkg.in/yaml.v3"
)

// Config 配置结构
type Config struct {
	App    AppConfig    `yaml:"app"`
	OAuth2 OAuth2Config `yaml:"oauth2"`
	Log    LogConfig    `yaml:"log"`
}

type AppConfig struct {
	Name     string `yaml:"name"`
	Port     string `yaml:"port"`
	Mode     string `yaml:"mode"`
	LogLevel string `yaml:"log_level"`
}

type OAuth2Config struct {
	ClientID              string `yaml:"client_id"`
	ClientSecret          string `yaml:"client_secret"`
	RedirectURI           string `yaml:"redirect_uri"`
	AuthorizationEndpoint string `yaml:"authorization_endpoint"`
	TokenEndpoint         string `yaml:"token_endpoint"`
	UserEndpoint          string `yaml:"user_endpoint"`
}

type LogConfig struct {
	Level    string `yaml:"level"`
	Format   string `yaml:"format"`
	Output   string `yaml:"output"`
	FilePath string `yaml:"file_path"`
}

// 全局配置实例
var globalConfig *Config

// Load 加载配置
func Load() (*Config, error) {
	config := &Config{}

	// 1. 加载环境变量文件
	loadEnvFile()

	// 2. 读取并解析配置文件
	if err := config.loadConfigFile(); err != nil {
		return nil, err
	}

	// 3. 后处理
	config.postProcess()

	globalConfig = config
	return config, nil
}

// MustLoad 加载配置，失败则panic
func MustLoad() *Config {
	config, err := Load()
	if err != nil {
		panic(fmt.Sprintf("配置加载失败: %v", err))
	}
	return config
}

// Get 获取全局配置实例
func Get() *Config {
	if globalConfig == nil {
		panic("配置未初始化，请先调用 Load()")
	}
	return globalConfig
}

// 加载环境变量文件
func loadEnvFile() {
	env := os.Getenv("APP_MODE")
	if env == "" {
		env = "dev"
	}

	var envFiles []string
	switch env {
	case "prod", "production":
		envFiles = []string{".env.prod", ".env"}
	case "dev", "development":
		envFiles = []string{".env.dev", ".env"}
	default:
		envFiles = []string{".env"}
	}

	for _, file := range envFiles {
		if fileExists(file) {
			godotenv.Load(file)
			break
		}
	}
}

// 加载配置文件
func (c *Config) loadConfigFile() error {

	data, err := os.ReadFile("config_yaml/config.yaml")
	if err != nil {
		return fmt.Errorf("读取配置文件失败: %w", err)
	}

	content := replaceEnvPlaceholders(string(data))

	// 解析YAML
	if err := yaml.Unmarshal([]byte(content), c); err != nil {
		return fmt.Errorf("解析配置失败: %w", err)
	}

	return nil
}

// 替换环境变量占位符 {VAR_NAME}
func replaceEnvPlaceholders(content string) string {
	for {
		start := strings.Index(content, "{")
		if start == -1 {
			break
		}

		end := strings.Index(content[start:], "}")
		if end == -1 {
			break
		}
		end += start

		// 提取变量名并替换
		varName := content[start+1 : end]
		varValue := os.Getenv(varName)
		content = content[:start] + varValue + content[end+1:]
	}
	return content
}

// 端口格式化处理
func (c *Config) postProcess() {
	if c.App.Port != "" && !strings.HasPrefix(c.App.Port, ":") {
		c.App.Port = ":" + c.App.Port
	}
}

// 环境判断方法
func (c *Config) IsDev() bool {
	return c.App.Mode == "debug"
}

func (c *Config) IsProd() bool {
	return c.App.Mode == "release"
}

// 工具函数
func fileExists(filename string) bool {
	_, err := os.Stat(filename)
	return !os.IsNotExist(err)
}
