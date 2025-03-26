exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "This is a simple test endpoint that works",
      environment: process.env.NODE_ENV,
      hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
      timestamp: new Date().toISOString()
    }),
  };
}; 