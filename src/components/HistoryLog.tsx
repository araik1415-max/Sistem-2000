import React, { useState } from 'react';
import { History, Copy, Check, ShieldCheck, Lock } from 'lucide-react';
import { LogItem, LogCategory, Language } from '../types';

interface HistoryLogProps {
  logs: LogItem[];
  lang: Language;
}

export const HistoryLog: React.FC<HistoryLogProps> = ({ logs, lang }) => {
  const isHy = lang === 'hy';
  const [filter, setFilter] = useState<'all' | LogCategory>('all');
  const [copied, setCopied] = useState(false);

  const filteredLogs = logs.filter((l) => {
    if (filter === 'all') return true;
    return l.category === filter;
  });

  const handleCopyLogs = () => {
    const text = logs.map((l) => `[${l.time}] ${l.text}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLogStyle = (category: LogCategory, text: string) => {
    if (text.includes('Սխալ') || text.includes('Ошибка')) {
      return 'text-rose-400 bg-rose-950/20 border-rose-900/30';
    }
    switch (category) {
      case 'deposit':
        return 'text-emerald-300 bg-emerald-950/20 border-emerald-900/30';
      case 'real_topup':
        return 'text-cyan-300 bg-cyan-950/20 border-cyan-900/30';
      case 'dram_purchase':
        return 'text-teal-300 bg-teal-950/20 border-teal-900/30';
      case 'points_purchase':
        return 'text-amber-300 bg-amber-950/20 border-amber-900/30';
      case 'auth':
        return 'text-purple-300 bg-purple-950/20 border-purple-900/30';
      default:
        return 'text-slate-400 bg-slate-900/40 border-slate-800';
    }
  };

  return (
    <div className="rounded-2xl bg-slate-850/80 border border-slate-750 p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-emerald-400" />
          <h2 className="text-base font-semibold text-white">
            {isHy ? 'Գործառնությունների պատմություն' : 'История операций'}
          </h2>
          <span className="px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 rounded-md">
            {logs.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Копирование истории */}
          <button
            onClick={handleCopyLogs}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            title={isHy ? 'Պատճենել պատմությունը' : 'Скопировать'}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? (isHy ? 'Պատճենված է' : 'Скопировано') : (isHy ? 'Պատճենել' : 'Копировать')}</span>
          </button>

          {/* Индикатор неизменяемости: Пользователи не могут удалить историю */}
          <div
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-300 bg-amber-950/30 border border-amber-800/40 shadow-sm cursor-help select-none"
            title={
              isHy
                ? 'Ֆինանսական պատմությունն անփոփոխ է և պաշտպանված ջնջումից'
                : 'История финансовых операций защищена от удаления'
            }
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>{isHy ? 'Պաշտպանված է' : 'Защищена от удаления'}</span>
          </div>
        </div>
      </div>

      {/* Ֆիլտրեր */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2.5 scrollbar-none text-[11px]">
        <button
          onClick={() => setFilter('all')}
          className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
            filter === 'all'
              ? 'bg-slate-700 text-white font-medium'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {isHy ? 'Բոլորը' : 'Все'} ({logs.length})
        </button>
        <button
          onClick={() => setFilter('deposit')}
          className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
            filter === 'deposit'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-medium'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {isHy ? 'Դեպոզիտ' : 'Депозит'}
        </button>
        <button
          onClick={() => setFilter('real_topup')}
          className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
            filter === 'real_topup'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-medium'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {isHy ? 'Հաշվի լիցքավորում' : 'Пополнение счета'}
        </button>
        <button
          onClick={() => setFilter('dram_purchase')}
          className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
            filter === 'dram_purchase'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-medium'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {isHy ? 'Գնումներ ֏-ով' : 'Покупки за ֏'}
        </button>
        <button
          onClick={() => setFilter('points_purchase')}
          className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
            filter === 'points_purchase'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {isHy ? 'Բոնուսներով' : 'Баллами'}
        </button>
      </div>

      {/* Պատուհան */}
      <div
        id="logBox"
        className="bg-[#090d16] border border-slate-800 rounded-xl p-3.5 font-mono text-xs max-h-56 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-slate-600 text-center py-4">
            {isHy ? 'Գործառնությունների պատմությունը դատարկ է' : 'Журнал операций пуст'}
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className={`log-entry flex items-start gap-2 p-1.5 rounded border ${getLogStyle(
                log.category,
                log.text
              )}`}
            >
              <span className="text-slate-500 shrink-0 select-none">[{log.time}]</span>
              <span className="flex-1 break-words">{log.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
