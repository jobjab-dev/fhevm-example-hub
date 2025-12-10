import { GoogleGenAI } from "@google/genai";
import catalogData from '../data/catalog.json';
import { REPO_CONTEXT } from '../data/repo_context';

const API_KEY = (import.meta.env.VITE_GEMINI_API_KEY || "").trim();
console.log("Gemini API Key configured:", API_KEY ? "Yes" : "No (Check .env)");

// Construct context from catalog (metadata)
const examplesMetadata = Object.entries(catalogData).map(([key, data]: [string, any]) => {
  return `- **${data.title}** (Key: \`${key}\`): ${data.description} (Tags: ${data.tags.join(', ')})`;
}).join('\n');

const SYSTEM_PROMPT = `You are **FHEVM Assistant**, an expert AI coding assistant for Zama's FHEVM (Fully Homomorphic Encryption Virtual Machine).
You are integrated into the "FHEVM Example Hub" application.

**Your Goal:** help users build confidential smart contracts by explaining concepts, finding examples, and writing code based on the provided repository context.

**Knowledge Base:**
You have access to the ENTIRE codebase of the FHEVM Example Hub, including all solidity contracts, tests, and documentation.

**CONTEXT STARTS HERE**
${REPO_CONTEXT}
**CONTEXT ENDS HERE**

**Catalog Metadata:**
${examplesMetadata}

**Instructions:**
1.  **Be Knowledgeable**: You know every line of code in the context above. If a user asks about "Blind Auction", refer to \`BlindAuction.sol\` and explain how it works using the actual code.
2.  **Zama Expert**: Explain FHE concepts (e.g., "Why use ebool?", " How does FHE.select work?") clearly.
3.  **Code First**: When asked for help, provide code snippets from the examples or write new code based on the patterns seen in the repository.
4.  **Navigation**: If the user is looking for a specific use case, tell them which example key to use (e.g., \`npx create-fhevm-example auctions/blind ...\`).
5.  **Personality**: detailed, technical, yet accessible. You are a passionate advocate for privacy.

**Constraints:**
- You are a text-based AI in a browser. You cannot execute commands.
- Always assume the user has the Zama environment set up.
`;

let ai: GoogleGenAI | null = null;

export const initAI = () => {
  if (!API_KEY) {
    console.warn('VITE_GEMINI_API_KEY is not set. AI features will be disabled.');
    return;
  }
  ai = new GoogleGenAI({ apiKey: API_KEY });
};

export const sendMessageToAI = async (history: { role: 'user' | 'model', content: string }[]) => {
  if (!ai) initAI();
  if (!ai) {
    return "AI is not configured (Missing VITE_GEMINI_API_KEY). Please add your API key to .env file.";
  }

  try {
    // Convert generic history to Gemini format
    const contents = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents, // Pass full history
      config: {
        systemInstruction: SYSTEM_PROMPT,
      }
    });

    return response.text;
  } catch (error: any) {
    console.error("Gemini API Error:", error);

    if (error.message?.includes("API key not valid")) {
      const keyPrefix = API_KEY ? API_KEY.substring(0, 8) : "None";
      return `Error: Invalid Gemini API Key (400). \n\nLoaded Key Prefix: "${keyPrefix}..." \n\nIf this does not match your .env file, please RESTART YOUR TERMINAL (stop and run 'npm run dev:web' again) to reload environment variables.`;
    }

    return `Error: ${error.message || "Unknown error connecting to AI"}`;
  }
};
