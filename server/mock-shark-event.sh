#!/bin/bash

# Mock script to simulate Cloud Scheduler publishing to Pub/Sub
# This sends a POST request to the local server with the Pub/Sub message format
#
# Usage: ./mock-shark-event.sh

data='{"event":"shark-event"}'
encoded_data=$(echo -n "$data" | base64 -w 0)

response=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "data": "'"$encoded_data"'",
      "attributes": {
        "source": "manual-trigger",
        "job": "shark-event-job"
      },
      "messageId": "mock-1234567890",
      "publishTime": "2024-01-01T00:00:00Z"
    },
    "subscription": "projects/fish-website-477404/subscriptions/shark-event-sub"
  }' \
  http://localhost:8080/pubsub/shark-event)

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d') 

if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
  echo "Response: $http_code"
else
  echo "Error: $http_code" >&2
  echo "$body" >&2
fi


