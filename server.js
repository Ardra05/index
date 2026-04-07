const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json({ limit: '10mb' }));

const OPENROUTER_API_KEY = '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';

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/chat', async (req, res) => {
  console.log('=== API CALLED ===');
  try {
    const messages = req.body.messages || [];
    const userMessage = messages[messages.length - 1].content;

    console.log('Calling Llama 3.3 70B...');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + OPENROUTER_API_KEY,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'MeetingIQ'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        max_tokens: 2000,
        temperature: 0.1,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant. When asked to return JSON, return ONLY the raw JSON object. No markdown. No backticks. No explanation. Just pure JSON starting with { and ending with }.'
          },
          {
            role: 'user',
            content: userMessage
          }
        ]
      })
    });

    const rawText = await response.text();
    console.log('Status:', response.status);
    console.log('Response preview:', rawText.slice(0, 300));

    const data = JSON.parse(rawText);

    if (data.error) {
      console.log('API error:', data.error);
      return res.status(500).json({ error: { message: 'API error: ' + (data.error.message || JSON.stringify(data.error)) } });
    }

    const text = data.choices?.[0]?.message?.content || '';
    console.log('Success! Text length:', text.length);
    console.log('Text preview:', text.slice(0, 200));

    res.json({ content: [{ type: 'text', text: text }] });

  } catch (error) {
    console.log('Error:', error.message);
    res.status(500).json({ error: { message: 'Server error: ' + error.message } });
  }
});

app.listen(3000, function() {
  console.log('=== SERVER STARTED ===');
  console.log('Open: http://localhost:3000');
  console.log('Model: meta-llama/llama-3.3-70b-instruct:free');
  console.log('index.html exists:', fs.existsSync(path.join(__dirname, 'index.html')));
});
