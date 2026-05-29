const dotenv = require("dotenv");
dotenv.config();

const { callGeminiText } = require("./ai/gemini");

async function run() {
  console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "Present (ends in " + process.env.GEMINI_API_KEY.slice(-4) + ")" : "Not set");
  console.log("GEMINI_MODEL:", process.env.GEMINI_MODEL);

  const prompt = "Say 'hello world'";
  const res = await callGeminiText({ prompt });
  console.log("Result:", JSON.stringify(res, null, 2));
}

run();
