import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader } from 'lucide-react';
import { supabase, WaterLevel, AtmosphericCondition } from '../../lib/supabase';

interface AIAssistantViewProps {
  waterLevels: WaterLevel[];
  atmospheric: AtmosphericCondition[];
  latestWater: WaterLevel | null;
  latestAtmospheric: AtmosphericCondition | null;
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function AIAssistantView({
  waterLevels,
  atmospheric,
  latestWater,
  latestAtmospheric,
}: AIAssistantViewProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Bonjour! Je suis votre assistant IA. Je peux vous aider à:\n- Consulter le niveau d\'eau actuel\n- Obtenir des statistiques sur les données collectées\n- Répondre à vos questions sur le système\n- Analyser les données historiques\n\nComment puis-je vous aider?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getSystemContext = (): string => {
    const context = {
      waterLevels: waterLevels.slice(0, 5),
      latestWater,
      latestAtmospheric,
      atmospheric: atmospheric.slice(0, 5),
      totalReadings: waterLevels.length + atmospheric.length,
    };
    return JSON.stringify(context, null, 2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const prompt = `
Tu es un assistant IA pour un système de monitoring de cuve d'eau éducatif.
Tu dois répondre aux questions de l'utilisateur sur:
- Le niveau d'eau actuel
- Les statistiques des données
- L'interface du système
- Les données collectées

Contexte des données:
${getSystemContext()}

Question de l'utilisateur: ${input}

Fournir une réponse concise, en français, et utile.
`;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ prompt }),
        }
      );

      if (!response.ok) {
        throw new Error('Erreur de réponse du serveur');
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.response || 'Je n\'ai pas pu générer une réponse.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Je ne suis pas disponible pour le moment. Veuillez réessayer plus tard.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Bot className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Assistant IA</h2>
        </div>
        <p className="text-sm opacity-90">Posez vos questions sur le système et les données collectées</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-[600px]">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.type === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 rounded-lg rounded-bl-none">
                <Loader className="w-5 h-5 animate-spin text-gray-600 dark:text-gray-400" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="border-t border-gray-100 dark:border-gray-700 p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez votre question..."
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">Exemples de questions:</h3>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <li>• Quel est le niveau d'eau actuel?</li>
          <li>• Quelle est la consommation d'eau aujourd'hui?</li>
          <li>• Quelles sont les statistiques générales?</li>
          <li>• Comment utiliser cette interface?</li>
        </ul>
      </div>
    </div>
  );
}
