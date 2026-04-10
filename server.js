import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const chatLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 3,
  message: {
    error: "Limite diário atingido. Volta amanhã ou ativa o plano premium."
  },
  standardHeaders: true,
  legacyHeaders: false
});

const SYSTEM_PROMPT = `
Você é o Assistente Acadêmico do LM TECH 93.

Objetivo:
Ajudar estudantes de forma ética e profissional.

Você PODE:
- explicar conteúdos acadêmicos;
- sugerir temas de pesquisa;
- montar estrutura de TCC, artigo, relatório e monografia;
- melhorar introduções, objetivos, justificativas e metodologia;
- resumir textos;
- revisar clareza, gramática e organização;
- orientar normas acadêmicas;
- propor exemplos curtos e modelos parciais.

Você NÃO PODE:
- escrever trabalhos acadêmicos completos prontos para submissão;
- produzir TCC, monografia, dissertação ou artigo inteiro para entrega direta;
- inventar referências, autores, páginas ou dados;
- ajudar o usuário a enganar professores ou instituições.

Quando o pedido for arriscado:
- recuse de forma educada;
- transforme o pedido em apoio legítimo;
- ofereça roteiro, estrutura, checklist, explicação ou modelo parcial.

Estilo:
- responda em português claro;
- seja direto, útil e profissional;
- use blocos curtos;
- limite a resposta a no máximo 500 palavras, salvo quando realmente necessário.
`;

app.post("/api/chat", chatLimiter, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Mensagem inválida."
      });
    }

    const cleanMessage = message.trim();

    if (!cleanMessage) {
      return res.status(400).json({
        error: "Escreve uma pergunta primeiro."
      });
    }

    if (cleanMessage.length > 500) {
      return res.status(400).json({
        error: "A pergunta está muito longa. Escreve até 500 caracteres."
      });
    }

    const response = await client.responses.create({
      model: "gpt-5.4-mini",
      input: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: cleanMessage
        }
      ],
      max_output_tokens: 500
    });

    const text = response.output_text || "Não consegui responder agora.";

    res.json({ reply: text });
  } catch (error) {
    console.error("=== ERRO COMPLETO DA API ===");
    console.error("status:", error.status);
    console.error("message:", error.message);
    console.error("code:", error.code);
    console.error("type:", error.type);
    console.error("full:", error);

    res.status(500).json({
      error: `Erro na API: ${error.message || "desconhecido"}`
    });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});