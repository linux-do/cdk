package health

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

type HealthResponse struct {
	ErrorCode int         `json:"error_code"`
	ErrorMsg  string      `json:"error_msg"`
	Data      interface{} `json:"data"`
}

// Health godoc
// @Tags health
// @Produce json
// @Success 200 {object} HealthResponse
// @Router /api/v1/health [get]
func Health(c *gin.Context) {
	c.JSON(http.StatusOK, HealthResponse{ErrorCode: 0, ErrorMsg: "", Data: nil})
}
