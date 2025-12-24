
import { VideoData } from './youtube';

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export async function sendToAI(messages: ChatMessage[], context?: any, apiKey?: string, modelId: string = 'gemini-1.5-flash'): Promise<string> {

    // 1. If API Key is provided, try to call Gemini
    if (apiKey) {
        try {
            return await callGeminiAPI(messages, context, apiKey, modelId);
        } catch (error: any) {
            console.error("Gemini API Error:", error);
            return `⚠️ Error de API: ${error.message || error}. Verifica tu clave.`;
        }
    }

    // 2. Fallback: Heuristic Analyst (Simulated)
    return heuristicAnalyst(messages, context);
}

async function callGeminiAPI(messages: ChatMessage[], context: any, apiKey: string, modelId: string): Promise<string> {
    const systemInstruction = `
        Eres "El Analista", un experto en estrategia de YouTube para el canal "${context?.channelTitle || 'Creador'}".
        Tu tono es profesional pero cercano, crítico pero constructivo. 
        Analiza los datos proporcionados (Vistas, Retención, CTR) y da consejos tácticos.
        Sé conciso. Usa emojis ocasionalmente.
        
        Datos del Contexto Actual:
        ${JSON.stringify(context, null, 2)}
    `;

    // Convert messages to Gemini format (simplification)
    // Gemini API expects: { contents: [{ parts: [{ text: "..." }] }] }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

    // Construct prompt: System + Chat History
    // Note: Gemini Pro doesn't strictly support 'system' role in the messages array in standard HTTP rest blindly, 
    // usually we prepend it to the first user message or use the system_instruction field if available.
    // For simplicity here, we'll prepend.

    const folderMessages = messages.map(m => {
        if (m.role === 'system') return null; // We handle system separately
        return {
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        };
    }).filter(Boolean);

    // Prepend system context to the last message or first? 
    // Ideally put it as the first 'user' part alongside the first query.
    // For this MVP, we'll assume the user just asked the last question and we inject context there.
    // A better approach for chat history:

    const requestBody = {
        contents: [
            {
                role: 'user',
                parts: [{ text: systemInstruction }]
            },
            ...folderMessages
        ]
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini Error: ${err}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No pude generar una respuesta.";
}

function heuristicAnalyst(messages: ChatMessage[], context: any): string {
    const lastMsg = messages[messages.length - 1].content.toLowerCase();

    // Simple Keyword matching
    if (lastMsg.includes('titulo') || lastMsg.includes('título')) {
        return "Los títulos cortos (<60 caracteres) con números suelen funcionar mejor. Intenta agregar urgencia o curiosidad.";
    }

    if (lastMsg.includes('miniatura') || lastMsg.includes('thumbnail')) {
        return "Asegúrate de que la miniatura tenga alto contraste y una cara expresiva. Si el CTR es bajo (<4%), cámbiala inmediatamente.";
    }

    if (lastMsg.includes('retencion') || lastMsg.includes('retención')) {
        return "La caída en los primeros 30 segundos es crítica. Revisa tu intro: ¿Vas directo al grano o das muchas vueltas?";
    }

    if (context?.comparison) {
        return `En esta comparación, el video A tiene un ${context.comparison.delta} de diferencia. ${context.comparison.verdict}`;
    }

    return "Soy el Analista Virtual (Modo Simulado). Agrega tu API Key para que pueda analizar tus datos con inteligencia real. Mientras tanto: concéntrate en mejorar tu CTR y Retención.";
}
