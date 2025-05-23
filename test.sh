#!/bin/bash

read -p "Enter the AUTH_URL: " AUTH_URL

i=1 # counter

while true
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
    ((i++))
    continue
  fi

  # 3. Test the protected route
  echo "[$i] Testing protected route for user$i..."

  PROTECTED_RESPONSE=$(curl -s -X GET "$AUTH_URL/protected" \
    -H "Authorization: Bearer $TOKEN")

  if [[ "$PROTECTED_RESPONSE" == *"Access granted"* ]]; then
    echo "✅ Protected route access successful for user$i"
  else
    echo "❌ Protected route access failed for user$i: $PROTECTED_RESPONSE"
  fi

  ((i++))
done

echo "✅ Load test completed."
