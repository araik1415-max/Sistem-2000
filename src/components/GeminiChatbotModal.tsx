import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Bot,
  Sparkles,
  User as UserIcon,
  RotateCcw,
  BadgePercent,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  Brain,
  MessageSquare,
  ShieldCheck,
  Zap,
  Check,
  Plus,
  ScanLine,
} from 'lucide-react';
import { ChatMessage, ChatBotRole, ProductItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { db, collection, doc, setDoc, query, orderBy, limit, onSnapshot } from '../firebase/config';
import { detectRecipeOrSearch, RecipeRecommendation } from '../utils/recipeEngine';
import { decodeBarcodeFromImageFile } from '../utils/barcodeUtils';


interface GeminiChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'hy' | 'ru';
  userBalance?: number;
  userDeposit?: number;
  userBonusPoints?: number;
  products?: ProductItem[];
  onAddToCart?: (product: ProductItem, quantity?: number) => void;
  onAddBatchToCart?: (items: Array<{ product: ProductItem; quantity: number }>) => void;
}

const DEFAULT_MESSAGES: Record<ChatBotRole, ChatMessage[]> = {
  finance: [
    {
      id: 'init_fin',
      role: 'model',
      content:
        'Բարև Ձեզ! Здравствуйте! Я ваш персональный AI-консультант Системы 2000 на базе Gemini. Помогу рассчитать доходность по вашему депозиту под 10% годовых, спланировать накопления или выгодно использовать бонусные баллы. Какой вопрос вас интересует?',
      timestamp: Date.now(),
    },
  ],
  store: [
    {
      id: 'init_store',
      role: 'model',
      content:
        'Բարի գալուստ! Добро пожаловать в онлайн-магазин Системы 2000! Я помогу вам подобрать свежие фермерские продукты, собрать идеальную корзину и расскажу, как получить 5% кешбэка или оплатить заказ баллами на 100%. Что ищете сегодня?',
      timestamp: Date.now(),
    },
  ],
  admin: [
    {
      id: 'init_adm',
      role: 'model',
      content:
        'Приветствую, администратор! Я ваш аналитический ассистент Системы 2000. Помогу проанализировать активность участников магазина, балансы бонусных баллов, депозитные счета под 10% или подготовить промо-кампанию. Чем займемся?',
      timestamp: Date.now(),
    },
  ],
};

const SUGGESTIONS: Record<ChatBotRole, string[]> = {
  finance: [
    'Сколько я заработаю на депозите 150,000 ֏ за 6 месяцев?',
    'Как работает начисление 10% годовых каждую секунду?',
    'Каков курс бонусных баллов к драму?',
    'Ինչպե՞ս է աշխատում 10% ավանդը:',
  ],
  store: [
    'Я хочу склеить дерево, какой клей выбрать?',
    'Какое средство использовать для высоких нагрузок D3?',
    'Я хочу приготовить салат 500 грамм, что купить?',
    'Собери продукты для сытного завтрака',
    'Подбери шуруповерт и саморезы по дереву',
  ],
  admin: [
    'Как мотивировать клиентов копить баллы в магазине?',
    'Составь текст SMS-уведомления о начислении процентов',
    'Какая средняя сумма депозитов у постоянных клиентов?',
  ],
};

