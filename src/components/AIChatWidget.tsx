import React, { useState, useRef, useEffect } from 'react';
import { FiMessageSquare, FiX, FiSend, FiMinimize2, FiMaximize2 } from 'react-icons/fi';
import { intelligenceAPI } from '@/api/endpoints/intelligence';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';

export const AIChatWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleOpenChat = () => setIsOpen(true);
        window.addEventListener('open-ai-chat', handleOpenChat);
        return () => window.removeEventListener('open-ai-chat', handleOpenChat);
    }, []);

    const { user } = useAuth();

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            const response = await intelligenceAPI.chat(userMessage);
            // Assuming response.data is the string reply from backend structure
            const reply = typeof response.data === 'string' ? response.data :
                (response.data?.data || 'Sorry, I could not process that.');

            setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, verification failed or service unavailable.' }]);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 h-14 w-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-all z-50 focus:outline-none focus:ring-4 focus:ring-blue-300"
                aria-label="Open AI Assistant"
            >
                <FiMessageSquare className="h-6 w-6" />
            </button>
        );
    }

    return (
        <div className={`fixed z-50 transition-all duration-300 bg-white shadow-2xl rounded-t-lg border border-gray-200 ${isMinimized
            ? 'bottom-0 right-6 w-72 h-14'
            : 'bottom-6 right-6 w-80 md:w-96 h-[500px] rounded-lg'
            }`}>
            {/* Header */}
            <div
                className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg cursor-pointer"
                onClick={() => setIsMinimized(!isMinimized)}
            >
                <div className="flex items-center space-x-2">
                    <FiMessageSquare />
                    <span className="font-semibold">PowerGen AI Assistant</span>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="hover:text-blue-200">
                        {isMinimized ? <FiMaximize2 /> : <FiMinimize2 />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="hover:text-blue-200">
                        <FiX />
                    </button>
                </div>
            </div>

            {/* Body */}
            {!isMinimized && (
                <>
                    <div className="flex-1 p-4 overflow-y-auto h-[380px] bg-gray-50">
                        {messages.length === 0 && (
                            <div className="text-center text-gray-500 mt-10">
                                <p className="mb-2">👋 Hi {user?.fullName?.split(' ')[0] || 'there'}!</p>
                                <p className="text-sm">I can help with maintenance procedures, troubleshooting, or understanding system data. Ask me anything!</p>
                            </div>
                        )}

                        {messages.map((msg, idx) => (
                            <div key={idx} className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-lg p-3 text-sm ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-white border text-gray-800 rounded-bl-none shadow-sm'
                                    }`}>
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex justify-start mb-4">
                                <div className="bg-white border text-gray-800 rounded-lg rounded-bl-none p-3 shadow-sm">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="p-3 border-t bg-white rounded-b-lg">
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your question..."
                                className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                disabled={loading}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || loading}
                                className={`p-2 rounded-full ${!input.trim() || loading
                                    ? 'bg-gray-100 text-gray-400'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                    } transition-colors`}
                            >
                                <FiSend className="w-5 h-5" />
                            </button>
                        </div>
                    </form>
                </>
            )}
        </div>
    );
};
