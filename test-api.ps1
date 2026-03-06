$body = @{
    messages = @(
        @{role = "user"; content = "hello"}
    )
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri 'http://localhost:3001/api/ai/chat' -Method Post -Body $body -ContentType 'application/json' -TimeoutSec 30
    $response.Content
} catch {
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)"
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody"
    }
}