export const GeminiChatbotModal: React.FC<GeminiChatbotModalProps> = ({
  isOpen,
  onClose,
  language,
  userBalance = 50000,
  userDeposit = 150000,
  userBonusPoints = 1500,
  products = [],
  onAddToCart,
  onAddBatchToCart,
}) => {
  const { user, profile } = useAuth();
  const [role, setRole] = useState<ChatBotRole>('finance');
  const [model, setModel] = useState<'gemini-3.8-flash' | 'gemini-3.1-flash-lite'>('gemini-3.8-flash');
  const [messages, setMessages] = useState<ChatMessage[]>(DEFAULT_MESSAGES.finance);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Load chat history from Firestore if user is logged in
  useEffect(() => {
    if (!user) {
      setMessages(DEFAULT_MESSAGES[role]);
      return;
    }

    try {
      const chatsColRef = collection(db, 'users', user.uid, 'chats');
      const q = query(chatsColRef, orderBy('timestamp', 'asc'), limit(30));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const loaded: ChatMessage[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            loaded.push({
              id: docSnap.id,
              role: data.role,
              content: data.text || data.content,
              timestamp: data.timestamp,
            });
          });
          if (loaded.length > 0) {
            setMessages(loaded);
          }
        }
      });

      return () => unsubscribe();
    } catch {
      // Fallback to local default if error
    }
  }, [user, role]);

  const handleRoleChange = (newRole: ChatBotRole) => {
    setRole(newRole);
    setMessages(DEFAULT_MESSAGES[newRole]);
  };

  const handleClearHistory = () => {
    setMessages(DEFAULT_MESSAGES[role]);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    // Auto-detect recipe or store search intent
    const recipeMatch = detectRecipeOrSearch(text, products);

    // Save user message to Firestore if authenticated
    if (user) {
      try {
        const msgDocRef = doc(db, 'users', user.uid, 'chats', userMessage.id);
        await setDoc(msgDocRef, {
          id: userMessage.id,
          userId: user.uid,
          role: 'user',
          text: userMessage.content,
          timestamp: userMessage.timestamp,
        });
      } catch (err) {
        console.warn('Could not save user chat message to Firestore:', err);
      }
    }

    try {
      const contextData = {
        realBalance: profile ? profile.realBalance : userBalance,
        deposit: profile ? profile.deposit : userDeposit,
        bonusPoints: profile ? profile.bonusPoints : userBonusPoints,
        annualRate: '10%',
        userEmail: user?.email,
      };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          role,
          model,
          context: contextData,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      
      let botText = data.text || 'Извините, не удалось получить ответ от ассистента.';
      if (recipeMatch) {
        botText = language === 'hy' ? recipeMatch.explanationHy : recipeMatch.explanationRu;
      }

      const botMessage: ChatMessage = {
        id: `msg_m_${Date.now()}`,
        role: 'model',
        content: botText,
        timestamp: Date.now(),
        recipeData: recipeMatch || undefined,
      };

      // Auto-add to cart if requested directly in prompt or if user clicked recipe prompt
      if (recipeMatch && onAddBatchToCart && (text.toLowerCase().includes('добав') || text.toLowerCase().includes('ավելացր'))) {
        onAddBatchToCart(
          recipeMatch.items.map((item) => ({
            product: item.product,
            quantity: item.quantity,
          }))
        );
        botMessage.addedToCart = true;
      }

      setMessages((prev) => [...prev, botMessage]);

      // Save model response to Firestore if authenticated
      if (user) {
        try {
          const botDocRef = doc(db, 'users', user.uid, 'chats', botMessage.id);
          await setDoc(botDocRef, {
            id: botMessage.id,
            userId: user.uid,
            role: 'model',
            text: botMessage.content,
            timestamp: botMessage.timestamp,
          });
        } catch (err) {
          console.warn('Could not save bot message to Firestore:', err);
        }
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      
      let errorText = `⚠️ Произошла ошибка связи с сервером AI: ${error.message || 'Попробуйте снова через минуту'}.`;
      if (recipeMatch) {
        errorText = language === 'hy' ? recipeMatch.explanationHy : recipeMatch.explanationRu;
      }

      const errorMessage: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        role: 'model',
        content: errorText,
        timestamp: Date.now(),
        recipeData: recipeMatch || undefined,
      };

      if (recipeMatch && onAddBatchToCart && (text.toLowerCase().includes('добав') || text.toLowerCase().includes('ավելացր'))) {
        onAddBatchToCart(
          recipeMatch.items.map((item) => ({
            product: item.product,
            quantity: item.quantity,
          }))
        );
        errorMessage.addedToCart = true;
      }

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col h-[90vh] max-h-[750px] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-emerald-950/50 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Bot className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  AI-Консультант Gemini
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                    {model}
                  </span>
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                {language === 'hy'
                  ? 'Համակարգ 2000-ի խելացի օգնական (ավանդներ, բալեր, մթերքներ)'
                  : 'Интеллектуальный советник Системы 2000 (10% годовых, кешбэк, магазин)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearHistory}
              title={language === 'hy' ? 'Մաքրել պատմությունը' : 'Очистить историю'}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Roles Selector & Model Picker Bar */}
        <div className="px-5 py-2.5 bg-slate-900/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Roles */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/60 rounded-xl border border-slate-800">
            <button
              onClick={() => handleRoleChange('finance')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                role === 'finance'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Финансы (10%)</span>
            </button>
            <button
              onClick={() => handleRoleChange('store')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                role === 'store'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Магазин</span>
            </button>
            <button
              onClick={() => handleRoleChange('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                role === 'admin'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Аналитика CRM</span>
            </button>
          </div>

          {/* Model Switcher */}
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <span className="hidden sm:inline">Модель:</span>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="gemini-3.8-flash">gemini-3.8-flash (Рекомендуется)</option>
              <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Быстрая)</option>
            </select>
          </div>
        </div>

        {/* User Balance Context Summary Pill */}
        <div className="px-5 py-2 bg-slate-950/40 border-b border-slate-800/40 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Депозит 10%: {(profile?.deposit ?? userDeposit).toLocaleString()} ֏
            </span>
            <span className="text-amber-400 font-medium">
              ⭐ Баллы: {(profile?.bonusPoints ?? userBonusPoints).toLocaleString()}
            </span>
          </div>
          {user ? (
            <span className="text-slate-400 text-[11px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              {user.displayName || user.email}
            </span>
          ) : (
            <span className="text-slate-500 text-[11px]">Демо-режим (войдите для автосохранения)</span>
          )}
        </div>

        {/* Messages Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {msg.role === 'user' ? (
                  user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="avatar"
                      className="w-full h-full rounded-xl object-cover"
                    />
                  ) : (
                    <UserIcon className="w-4 h-4" />
                  )
                ) : (
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[82%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 shadow-sm'
                }`}
              >
                <div className="whitespace-pre-wrap select-text">{msg.content}</div>

                {/* Interactive Recipe Action Card */}
                {msg.recipeData && (
                  <div className="mt-3 p-3 bg-slate-950/90 border border-emerald-500/40 rounded-xl space-y-2.5 animate-fadeIn shadow-lg">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <ShoppingBag className="w-4 h-4 text-emerald-400" />
                        {language === 'hy' ? msg.recipeData.recipeNameHy : msg.recipeData.recipeNameRu}
                      </h4>
                      <span className="text-[11px] font-semibold text-amber-400">
                        +{msg.recipeData.estimatedCashbackPoints} ֏ {language === 'hy' ? 'քեշբեք' : 'кешбэк'}
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {msg.recipeData.items.map((item: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-xs bg-slate-900/90 p-2 rounded-lg border border-slate-800/80 hover:border-slate-700 transition-colors">
                          <div className="flex items-center gap-2">
                            <img src={item.product.imageUrl} alt="" className="w-8 h-8 rounded-md object-cover border border-slate-700" />
                            <div>
                              <div className="font-semibold text-slate-200">
                                {language === 'hy' ? item.product.nameHy : item.product.nameRu} ({item.quantity}x)
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {language === 'hy' ? item.portionNoteHy : item.portionNoteRu}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono text-emerald-400 text-xs">
                              {(item.product.priceDram * item.quantity).toLocaleString()} ֏
                            </span>
                            {onAddToCart && (
                              <button
                                type="button"
                                onClick={() => onAddToCart(item.product, item.quantity)}
                                title={language === 'hy' ? 'Ավելացնել' : 'Добавить'}
                                className="p-1 rounded-md bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40 transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* ИНСТРУКЦИЯ ПО ПРИМЕНЕНИЮ / ИСПОЛЬЗОВАНИЮ (ЕСЛИ ЕСТЬ) */}
                    {(msg.recipeData.usageInstructionsRu || msg.recipeData.usageInstructionsHy) && (
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
                        <span className="font-bold text-emerald-400 block mb-1">
                          📋 {language === 'hy' ? 'Օգտագործման հրահանգ:' : 'Инструкция по применению:'}
                        </span>
                        <div className="whitespace-pre-line text-slate-300 leading-relaxed font-sans">
                          {language === 'hy' ? msg.recipeData.usageInstructionsHy : msg.recipeData.usageInstructionsRu}
                        </div>
                      </div>
                    )}

                    {/* Batch Add All to Cart Button */}
                    {msg.addedToCart ? (
                      <div className="flex items-center justify-center gap-1.5 p-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-semibold">
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>
                          {language === 'hy'
                            ? 'Բոլոր մթերքները ավելացված են զամբյուղում!'
                            : 'Все продукты успешно добавлены в корзину!'}
                        </span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (onAddBatchToCart && msg.recipeData) {
                            onAddBatchToCart(
                              msg.recipeData.items.map((i: any) => ({
                                product: i.product,
                                quantity: i.quantity,
                              }))
                            );
                            setMessages((prev) =>
                              prev.map((m) => (m.id === msg.id ? { ...m, addedToCart: true } : m))
                            );
                          }
                        }}
                        className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 hover:from-emerald-400 hover:to-teal-300 transition-all shadow-md cursor-pointer border border-emerald-300/30 active:scale-[0.99]"
                      >
                        <ShoppingCart className="w-4 h-4 text-slate-950" />
                        <span>
                          {language === 'hy'
                            ? `🛒 Ավելացնել բոլոր մթերքները զամբյուղում (${msg.recipeData.totalPriceDram.toLocaleString()} ֏)`
                            : `🛒 Добавить все продукты в корзину (${msg.recipeData.totalPriceDram.toLocaleString()} ֏)`}
                        </span>
                      </button>
                    )}
                  </div>
                )}

                <div
                  className={`mt-1.5 text-[10px] ${
                    msg.role === 'user' ? 'text-blue-200 text-right' : 'text-slate-400'
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
              </div>
              <div className="bg-slate-800/90 rounded-2xl px-4 py-3 text-sm text-slate-400 border border-slate-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Gemini генерирует ответ...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts */}
        <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[11px] text-slate-500 shrink-0 mr-1 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" /> Подсказки:
          </span>
          {SUGGESTIONS[role].map((sug, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(sug)}
              disabled={loading}
              className="text-xs text-slate-300 bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 rounded-full px-3 py-1 whitespace-nowrap shrink-0 transition-colors disabled:opacity-50"
            >
              {sug}
            </button>
          ))}
        </div>

        {/* Input Footer */}
        <div className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <label
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition-colors cursor-pointer shrink-0"
              title={language === 'hy' ? 'Սկանավորել Շտրիխ կոդ կամ նկար' : 'Сканировать штрихкод или фото товара'}
            >
              <ScanLine className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const { text } = await decodeBarcodeFromImageFile(file);
                    if (text) {
                      handleSendMessage(`Штрихкод ${text}`);
                    } else {
                      handleSendMessage(`Поиск товара по снимку ${file.name}`);
                    }
                  }
                }}
              />
            </label>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                language === 'hy'
                  ? 'Հարցրեք ապրանքների, Շտրիխ կոդերի կամ 10% ավանդի մասին...'
                  : 'Спросите о товаре по штрихкоду, названию, депозите 10%...'
              }
              disabled={loading}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-semibold hover:from-emerald-400 hover:to-teal-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
