const getWeeklyInsight = async (logs) => {
  if (!process.env.GEMINI_API_KEY) {
    return 'AI insights are not configured yet. Add your Gemini API key to the .env file to enable this feature.';
  }

  if (!logs || logs.length === 0) {
    return 'No data logged this week yet. Start tracking your steps, sleep, and water intake to receive personalised weekly insights!';
  }

  const avg = (field) => {
    const vals = logs.filter(l => l[field] != null).map(l => l[field]);
    if (!vals.length) return null;
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
  };

  const lines = [
    avg('steps')      != null ? `- Average daily steps: ${Math.round(avg('steps'))}` : null,
    avg('sleepHours') != null ? `- Average sleep: ${avg('sleepHours')} hours per night` : null,
    avg('mood')       != null ? `- Average mood score: ${avg('mood')}/5` : null,
    avg('waterMl')    != null ? `- Average water intake: ${Math.round(avg('waterMl'))}ml per day` : null,
    avg('weight')     != null ? `- Most recent weight: ${avg('weight')}kg` : null,
  ].filter(Boolean);

  const prompt = `You are a friendly, encouraging health coach. A user tracked their health this week with these results:

${lines.join('\n')}

Give exactly 3 short, specific, actionable tips to help them improve next week.
Be warm and positive. Keep each tip to 1–2 sentences.
Format as a numbered list: 1. ... 2. ... 3. ...
Do not add any introduction or closing sentence.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API error response:', JSON.stringify(data));
      return 'Could not generate insight right now. Keep logging your data and try again tomorrow!';
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error('Gemini unexpected response shape:', JSON.stringify(data));
      return 'Could not generate insight right now. Keep logging your data and try again tomorrow!';
    }

    return text;
  } catch (error) {
    console.error('Gemini fetch error:', error);
    return 'Could not generate insight right now. Keep logging your data and try again tomorrow!';
  }
};

module.exports = { getWeeklyInsight };