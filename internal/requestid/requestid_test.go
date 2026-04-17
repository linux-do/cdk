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
	"testing"
)

func TestGetOrNew(t *testing.T) {
	t.Run("uses existing request id", func(t *testing.T) {
		requestID := GetOrNew("  req_existing  ")
		if requestID != "req_existing" {
			t.Fatalf("expected normalized request id, got %q", requestID)
		}
	})

	t.Run("generates request id when empty", func(t *testing.T) {
		requestID := GetOrNew("")
		if requestID == "" {
			t.Fatal("expected generated request id")
		}
		if len(requestID) <= len("req_") || requestID[:4] != "req_" {
			t.Fatalf("expected generated request id with prefix, got %q", requestID)
		}
	})
}

func TestContextRoundTrip(t *testing.T) {
	ctx := WithContext(context.Background(), " req_test ")

	requestID := FromContext(ctx)
	if requestID != "req_test" {
		t.Fatalf("expected request id to round trip, got %q", requestID)
	}

	if got := FromContext(context.Background()); got != "" {
		t.Fatalf("expected empty request id for bare context, got %q", got)
	}
}
