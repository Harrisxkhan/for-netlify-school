export const handler = async (event, context) => {
  try {
    // Check if request method is POST
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method Not Allowed' }),
      };
    }

    // Activation codes - in a real app, these would be stored more securely
    const validActivationCodes = [
      "SCHOOL123",
      "EDUCATION456",
      "HOMEWORK789"
    ];

    // Parse request body
    const requestBody = JSON.parse(event.body);
    const { activationCode } = requestBody;
    
    if (!activationCode) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Activation code is required" }),
      };
    }
    
    // Check if the code is valid
    const isValid = validActivationCodes.includes(activationCode);
    
    if (isValid) {
      // Log successful activation
      console.log(`Successful activation with code: ${activationCode}`);
      
      // Generate a simple token (in a real app, use a more secure method)
      const activationToken = Buffer.from(`${activationCode}-${Date.now()}`).toString('base64');
      
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          success: true, 
          message: "Activation successful",
          token: activationToken
        }),
      };
    } else {
      // Log failed activation attempt
      console.log(`Failed activation attempt with code: ${activationCode}`);
      
      return {
        statusCode: 401,
        body: JSON.stringify({ 
          success: false, 
          error: "Invalid activation code" 
        }),
      };
    }
  } catch (error) {
    console.error("Activation error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to process activation code" }),
    };
  }
}; 