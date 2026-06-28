module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Missing query' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Missing API Key configuration on Vercel' });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    // הנחיות חדשות וחכמות ל-AI לבדיקת עומס אמיתית
    const prompt = `You are an expert travel assistant for the app "Anti-Tourist". The user will provide a destination or place name.
    Your task is to:
    1. Determine honestly if this place is a famous, heavily crowded tourist trap or highly congested destination.
    2. If it IS crowded (like Eiffel Tower, Trevi Fountain, Western Wall on holidays), set "is_crowded" to true, and find a less crowded, beautiful hidden gem alternative nearby.
    3. If it IS NOT crowded (like a quiet town, Dimona, a remote nature reserve, or a peaceful neighborhood), set "is_crowded" to false. Acknowledge it's a great quiet choice, and suggest an interesting lesser-known spot nearby to enhance their visit.
    
    User input: "${query}"
    
    Respond ONLY with a valid JSON object matching this structure (no markdown blocks, response must be in Hebrew except for names if appropriate):
    {
      "is_crowded": true or false,
      "status_title": "Short text like '⚠️ מקום המוני ועמוס!' or '✅ אחלה בחירה! מקום רגוע'",
      "status_desc": "A short description in Hebrew (e.g., 'במקום להצטופף ב...' or 'המקום הזה בדרך כלל שקט ולא נחשב למלכודת תיירים. אם אתם שם, כדאי לבקר גם ב-')",
      "tourist_trap": "${query.replace(/"/g, '\\"')}",
      "alternative_name": "Name of the quiet alternative or nearby recommended spot",
      "alternative_desc": "1-2 short sentences in Hebrew explaining the recommendation"
    }`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(500).json({ error: `Gemini Error: ${errText}` });
    }

    const data = await response.json();
    let cleanText = data.candidates[0].content.parts[0].text.trim();
    
    if (cleanText.startsWith("```json")) {
        cleanText = cleanText.substring(7, cleanText.length - 3).trim();
    } else if (cleanText.startsWith("```")) {
        cleanText = cleanText.substring(3, cleanText.length - 3).trim();
    }

    const result = JSON.parse(cleanText);
    return res.status(200).json(result);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
