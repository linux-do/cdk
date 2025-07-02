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
	if err != nil || days <= 0 || days > 30 {
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
