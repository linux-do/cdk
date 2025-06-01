package health

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

type HealthResponse struct {
	ErrorMsg string      `json:"error_msg"`
	Data     interface{} `json:"data"`
}

// Health godoc
// @Tags health
// @Produce json
// @Success 200 {object} HealthResponse
// @Router /api/v1/health [get]
func Health(c *gin.Context) {
	c.JSON(http.StatusOK, HealthResponse{ErrorMsg: "", Data: nil})
}
