import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// This runs on Vercel serverless - API key is safe here
const API_KEY = process.env.GEMINI_API_KEY || "";

// GitHub raw content URL for repo context
const REPO_CONTEXT_URL = "https://raw.githubusercontent.com/jobjab-dev/fhevm-example-hub/main/app/src/data/repo_context.ts";

// Cache the context to avoid fetching on every request
let cachedContext: string | null = null;
let cacheTime = 0;
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

async function fetchRepoContext(): Promise<string> {
    const now = Date.now();

    // Return cached context if still valid
    if (cachedContext && (now - cacheTime) < CACHE_DURATION) {
        return cachedContext;
    }

    try {
        const response = await fetch(REPO_CONTEXT_URL);
        if (!response.ok) {
            console.error("Failed to fetch repo context:", response.status);
            return "";
        }

        const tsContent = await response.text();

        // Extract the string content from: export const REPO_CONTEXT = "...";
        const match = tsContent.match(/export const REPO_CONTEXT = (["'`])(.+)\1;?/s);
        if (match) {
            // Unescape the JSON string
            cachedContext = JSON.parse(match[0].replace('export const REPO_CONTEXT = ', '').replace(/;$/, ''));
            cacheTime = now;
            return cachedContext!;
        }

        return "";
    } catch (error) {
        console.error("Error fetching repo context:", error);
        return "";
    }
}

const BASE_SYSTEM_PROMPT = `You are **FHEVM Assistant**, an expert AI coding assistant for Zama's FHEVM (Fully Homomorphic Encryption Virtual Machine).
You are integrated into the "FHEVM Example Hub" application.

**Your Goal:** help users build confidential smart contracts by explaining concepts, finding examples, and writing code.

**Instructions:**
1.  **Be Knowledgeable**: You are an expert in FHEVM and FHE concepts.
2.  **Zama Expert**: Explain FHE concepts (e.g., "Why use ebool?", "How does FHE.select work?") clearly.
3.  **Code First**: When asked for help, provide code snippets or write new code based on FHEVM patterns.
4.  **Navigation**: If the user is looking for a specific use case, tell them which example key to use (e.g., \`npx jobjab-fhevm-examples blind-auction ./my-project\`).
5.  **Personality**: detailed, technical, yet accessible. You are a passionate advocate for privacy.

**Constraints:**
- You are a text-based AI in a browser. You cannot execute commands.
- Always assume the user has the Zama environment set up.
`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    // Check API key
    if (!API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY not configured on server" });
    }

    try {
        const { history } = req.body;

        if (!history || !Array.isArray(history)) {
            return res.status(400).json({ error: "Invalid request body" });
        }

        // Fetch repo context from GitHub
        const repoContext = await fetchRepoContext();

        // Build full system prompt with context
        let systemPrompt = BASE_SYSTEM_PROMPT;
        if (repoContext) {
            systemPrompt += `\n\n**Knowledge Base:**\nYou have access to the FHEVM Example Hub codebase:\n\n${repoContext}`;
        }

        const ai = new GoogleGenAI({ apiKey: API_KEY });

        // Convert history to Gemini format
        const contents = history.map((msg: { role: string; content: string }) => ({
            role: msg.role,
            parts: [{ text: msg.content }],
        }));

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents,
            config: {
                systemInstruction: systemPrompt,
            },
        });

        return res.status(200).json({ text: response.text });
    } catch (error: any) {
        console.error("Gemini API Error:", error);
        return res.status(500).json({ error: error.message || "Unknown error" });
    }
}
