const fs = require('fs');
const fetch = require('node-fetch');
const pMap = require('p-map');
const csv = require('csv-parser');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  throw new Error('ANTHROPIC_API_KEY is not set in the environment variables');
}

const client = {
  messages: {
    create: async (options) => {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(options)
      });
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      return response.json();
    }
  }
};

async function processItem(prompt) {
  try {
    const message = await client.messages.create({
      model: "claude-3-sonnet-20240620",
      max_tokens: 1000,
      temperature: 0,
      system: "You are a social media response scorer. Rate the user message on a scale of 1-10, considering their positivity about AI. Respond with only the numeric score.",
      messages: [{ role: "user", content: prompt }]
    });
    return { prompt, score: parseInt(message.content[0].text.trim()) };
  } catch (error) {
    console.error(`Error processing prompt: "${prompt}". Error: ${error.message}`);
    return { prompt, score: null, error: error.message };
  }
}

(async () => {
  const prompts = [];
  fs.createReadStream('user_messages.csv')
    .pipe(csv())
    .on('data', (data) => prompts.push(data.message))
    .on('end', async () => {
      try {
        const answers = await pMap(prompts, processItem, { concurrency: 10 });
        console.log(JSON.stringify(answers, null, 2));
        
        // Optionally, write results to a file
        fs.writeFileSync('results.json', JSON.stringify(answers, null, 2));
      } catch (error) {
        console.error('Error processing prompts:', error);
      }
    });
})();