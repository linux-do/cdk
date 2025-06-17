package dashboard

import "github.com/gin-gonic/gin"

// GetAllStats
// @Summary Get Dashboard Stats
// @Params ?
// @Produce json
// @Success 200 {object} ?
// @Router /api/v1/dashboard/stats/all [get]
func GetAllStats(c *gin.Context) {
	c.JSON(200, gin.H{
		"message": "Dashboard stats retrieved successfully",
		"data":    nil,
	})
}
