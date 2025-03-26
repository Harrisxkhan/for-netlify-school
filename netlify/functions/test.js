export const handler = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ status: "Server is running" }),
  };
}; 