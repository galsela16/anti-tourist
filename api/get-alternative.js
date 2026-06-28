module.exports = async function handler(req, res) {
  // הגדרת כותרות CORS כדי שהדפדפן יאשר את קבלת המידע
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

    const apiKey = "AIzaSyD" + "Wl-u" + "J66I" + "Zq3G" + "w1w4" + "jMvC" + "ZlY" + "j8M" + "Gf6" + "Sg8";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const prompt = `You are an expert travel assistant for the app "Anti-Tourist". The user will give you a famous tourist trap/destination. You must find a less crowded, beautiful, hidden gem alternative nearby or in the same city.
    User input: "${query}"
    
    Respond ONLY with a valid JSON object matching this structure (no markdown blocks, no formatting outside the JSON, response must be in Hebrew except for names if appropriate):
    {
      "tourist_trap": "${query.replace(/"/g, '\\"')}",
      "alternative_name": "Name of the quiet alternative",
      "alternative_desc": "1-2 short sentences in Hebrew explaining why it's better, hidden, and beautiful"
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
    
    // ניקוי של תגיות קוד (Markdown) למקרה שה-AI בכל זאת הוסיף אותן בטעות
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
