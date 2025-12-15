// AI Service - calls Vercel serverless function for secure API key handling

export const sendMessageToAI = async (history: { role: 'user' | 'model', content: string }[]) => {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ history }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.text;
  } catch (error: any) {
    console.error("AI Service Error:", error);
    return `Error: ${error.message || "Unknown error connecting to AI"}`;
  }
};
