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

package payment

import (
	"strings"
	"testing"
)

func TestBuildSignOrdering(t *testing.T) {
	// 示例取自 payment.txt:
	// payload="money=10&name=Test&out_trade_no=M20250101&pid=001&type=epay"
	params := map[string]string{
		"pid":          "001",
		"type":         "epay",
		"name":         "Test",
		"money":        "10",
		"out_trade_no": "M20250101",
	}
	got := BuildSign(params, "SECRET")
	if len(got) != 32 {
		t.Fatalf("want 32-char md5 hex, got %d chars: %s", len(got), got)
	}
	if got != strings.ToLower(got) {
		t.Fatalf("signature must be lowercase hex, got %s", got)
	}
}

func TestBuildSignIgnoresSignAndEmpty(t *testing.T) {
	withSign := map[string]string{
		"pid":          "001",
		"type":         "epay",
		"name":         "Test",
		"money":        "10",
		"out_trade_no": "M20250101",
		"sign":         "ignoreme",
		"sign_type":    "MD5",
		"device":       "",
	}
	withoutSign := map[string]string{
		"pid":          "001",
		"type":         "epay",
		"name":         "Test",
		"money":        "10",
		"out_trade_no": "M20250101",
	}
	a := BuildSign(withSign, "S")
	b := BuildSign(withoutSign, "S")
	if a != b {
		t.Fatalf("sign/sign_type/empty should be excluded:\n a=%s\n b=%s", a, b)
	}
}

func TestVerifySignRoundTrip(t *testing.T) {
	params := map[string]string{
		"pid":          "001",
		"type":         "epay",
		"name":         "Test",
		"money":        "10.00",
		"out_trade_no": "CDK20260420abcd1234",
	}
	secret := "HELLO_WORLD"
	params["sign"] = BuildSign(params, secret)
	if !VerifySign(params, secret) {
		t.Fatal("VerifySign should accept a freshly-built signature")
	}
	params["money"] = "20.00"
	if VerifySign(params, secret) {
		t.Fatal("VerifySign should reject a tampered param")
	}
}

func TestEncryptDecryptRoundTrip(t *testing.T) {
	key := "0123456789abcdef0123456789abcdef" // 32 字节
	plain := "some-super-secret-client-key"
	enc, err := EncryptSecret(plain, key)
	if err != nil {
		t.Fatalf("encrypt err: %v", err)
	}
	if enc == "" || enc == plain {
		t.Fatal("ciphertext looks invalid")
	}
	got, err := DecryptSecret(enc, key)
	if err != nil {
		t.Fatalf("decrypt err: %v", err)
	}
	if got != plain {
		t.Fatalf("round-trip mismatch: %q != %q", got, plain)
	}

	// 不同密钥应该解不出
	if _, err := DecryptSecret(enc, "another-key-of-len-32-xxxxxxxxxxxxxxx"); err == nil {
		t.Fatal("wrong key should fail to decrypt")
	}
}

func TestEncryptNonceRandomness(t *testing.T) {
	key := "0123456789abcdef0123456789abcdef"
	a, _ := EncryptSecret("abc", key)
	b, _ := EncryptSecret("abc", key)
	if a == b {
		t.Fatal("two encryptions of the same plaintext must differ (random nonce)")
	}
}
