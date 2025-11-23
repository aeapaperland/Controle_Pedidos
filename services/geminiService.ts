import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini API client
// NOTE: In a real production app, API calls should ideally be proxied through a backend 
// to protect the key, but for this client-side demo, we use process.env.
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateWhatsappMessage = async (
  customerName: string,
  orderStatus: string,
  items: string
): Promise<string> => {
  if (!apiKey) return "Erro: API Key não configurada.";

  try {
    const prompt = `
      Atue como uma confeiteira profissional, educada e carinhosa chamada "A&A Delícias".
      Escreva uma mensagem curta para WhatsApp para o cliente ${customerName}.
      O status do pedido é: ${orderStatus}.
      Os itens são: ${items}.
      
      Se o status for 'Orçamento', seja convidativa.
      Se for 'Em Produção', avise que estamos começando com carinho.
      Se for 'Finalizado', avise que está pronto para retirada/entrega.
      Use emojis relacionados a doces.
      Não use aspas na resposta.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Olá! Atualização sobre seu pedido.";
  } catch (error) {
    console.error("Error generating message:", error);
    return `Olá ${customerName}, seu pedido está com status: ${orderStatus}.`;
  }
};

export const suggestThemeIdeas = async (themeName: string): Promise<string> => {
  if (!apiKey) return "Configuração de IA necessária.";

  try {
    const prompt = `
      Sugira 3 ideias criativas e sofisticadas de doces personalizados para o tema: ${themeName}.
      Para cada ideia, descreva brevemente a decoração.
      Formate como uma lista simples com marcadores.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Sem sugestões no momento.";
  } catch (error) {
    console.error("Error generating ideas:", error);
    return "Não foi possível gerar ideias no momento.";
  }
};