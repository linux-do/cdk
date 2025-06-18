package dashboard

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type DashboardDataResponse struct {
	ErrorMsg string      `json:"error_msg"`
	Data     interface{} `json:"data"`
}

// GetAllStats
// @Tags Dashboard
// @Params days query int false "request query"
// @Produce json
// @Success 200 {object} DashboardDataResponse
// @Router /api/v1/dashboard/stats/all [get]
func GetAllStats(c *gin.Context) {
	daysStr := c.DefaultQuery("days", "14")
	days, err := strconv.Atoi(daysStr)
	if err != nil || days <= 0 {
		days = 14
	}
	data, err := GetAllDashboardData(c.Request.Context(), days)

	if err != nil {
		c.JSON(http.StatusInternalServerError, DashboardDataResponse{ErrorMsg: err.Error()})
		return
	}

	c.JSON(http.StatusOK, DashboardDataResponse{
		Data: data,
	})
}
