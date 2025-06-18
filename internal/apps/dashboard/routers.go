package dashboard

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

type DashboardDataResponse struct {
	ErrorMsg string         `json:"error_msg"`
	Data     *DashboardData `json:"data"`
}

// GetAllStats
// @Tags Dashboard
// @Summary Get Dashboard Stats
// @Params days query int false "Number of days to retrieve stats for"
// @Produce json
// @Success 200 {object} DashboardDataResponse
// @Router /api/v1/dashboard/stats/all [get]
func GetAllStats(c *gin.Context) {

	c.JSON(http.StatusOK, nil)
}
