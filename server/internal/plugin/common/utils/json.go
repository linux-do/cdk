package util

import (
	"encoding/json"
)

// JSONMarshal 将对象序列化为JSON字节数组
func JSONMarshal(v interface{}) ([]byte, error) {
	return json.Marshal(v)
}

// JSONUnmarshal 将JSON字节数组反序列化为对象
func JSONUnmarshal(data []byte, v interface{}) error {
	return json.Unmarshal(data, v)
}

// JSONMarshalToString 将对象序列化为JSON字符串
func JSONMarshalToString(v interface{}) (string, error) {
	data, err := JSONMarshal(v)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

// JSONUnmarshalFromString 将JSON字符串反序列化为对象
func JSONUnmarshalFromString(s string, v interface{}) error {
	return JSONUnmarshal([]byte(s), v)
}
