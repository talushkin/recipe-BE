# Google Authentication API Testing Script
# PowerShell script to test Google Auth endpoints

$baseUrl = "http://localhost:5000"
$headers = @{ "Content-Type" = "application/json" }

Write-Host "🚀 Testing Google Authentication Endpoints" -ForegroundColor Green
Write-Host "Base URL: $baseUrl" -ForegroundColor Yellow
Write-Host ""

# Test 1: Server Status
Write-Host "1. Testing Server Status..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/" -Method GET -Headers $headers
    Write-Host "✅ Server is running" -ForegroundColor Green
    Write-Host "Available Google Auth routes:" -ForegroundColor Yellow
    $response.routes.googleAuth | ConvertTo-Json
} catch {
    Write-Host "❌ Server not responding: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Missing idToken
Write-Host "2. Testing Missing idToken (should return 400)..." -ForegroundColor Cyan
try {
    $body = @{} | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/api/google/auth" -Method POST -Body $body -Headers $headers
    Write-Host "❌ Should have failed" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "✅ Correctly returned 400 for missing idToken" -ForegroundColor Green
    } else {
        Write-Host "❌ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 3: Invalid idToken
Write-Host "3. Testing Invalid idToken (should return 401)..." -ForegroundColor Cyan
try {
    $body = @{
        idToken = "invalid_token_123"
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/api/google/auth" -Method POST -Body $body -Headers $headers
    Write-Host "❌ Should have failed" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ Correctly returned 401 for invalid idToken" -ForegroundColor Green
    } else {
        Write-Host "❌ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 4: Business Update - Missing Fields
Write-Host "4. Testing Business Update with Missing Fields (should return 400)..." -ForegroundColor Cyan
try {
    $body = @{
        googleSub = "test_user"
        businessName = "Test Business"
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/api/google/user/business" -Method POST -Body $body -Headers $headers
    Write-Host "❌ Should have failed" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "✅ Correctly returned 400 for missing fields" -ForegroundColor Green
    } else {
        Write-Host "❌ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 5: Business Update - User Not Found
Write-Host "5. Testing Business Update for Non-existent User (should return 404)..." -ForegroundColor Cyan
try {
    $body = @{
        googleSub = "non_existent_user_123"
        businessName = "Test Business"
        ownerName = "Test Owner"
        businessNumber = "123456789"
        address = "Test Address"
        city = "Test City"
        zip = "12345"
        phone = "123-456-7890"
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/api/google/user/business" -Method POST -Body $body -Headers $headers
    Write-Host "❌ Should have failed" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "✅ Correctly returned 404 for user not found" -ForegroundColor Green
    } else {
        Write-Host "❌ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 6: Get User - Not Found
Write-Host "6. Testing Get User for Non-existent User (should return 404)..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/google/user/non_existent_user_123" -Method GET -Headers $headers
    Write-Host "❌ Should have failed" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "✅ Correctly returned 404 for user not found" -ForegroundColor Green
    } else {
        Write-Host "❌ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

Write-Host "🎉 All validation tests completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 To test with real Google tokens:" -ForegroundColor Yellow
Write-Host "1. Get a Google ID token from your frontend or Google OAuth Playground" -ForegroundColor White
Write-Host "2. Replace 'REAL_GOOGLE_ID_TOKEN' in the manual test section below" -ForegroundColor White
Write-Host "3. Run the manual tests" -ForegroundColor White
Write-Host ""

# Manual testing section (commented out - uncomment and add real tokens to test)
Write-Host "📋 Manual Testing Examples:" -ForegroundColor Yellow
Write-Host @"
# Uncomment and replace with real tokens to test:

# Test Google Sign-In
# `$realToken = "your_real_google_id_token_here"
# `$body = @{ idToken = `$realToken } | ConvertTo-Json
# `$response = Invoke-RestMethod -Uri "`$baseUrl/api/google/auth" -Method POST -Body `$body -Headers `$headers
# Write-Host "User created/logged in:" -ForegroundColor Green
# `$response | ConvertTo-Json -Depth 5

# Test Business Update (use googleSub from above response)
# `$businessBody = @{
#     googleSub = "google_sub_from_above"
#     businessName = "My Restaurant"
#     ownerName = "Chef John"
#     businessNumber = "123456789"
#     address = "123 Main St"
#     city = "Tel Aviv"
#     zip = "12345"
#     phone = "03-1234567"
# } | ConvertTo-Json
# `$businessResponse = Invoke-RestMethod -Uri "`$baseUrl/api/google/user/business" -Method POST -Body `$businessBody -Headers `$headers
# Write-Host "Business updated:" -ForegroundColor Green
# `$businessResponse | ConvertTo-Json -Depth 5
"@ -ForegroundColor Gray
