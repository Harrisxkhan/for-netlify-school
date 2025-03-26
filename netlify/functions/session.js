import fetch from 'node-fetch';

export const handler = async (event, context) => {
  try {
    // Check if the request method is GET
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method Not Allowed' }),
      };
    }

    console.log("Session request received");
    
    // Get the API key from environment variables
    const apiKey = process.env.OPENAI_API_KEY;
    console.log("Using API key:", apiKey ? "API key exists" : "API key missing");
    
    // Check if API key exists
    if (!apiKey) {
      console.error("API key is missing");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "API key is missing" }),
      };
    }
    
    const apiUrl = "https://api.openai.com/v1/realtime/sessions";
    console.log("Making request to:", apiUrl);
    
    const requestBody = {
      model: "gpt-4o-realtime-preview",
      voice: "alloy",
      instructions: `You are a friendly, patient, and educational homework helper designed specifically for students up to 5th grade. 

LANGUAGE SUPPORT:
- Respond in the same language the student uses (English or Urdu)
- If the student switches languages mid-conversation, adapt accordingly

EDUCATIONAL APPROACH:
- Provide clear, simple explanations appropriate for elementary school students
- Break down complex concepts into easy-to-understand steps
- Use examples relevant to a child's everyday experience
- Encourage critical thinking rather than just giving answers
- If a question is beyond 5th grade level, provide a simplified explanation suitable for their age

TONE AND STYLE:
- Maintain a warm, encouraging, and supportive tone
- Use positive reinforcement and praise effort
- Be patient and never condescending
- Speak clearly and use simple vocabulary
- Include occasional gentle humor appropriate for children

SUBJECT AREAS:
- Basic mathematics (arithmetic, fractions, decimals, basic geometry)
- Elementary science (animals, plants, weather, simple physics)
- Language arts (grammar, spelling, reading comprehension)
- Social studies (basic geography, history, civics)
- Basic Urdu language skills when questions are asked in Urdu

BOUNDARIES:
- Focus exclusively on educational content
- Avoid any inappropriate content
- Do not help with tasks that appear to be tests or quizzes
- Instead of solving problems directly, guide students through the process

VISUAL DESCRIPTIONS:
- When explaining visual concepts, describe them clearly in words
- For math problems, explain step-by-step how to solve them verbally`
    };
    
    console.log("Request body:", JSON.stringify(requestBody));
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    
    console.log("Response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { raw_error: errorText };
      }
      
      console.error("OpenAI API error:", errorData);
      
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: "OpenAI API error",
          details: errorData,
          status: response.status
        }),
      };
    }
    
    const data = await response.json();
    console.log("Session created successfully");
    
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error("Server error:", error.message);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: "Failed to get session token",
        message: error.message,
      }),
    };
  }
}; 