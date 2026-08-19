import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));

// Initialize Gemini Client with User-Agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "Centralize AI Chat" });
});

// Main Chat endpoint with streaming support
app.post("/api/chat", async (req, res) => {
  try {
    const { 
      messages = [], 
      systemInstruction, 
      enableSearch = false, 
      temperature = 0.7 
    } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Chave GEMINI_API_KEY não configurada no servidor." });
    }

    // Set headers for Server-Sent Events (SSE)
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Format message history for Gemini API
    const contents = messages.map((m: { role: string; content: string; image?: string }) => {
      const parts: any[] = [];
      if (m.image) {
        const matches = m.image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        if (matches) {
          parts.push({
            inlineData: {
              mimeType: matches[1],
              data: matches[2],
            },
          });
        }
      }
      if (m.content) {
        parts.push({ text: m.content });
      }
      return {
        role: m.role === "assistant" ? "model" : m.role === "model" ? "model" : "user",
        parts: parts.length > 0 ? parts : [{ text: " " }],
      };
    });

    const config: any = {
      temperature,
    };

    let finalInstruction = systemInstruction || "";
    if (enableSearch) {
      config.tools = [{ googleSearch: {} }];
      finalInstruction += "\n\nBusca Web em tempo real ativada: Use a ferramenta Google Search para pesquisar dados atualizados e informações em tempo real na web, fornecendo fatos e cotações recentes sempre que necessário.";
    }

    if (finalInstruction.trim()) {
      config.systemInstruction = finalInstruction.trim();
    }

    const modelsToTry = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
    let streamSuccess = false;
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      if (streamSuccess) break;

      // First try with requested config (which may include tools), then without tools if it fails
      const configVariants = [
        { ...config },
        ...(config.tools ? [{ ...config, tools: undefined }] : [])
      ];

      for (let vIdx = 0; vIdx < configVariants.length; vIdx++) {
        if (streamSuccess) break;
        const currentConfig = configVariants[vIdx];
        const isFallbackWithoutTools = vIdx > 0;

        // Try up to 3 attempts with exponential backoff for transient errors (503, 429, 500)
        const maxRetries = 3;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          let wroteFallbackNotice = false;
          try {
            const responseStream = await ai.models.generateContentStream({
              model: modelName,
              contents,
              config: currentConfig,
            });

            for await (const chunk of responseStream) {
              if (isFallbackWithoutTools && !wroteFallbackNotice) {
                const fallbackNotice = JSON.stringify({
                  text: "*(Nota: Busca Web desativada nesta resposta devido à alta demanda momentânea na API. Respondendo diretamente:)*\n\n",
                });
                res.write(`data: ${fallbackNotice}\n\n`);
                wroteFallbackNotice = true;
              }

              const text = chunk.text || "";
              const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;
              const groundingChunks = groundingMetadata?.groundingChunks;
              let sources: { title?: string; uri: string }[] | undefined;

              if (groundingChunks && Array.isArray(groundingChunks)) {
                sources = groundingChunks
                  .map((c: any) => {
                    if (c?.web?.uri) return { title: c.web.title || c.web.uri, uri: c.web.uri };
                    if (c?.uri) return { title: c.title || c.uri, uri: c.uri };
                    return null;
                  })
                  .filter((s: any): s is { title: string; uri: string } => Boolean(s && s.uri));
              }

              const data = JSON.stringify({
                text,
                sources: sources && sources.length > 0 ? sources : undefined,
              });

              res.write(`data: ${data}\n\n`);
            }

            streamSuccess = true;
            break;
          } catch (err: any) {
            lastError = err;
            const errStr = typeof err === "string" ? err : JSON.stringify(err?.message || err || "");
            console.warn(`Erro na chamada ao Gemini (${modelName}, tentativa ${attempt}/${maxRetries}, semFerramentas: ${isFallbackWithoutTools}):`, errStr);

            const isTransient = /503|429|500|UNAVAILABLE|high demand|overloaded|RESOURCE_EXHAUSTED/i.test(errStr);
            
            if (isTransient && attempt < maxRetries) {
              const delay = Math.pow(2, attempt - 1) * 800;
              console.log(`Aguardando ${delay}ms antes de tentar novamente...`);
              await new Promise((r) => setTimeout(r, delay));
            } else {
              break;
            }
          }
        }
      }
    }

    if (!streamSuccess && lastError) {
      throw lastError;
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error: any) {
    console.error("Erro na API do Gemini:", error);
    let rawStr = typeof error === "string" ? error : JSON.stringify(error?.message || error || "");
    let errMsg = "O serviço de IA está temporariamente indisponível. Por favor, tente novamente em alguns instantes.";

    if (/503|UNAVAILABLE|high demand|Service Unavailable/i.test(rawStr)) {
      errMsg = "⚠️ O serviço de IA está enfrentando alta demanda no momento (Erro 503). Por favor, aguarde alguns segundos e envie novamente sua mensagem.";
    } else if (/429|RESOURCE_EXHAUSTED|quota/i.test(rawStr)) {
      errMsg = "⚠️ Limite de cota atingido temporariamente (Erro 429). Por favor, aguarde alguns instantes ou desative a Busca Web.";
    }

    res.write(`data: ${JSON.stringify({ error: errMsg })}\n\n`);
    res.end();
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Centralize Server rodando na porta ${PORT}`);
  });
}

startServer();
