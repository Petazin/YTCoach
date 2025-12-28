
'use client';

import { useState, useRef, useEffect } from 'react';
import { sendToAI, ChatMessage } from '@/lib/aiService';
import styles from './AIChatWidget.module.css';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface Props {
    contextData: any; // The analytics context to pass to the AI
}

export default function AIChatWidget({ contextData }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [apiKey, setApiKey] = useState(''); // Allow user to input key
    const [selectedModel, setSelectedModel] = useState('gemini-1.5-flash'); // Default model
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // Load API Key from LocalStorage
    useEffect(() => {
        const storedKey = localStorage.getItem('gemini_api_key');
        if (storedKey) setApiKey(storedKey);
    }, []);

    // Initial greeting
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([
                { role: 'assistant', content: '👋 Hola, soy tu Analista Virtual. ¿Qué quieres saber sobre el rendimiento de este video?' }
            ]);
        }
    }, []);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: ChatMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const history = [...messages, userMsg];
            const response = await sendToAI(history, contextData, apiKey || undefined, selectedModel);

            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, tuve un error al procesar tu solicitud.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`${styles.widget} ${isOpen ? styles.open : ''}`}>

            {/* Toggle Button */}
            {!isOpen && (
                <button className={styles.toggleBtn} onClick={() => setIsOpen(true)}>
                    🤖 <span className="ml-2 hidden md:inline">Analista AI</span>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className={styles.window}>
                    <div className={styles.header}>
                        <div className="flex flex-col">
                            <h3>🤖 Analista de Estrategia</h3>
                            <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: apiKey ? '#4ade80' : '#fbbf24' }}>
                                {apiKey ? '⚡ AI Conectada' : '⚠️ Modo Simulado'}
                            </span>
                        </div>
                        <div className="flex gap-2 items-center">
                            {/* Model Selector */}
                            <Select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                selectSize="xs"
                                className="w-auto min-w-[140px] bg-gray-800"
                                title="Seleccionar Modelo AI"
                            >
                                <option value="gemini-1.5-flash">Flash 1.5 (Stable)</option>
                                <option value="gemini-1.5-pro">Pro 1.5 (Intelligent)</option>
                                <option value="gemini-2.0-flash-exp">Flash 2.0 (Experimental)</option>
                                <option value="gemini-3-flash-preview">Flash 3.0 (Preview)</option>
                            </Select>

                            <button onClick={() => {
                                const key = prompt("Ingresa tu Google Gemini API Key:", apiKey);
                                if (key) {
                                    setApiKey(key);
                                    localStorage.setItem('gemini_api_key', key);
                                }
                            }} className="text-xs text-gray-400 hover:text-white" title="Configurar API Key (Se guardará automáticamente)">
                                🔑
                            </button>
                            <button onClick={() => setIsOpen(false)} className={styles.closeBtn}>×</button>
                        </div>
                    </div>

                    <div className={styles.messages}>
                        {messages.map((m, i) => (
                            <div key={i} className={`${styles.message} ${m.role === 'user' ? styles.user : styles.ai}`}>
                                {m.content}
                            </div>
                        ))}
                        {loading && <div className={styles.typing}>Analizando...</div>}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className={styles.inputArea}>
                        <Input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Pregunta sobre CTR, retención..."
                            disabled={loading}
                            className="flex-1"
                            inputSize="sm"
                        />
                        <button onClick={handleSend} disabled={loading || !input.trim()}>
                            ➤
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
