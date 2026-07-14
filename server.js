// server.js
import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import OpenAI from 'openai';
import { Client } from '@notionhq/client';
import { cloneRouter } from './clone/routes.js';

dotenv.config();
const app = express();
// 25mb allows base64 voice-sample uploads to /clone/voice/samples
app.use(express.json({ limit: '25mb' }));

const PORT = process.env.PORT || 3000;

// === Init Notion + GPT ===
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const notionAgentMap = process.env.NOTION_AGENT_DATABASES 
  ? JSON.parse(process.env.NOTION_AGENT_DATABASES)
  : {};

const openai = process.env.LLM_API_KEY 
  ? new OpenAI({ apiKey: process.env.LLM_API_KEY })
  : null;

// === POST endpoint: /ask-agent ===
app.post('/ask-agent', async (req, res) => {
  const { message, agent = 'alex', user = 'richard' } = req.body;

  if (!openai) {
    return res.status(500).json({ 
      error: 'LLM not configured. Please set LLM_API_KEY in .env file.' 
    });
  }

  if (!notionAgentMap[agent]) {
    return res.status(400).json({ 
      error: `Agent "${agent}" not found in NOTION_AGENT_DATABASES configuration.` 
    });
  }

  try {
    // 🔍 Lookup recent memory from Notion
    const memory = await notion.databases.query({
      database_id: notionAgentMap[agent],
      page_size: 5,
      sorts: [{ property: 'Timestamp', direction: 'descending' }]
    });

    const memoryText = memory.results.map((item) => item.properties.Message?.title?.[0]?.plain_text || '')
      .filter(Boolean)
      .join('\n- ');

    // 🧠 Build GPT prompt
    const prompt = `
You are ${agent.toUpperCase()}, an executive AI assistant for Richard.
Your recent memory includes:
${memoryText || '(no memory found)'}

The user says: "${message}"
Respond conversationally and clearly.
    `;

    const chat = await openai.chat.completions.create({
      model: process.env.LLM_MODEL,
      messages: [{ role: 'user', content: prompt }],
    });

    const reply = chat.choices[0].message.content;

    // 📝 Log this to Notion
    await notion.pages.create({
      parent: { database_id: notionAgentMap[agent] },
      properties: {
        Message: {
          title: [{ text: { content: message } }],
        },
        Agent: { select: { name: agent } },
        User: { rich_text: [{ text: { content: user } }] },
        Type: { select: { name: 'Input' } },
        Timestamp: { date: { start: new Date().toISOString() } }
      }
    });

    await notion.pages.create({
      parent: { database_id: notionAgentMap[agent] },
      properties: {
        Message: {
          title: [{ text: { content: reply } }],
        },
        Agent: { select: { name: agent } },
        User: { rich_text: [{ text: { content: agent } }] },
        Type: { select: { name: 'Reply' } },
        Timestamp: { date: { start: new Date().toISOString() } }
      }
    });

    res.json({ reply });

  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Agent processing failed.' });
  }
});

// === Richard's AI clone: /clone/* (see clone/README section in README.md) ===
app.use('/clone', cloneRouter(openai));
app.get('/', (req, res) => res.redirect('/clone/app'));

// Start server
app.listen(PORT, () => {
  console.log(`✅ Agent server is running on PORT: ${PORT}`);
});
