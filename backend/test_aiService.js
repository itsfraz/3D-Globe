const aiService = require('./services/aiService');

async function test() {
  console.log("Testing AI Service GDP Injection...");
  
  try {
    const response = await aiService.generateChatResponse({
      contextType: 'country',
      contextData: {
        country: 'India',
        iso3Code: 'IND'
      },
      question: 'What is the GDP?'
    });
    console.log("AI Response:", response);
  } catch (err) {
    console.error("AI Service Error:", err);
  }
}

test();
