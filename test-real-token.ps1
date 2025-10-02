# Test Your Real Google ID Token
# Copy the id_token from your OAuth Playground response and test it

$baseUrl = "http://localhost:5000"
$headers = @{ "Content-Type" = "application/json" }

# Your real Google ID token from OAuth Playground
$realToken = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE3ZjBmMGYxNGU5Y2FmYTlhYjUxODAxNTBhZTcxNGM5ZmQxYjVjMjYiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI0MDc0MDg3MTgxOTIuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI0MDc0MDg3MTgxOTIuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTc4NzEyNTE3MDY4NjA0MzgzMzAiLCJlbWFpbCI6ImlwYWR0YWxAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImF0X2hhc2giOiJ2VWVsblZhSmIxTGZRU24taUdNVGRnIiwibmFtZSI6IteY15wg15DXqNeg15XXnyIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NJM241b0tNVTdnNzN5SVNnbzh4X1M2VGxLekdMU2Y1aUJ3M21Ca3RKbDlUeVNKVEtyeGdBPXM5Ni1jIiwiZ2l2ZW5fbmFtZSI6IteY15wiLCJmYW1pbHlfbmFtZSI6IteQ16jXoNeV158iLCJpYXQiOjE3NTkzODM0MTAsImV4cCI6MTc1OTM4NzAxMH0.kzsLlXMMas2ujf-0HEoWfye-XJCX_zIg824-lJFSdCybwlz2czxZwWQcMxddPlc4gC5KHNfGVjzgKHulU9aVLXMtNoA9zWDcFmd7fo7iiGfmsYeXzF_II8sRgsJYkBcg4_QtGRlyxUNKLZcaOTQRnu2fAJAkNEFOkQQQvswTkGBaSkMr9hxJYK-oRLghGzNaWlchaLY2wcD-APqHazJyLzh5N-xbDNZl2ffygzkW8odYPCZURJiZY2Hdqr9R0XoIECFrMz6MFFilXbFB_qB1WtqiMw5AKguak-fmUJ7wTIGCiHnFBjw1JPMARSZctbPreLxkdDItW81pX8GAJ_xBdw"

Write-Host "🚀 Testing Real Google Authentication" -ForegroundColor Green
Write-Host "Token User: ipadtal@gmail.com" -ForegroundColor Yellow
Write-Host ""

# Test Google Sign-In
Write-Host "1. Testing Google Sign-In with real token..." -ForegroundColor Cyan
try {
    $body = @{ idToken = $realToken } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/api/google/auth" -Method POST -Body $body -Headers $headers
    
    Write-Host "✅ SUCCESS! User authenticated!" -ForegroundColor Green
    Write-Host "Status: $($response.status)" -ForegroundColor Yellow
    Write-Host "User: $($response.user.name)" -ForegroundColor Yellow
    Write-Host "Email: $($response.user.email)" -ForegroundColor Yellow
    Write-Host "Google Sub: $($response.user.googleSub)" -ForegroundColor Yellow
    Write-Host "Business Completed: $($response.user.businessCompleted)" -ForegroundColor Yellow
    
    $googleSub = $response.user.googleSub
    Write-Host ""
    
    # Test Business Update
    Write-Host "2. Testing Business Information Update..." -ForegroundColor Cyan
    $businessBody = @{
        googleSub = $googleSub
        businessName = "Tal's Amazing Restaurant"
        ownerName = "Tal Ashkenazi"
        businessNumber = "123456789"
        address = "123 Main Street"
        city = "Tel Aviv"
        zip = "12345"
        phone = "03-1234567"
    } | ConvertTo-Json
    
    $businessResponse = Invoke-RestMethod -Uri "$baseUrl/api/google/user/business" -Method POST -Body $businessBody -Headers $headers
    
    Write-Host "✅ SUCCESS! Business information updated!" -ForegroundColor Green
    Write-Host "Business Name: $($businessResponse.user.business.businessName)" -ForegroundColor Yellow
    Write-Host "Owner: $($businessResponse.user.business.ownerName)" -ForegroundColor Yellow
    Write-Host "Business Completed: $($businessResponse.user.businessCompleted)" -ForegroundColor Yellow
    Write-Host ""
    
    # Test Get User
    Write-Host "3. Testing Get User Information..." -ForegroundColor Cyan
    $userResponse = Invoke-RestMethod -Uri "$baseUrl/api/google/user/$googleSub" -Method GET -Headers $headers
    
    Write-Host "✅ SUCCESS! User information retrieved!" -ForegroundColor Green
    Write-Host "Complete user profile retrieved successfully!" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "🎉 ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "✅ Your Google Authentication system is working perfectly!" -ForegroundColor Green
    Write-Host "✅ User creation/login works" -ForegroundColor Green
    Write-Host "✅ Business profile updates work" -ForegroundColor Green
    Write-Host "✅ User retrieval works" -ForegroundColor Green
    
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Status Code: $statusCode" -ForegroundColor Red
    }
}
