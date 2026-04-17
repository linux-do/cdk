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

package requestid

import (
	"context"
	"strings"

	"github.com/google/uuid"
)

const HeaderName = "X-Request-Id"

type contextKey string

const requestIDContextKey contextKey = "request_id"

func New() string {
	return "req_" + strings.ReplaceAll(uuid.NewString(), "-", "")
}

func Normalize(value string) string {
	return strings.TrimSpace(value)
}

func GetOrNew(value string) string {
	requestID := Normalize(value)
	if requestID != "" {
		return requestID
	}

	return New()
}

func WithContext(ctx context.Context, requestID string) context.Context {
	normalized := Normalize(requestID)
	if normalized == "" {
		return ctx
	}

	return context.WithValue(ctx, requestIDContextKey, normalized)
}

func FromContext(ctx context.Context) string {
	if ctx == nil {
		return ""
	}

	requestID, ok := ctx.Value(requestIDContextKey).(string)
	if !ok {
		return ""
	}

	return Normalize(requestID)
}
