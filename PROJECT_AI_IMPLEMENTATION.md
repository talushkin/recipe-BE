# Project AI Endpoint - Implementation Summary

## What Was Added

### 1. Controller Function (`controllers/openAIController.js`)
Added `getProjectAI` function that:
- Generates professional job posts in Hebrew or English
- Follows strict formatting rules (300 letters max per field)
- Returns structured output with three sections: title, description, requirements
- Uses GPT-4o-mini model (or MODEL env variable)
- Temperature set to 0.2 for consistent, precise output

**Parameters:**
- `lang`: Language (default: "עברית")
- `writingStyle`: Writing style (default: "Subtle marketing")
- `freeText`: Required - Free text to embed in description (in Hebrew)
- `jobRole`: Required - Job role title
- `jobType`: Job type (e.g., "משרה מלאה")
- `yearsExp`: Years of experience (e.g., "1-2", "0", "3+")
- `mustSkills`: Required skills (comma-separated)
- `niceSkills`: Nice-to-have skills (comma-separated)

### 2. Route (`routes/openAIRoutes.js`)
Added POST endpoint: `/api/openai/project-ai`
- Requires authentication (auth middleware)
- Validates required fields (freeText, jobRole)
- Returns generated job post with all input parameters

### 3. REST Examples (`rest/project-ai.rest`)
Created test file with 5 examples:
1. Hebrew firmware developer position
2. English software developer position
3. Entry-level Frontend developer (no experience)
4. Senior VP Engineering position
5. Backend developer (production example)

## Output Format

The AI returns text in this exact structure:
```
||| [Job Title]
%%% [Job Description]
&&& [Requirements] ^^^
```

Example response:
```json
{
  "lang": "עברית",
  "writingStyle": "Subtle marketing",
  "freeText": "עובד/ת זמני/ת לפרויקט פיתוח חכם",
  "jobRole": "מפתח/ת תוכנה - פיתוח קושחה",
  "jobType": "משרה מלאה",
  "yearsExp": "1-2",
  "mustSkills": "C, C++, embedded systems, RTOS",
  "niceSkills": "Bluetooth, CAN, OTA updates",
  "output": "||| דרוש/ה מפתח/ת תוכנה - פיתוח קושחה\n%%% ...\n&&& ... ^^^"
}
```

## Key Features

1. **Supreme Rule**: Each field (title, description, requirements) limited to 300 letters
2. **Hebrew/English Support**: Handles both languages with proper formatting
3. **Smart Rules**:
   - Don't translate English tech terms (backend, frontend, etc.)
   - Handle VP titles (explains as סמנכ"ל in Hebrew)
   - Experience mapping (0 → "ללא ניסיון", 1-2 → "ניסיון של שנה-שנתיים")
   - No company names or domain mentions
   - Round bullets (•) only in requirements
   - Must/Nice-to-have skills properly categorized

## Testing

To test locally:
1. Make sure your backend server is running (`node server.js`)
2. Open `rest/project-ai.rest` in VS Code
3. Replace `YOUR_TOKEN_HERE` with your actual auth token
4. Click "Send Request" above any test case

## Environment Variables Required

✅ Already configured in your `.env`:
- `OPENAI_API_KEY`: Your OpenAI API key
- `OPENAI_API_URL`: https://api.openai.com/v1/
- `MODEL` (optional): Defaults to "gpt-4o-mini"

## Next Steps

1. Test the endpoint with the provided REST examples
2. Adjust the prompt rules if needed based on output quality
3. Consider adding more validation or post-processing if required
4. Monitor OpenAI API usage and costs
