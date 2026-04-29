#!/bin/sh

set -e

replace_placeholder() {
  local placeholder="$1"
  local real_value="$2"

  if [ -z "$real_value" ]; then
    echo "⚠️ WARNING: Environment variable for placeholder '${placeholder}' is not set. Skipping replacement."
    return 0
  fi

  echo "🔍 Replacing placeholder '${placeholder}' with value '${real_value}'"

  local escaped
  escaped=$(printf '%s\n' "$real_value" | sed 's/[&/\]/\\&/g')

  local files
  files=$(grep -rl "$placeholder" /app/.next || true)

  if [ -z "$files" ]; then
    echo "⚠️  WARNING: placeholder '${placeholder}' not found in any file"
  else
    local count
    count=$(echo "$files" | wc -l)
    echo "$files" | xargs sed -i "s|${placeholder}|${escaped}|g"
    echo "✅ Replaced '${placeholder}' in ${count} file(s)"
  fi
}

replace_placeholder "__NEXT_PUBLIC_FRONTEND_BASE_URL__"  "$NEXT_PUBLIC_FRONTEND_BASE_URL"
replace_placeholder "https://build-placeholder.invalid"  "$NEXT_PUBLIC_BACKEND_BASE_URL"
replace_placeholder "__NEXT_PUBLIC_HCAPTCHA_SITE_KEY__"  "$NEXT_PUBLIC_HCAPTCHA_SITE_KEY"
replace_placeholder "__HCAPTCHA_SECRET_KEY__"  "$HCAPTCHA_SECRET_KEY"

exec "$@"
