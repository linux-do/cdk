package utils

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
)

// StringArray custom type for handling JSON arrays
type StringArray []string

func (sa *StringArray) Scan(value interface{}) error {
	bytesValue, ok := value.([]byte)
	if !ok {
		return fmt.Errorf("invalid value: %v", value)
	}
	return json.Unmarshal(bytesValue, sa)
}

func (sa StringArray) Value() (driver.Value, error) {
	return json.Marshal(sa)
}
