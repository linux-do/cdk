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

package project

import (
	"reflect"
	"testing"
)

func TestFilterNewItems(t *testing.T) {
	tests := []struct {
		name          string
		items         []string
		existingItems []string
		want          []string
	}{
		{
			name:          "filters persisted and request duplicates",
			items:         []string{"already-there", "new", "new", "another", "already-there"},
			existingItems: []string{"already-there"},
			want:          []string{"new", "another"},
		},
		{
			name:  "preserves first occurrence order",
			items: []string{"b", "a", "b", "c", "a"},
			want:  []string{"b", "a", "c"},
		},
		{
			name:          "handles empty input",
			items:         nil,
			existingItems: []string{"existing"},
			want:          []string{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := filterNewItems(tt.items, tt.existingItems)
			if !reflect.DeepEqual(got, tt.want) {
				t.Fatalf("filterNewItems() = %#v, want %#v", got, tt.want)
			}
		})
	}
}
