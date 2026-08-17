import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Eye, 
  MessageSquare, 
  HelpCircle,
  PlayCircle,
  Lightbulb
} from 'lucide-react';
import { ParsedGame, PersonalChessProfile, ChatMessage } from '../types/chess';
import { answerCoachQuery } from '../services/aiCoachService';
import { NavTab } from './Navbar';

interface AskMyGamesProps {
  profile: PersonalChessProfile;
  games: ParsedGame[];
  onNavigate: (tab: NavTab) => void;
  onSelectGame: (game: ParsedGame) => void;
  onOpenPosition: (game: ParsedGame, ply: number) => void;
}

function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={index} className="text-white font-bold">{part.slice(2, -2)}</strong>
      : part
  );
}

function CoachText({ text }: { text: string }) {
  return <div className="space-y-1.5">{text.split('\n').map((line, index) => {
    if (!line) return <div key={index} className="h-1" />;
    if (line.startsWith('### ')) return <h4 key={index} className="font-bold text-white pt-1">{renderInline(line.slice(4))}</h4>;
    if (/^[-*] /.test(line)) return <div key={index} className="flex gap-2"><span className="text-purple-300">•</span><span>{renderInline(line.slice(2))}</span></div>;
    if (/^\d+\. /.test(line)) return <div key={index}>{renderInline(line)}</div>;
    return <p key={index}>{renderInline(line)}</p>;
  })}</div>;
}

export const AskMyGames: React.FC<AskMyGamesProps> = ({
  profile,
  games,
  onNavigate,
  onSelectGame,
  onOpenPosition,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'coach',
      text: `Hello **@${profile.heroUsername}**! I have processed your **${profile.totalGamesAnalyzed} games**. 

I am not just giving generic chess tips—I will query your actual moves, opening win rates, phase drops, and tactical mistakes. Ask me anything about your play!`,
      timestamp: 'Now',
      suggestedQuestions: [
        'Why do I keep losing winning positions?',
        'What is my biggest weakness?',
        'Why are my middlegames worse than my openings?',
        'Which openings should I stop playing?',
        'Find my most embarrassing blunders',
      ],
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    setTimeout(() => {
      const reply = answerCoachQuery(query, profile, games);
      setMessages(prev => [...prev, reply]);
      setIsTyping(false);
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-bold text-xs border border-purple-500/30 mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>NATURAL LANGUAGE GAME ENGINE</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Ask My Games
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Interrogate your entire game history and get answers grounded directly in your actual games.
        </p>
      </div>

      {/* Main Chat Box */}
      <div className="rounded-2xl bg-[#141923] border border-slate-800 shadow-2xl flex flex-col h-[640px] overflow-hidden">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map(msg => {
            const isCoach = msg.sender === 'coach';

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isCoach ? '' : 'flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                    isCoach
                      ? 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-md'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {isCoach ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div className="space-y-3 max-w-2xl">
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isCoach
                        ? 'bg-[#1a2232] border border-slate-700/70 text-slate-200'
                        : 'bg-emerald-600 text-white font-medium ml-auto'
                    }`}
                  >
                    {isCoach ? <CoachText text={msg.text} /> : <div className="whitespace-pre-line">{msg.text}</div>}
                  </div>

                  {/* Referenced Games Cards */}
                  {msg.referencedGames && msg.referencedGames.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Referenced Game Evidence:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {msg.referencedGames.map((rg, idx) => {
                          const matchingGame = games.find(g => g.id === rg.gameId);
                          return (
                            <div
                              key={idx}
                              onClick={() => {
                                if (matchingGame) {
                                  onOpenPosition(matchingGame, rg.moveNumber ? Math.max(0, (rg.moveNumber - 1) * 2) : 0);
                                }
                              }}
                              className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/60 cursor-pointer transition-all group"
                            >
                              <div className="font-bold text-xs text-white group-hover:text-emerald-300 truncate">
                                {rg.title}
                              </div>
                              <div className="text-[11px] text-amber-400 font-medium mt-0.5">
                                Move {rg.moveNumber}
                              </div>
                              {rg.previewNote && (
                                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                                  {rg.previewNote}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Suggested Follow-up Prompts */}
                  {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.suggestedQuestions.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(q)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-purple-500/20 hover:border-purple-500/40 text-slate-300 hover:text-purple-300 border border-slate-700 text-xs transition-all flex items-center gap-1.5"
                        >
                          <Lightbulb className="w-3 h-3 text-purple-400" />
                          <span>{q}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-2 text-slate-400 text-xs italic pl-11">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-purple-400" />
              <span>Analyzing your game database...</span>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-[#0e1219] border-t border-slate-800">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask anything about your games (e.g. 'Why do I blunder in the French Defense?')"
              value={inputQuery}
              onChange={e => setInputQuery(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isTyping}
              className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold disabled:opacity-50 transition-all shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
