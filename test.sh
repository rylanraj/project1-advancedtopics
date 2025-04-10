#!/bin/bash

AUTH_URL=<url>

for i in {1..50}
do
  echo "[$i] Registering user user$i..."

  # 1. Register user
  curl -s -X POST "$AUTH_URL/register" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"user$i\", \"password\":\"pass123\"}" > /dev/null

  echo "[$i] Logging in user user$i..."

  # 2. Login to get JWT token
  TOKEN=$(curl -s -X POST "$AUTH_URL/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"user$i\", \"password\":\"pass123\"}" | jq -r .token)

  if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
    echo "❌ Failed to retrieve token for user$i"
    continue
  fi

  echo "[$i] Sending expense data for user$i..."

done

echo "✅ Load test completed."
