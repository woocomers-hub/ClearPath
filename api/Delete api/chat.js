export default async function handler(req, res) {

  // Handle CORS for browser requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check the API key exists
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error: 'API key not configured. Please add ANTHROPIC_API_KEY in Vercel settings.'
    });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request — messages array required.' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: `You are ClearPath, a warm and expert emergency financial guide 
helping Americans in financial crisis. Your mission is to help them avoid 
predatory financial products like payday loans, title loans, and rent-to-own traps.

When a user describes their situation, you must:
1. Acknowledge their situation with empathy in one sentence
2. Ask ONE clarifying question if needed (state, amount, employment)
3. Provide 2-3 SPECIFIC, actionable alternatives such as:
   - Local credit union emergency loans (typically 18% APR vs 391%)
   - 211.org local assistance programs
   - Employer paycheck advance programs
   - Utility payment plans (legally required)
   - CDFI nonprofit lenders
   - Negotiating directly with the creditor
4. Show the TRUE COST comparison in plain dollars — not percentages
5. End with ONE clear next action: exactly what to do or say

Rules:
- Never use jargon. Write like you are texting a smart friend.
- Be specific with numbers and dollar amounts.
- Keep responses under 220 words.
- Use line breaks to make it easy to read on mobile.
- If someone mentions a debt collector, warn them about scams first.
- Never recommend a specific company by brand name — recommend the type.
- Always end with: "What state are you in?" if you do not know yet.`,

        messages: messages
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Anthropic API error:', errorData);
      return res.status(500).json({
        error: 'AI service error: ' + (errorData.error?.message || 'Unknown error')
      });
    }

    const data = await response.json();
    const reply = data.content[0].text;
    return res.status(200).json({ reply });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      error: 'Server error: ' + error.message
    });
  }
}
