# Mock script to simulate Cloud Scheduler publishing to Pub/Sub
# This sends a POST request to the local server with the Pub/Sub message format
#
# Usage: .\mock-shark-event.ps1

$data = '{"event":"shark-event"}'
$bytes = [System.Text.Encoding]::UTF8.GetBytes($data)
$encodedData = [Convert]::ToBase64String($bytes)

$body = @"
{
  "message": {
    "data": "$encodedData",
    "attributes": {
      "source": "manual-trigger",
      "job": "shark-event-job"
    },
    "messageId": "mock-1234567890",
    "publishTime": "2024-01-01T00:00:00Z"
  },
  "subscription": "projects/fish-website-477404/subscriptions/shark-event-sub"
}
"@

try {
    $response = Invoke-WebRequest -Uri "https://fishserver-1074820372233.us-east1.run.app/pubsub/shark-event" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body
    
    Write-Host "Response: $($response.StatusCode) $($response.Content)"
} catch {
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Error: $statusCode" -ForegroundColor Red
    } else {
        Write-Host "Error: $_" -ForegroundColor Red
    }
    Write-Host $_.Exception.Message
}


