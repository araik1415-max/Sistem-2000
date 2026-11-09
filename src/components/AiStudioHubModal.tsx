import React, { useState, useRef } from 'react';
import {
  X,
  Sparkles,
  Box,
  Gamepad2,
  Search,
  MapPin,
  Image as ImageIcon,
  Video,
  Music,
  Mic,
  Loader2,
  Upload,
} from 'lucide-react';
import { Language } from '../types';

interface AiStudioHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onOpen3DWarehouse: () => void;
  onOpenGame: () => void;
}

type StudioTab = 'search' | 'maps' | 'image' | 'video' | 'music' | 'transcribe';

export const AiStudioHubModal: React.FC<AiStudioHubModalProps> = ({
  isOpen,
  onClose,
  lang,
  onOpen3DWarehouse,
  onOpenGame,
}) => {
  const [activeTab, setActiveTab] = useState<StudioTab>('search');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [imageBase64, setImageBase64] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState('');
  const [resultImage, setResultImage] = useState('');
  const [resultAudio, setResultAudio] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const audioFileRef = useRef<HTMLInputElement>(null);
  const isHy = lang === 'hy';

  if (!isOpen) return null;

  const handleRun = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setResultText('');
    setResultImage('');
    setResultAudio('');

    try {
      const res = await fetch('/api/ai/studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: activeTab,
          prompt,
          aspectRatio,
          imageBase64: imageBase64 || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка запроса');

      if (data.text) setResultText(data.text);
      if (data.imageUrl) setResultImage(data.imageUrl);
      if (data.audioUrl) setResultAudio(data.audioUrl);
      if (data.interactionId) {
        setResultText(
          isHy
            ? `Տեսանյութի գեներացիան սկսված է (ID: ${data.interactionId}, կարգավիճակ՝ ${data.status})`
            : `Генерация видео запущена (ID: ${data.interactionId}, статус: ${data.status})`
        );
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = String(reader.result || '');
      const base64 = res.includes(',') ? res.split(',')[1] : res;
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const res = String(reader.result || '');
      const base64 = res.includes(',') ? res.split(',')[1] : res;
      setLoading(true);
      setErrorMsg('');
      try {
        const resp = await fetch('/api/ai/studio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'transcribe',
            audioBase64: base64,
            mimeType: file.type || 'audio/webm',
          }),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || 'Ошибка транскрибации');
        setResultText(data.text || '');
      } catch (err: any) {
        setErrorMsg(err?.message || 'Ошибка');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">
              {isHy ? 'AI և 3D Ստուդիա 2000' : 'AI и 3D Студия 2000'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Launchers: 3D Warehouse & Mini-Game */}
        <div className="px-5 py-3 bg-slate-950/60 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpen3DWarehouse();
            }}
            className="p-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/40 hover:border-amber-400 flex items-center gap-3 text-left cursor-pointer transition-all"
          >
            <Box className="w-6 h-6 text-amber-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">
                {isHy ? '3D Պահեստ և Վիտրինա (Three.js)' : '3D Склад и Витрина (Three.js)'}
              </div>
              <div className="text-[10px] text-slate-400">
                {isHy ? 'Ինտերակտիվ 3D տեսարան' : 'Интерактивная 3D-сцена склада'}
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenGame();
            }}
            className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border border-emerald-500/40 hover:border-emerald-400 flex items-center gap-3 text-left cursor-pointer transition-all"
          >
            <Gamepad2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">
                {isHy ? 'Խաղ՝ Բոնուս-Ռաններ 2000' : 'Игра: Бонус-Раннер 2000'}
              </div>
              <div className="text-[10px] text-slate-400">
                {isHy ? 'Հավաքեք բոնուսներ 60fps ռեժիմում' : 'Собирайте бонусные баллы (60fps)'}
              </div>
            </div>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5 py-2.5 border-b border-slate-800 flex flex-wrap gap-1.5 text-xs">
          {[
            { id: 'search', icon: Search, label: isHy ? 'Google Որոնում' : 'Поиск' },
            { id: 'maps', icon: MapPin, label: isHy ? 'Google Քարտեզ' : 'Карты' },
            { id: 'image', icon: ImageIcon, label: isHy ? 'Նկարներ' : 'Изображения' },
            { id: 'video', icon: Video, label: isHy ? 'Տեսանյութ' : 'Видео' },
            { id: 'music', icon: Music, label: isHy ? 'Երաժշտություն' : 'Музыка' },
            { id: 'transcribe', icon: Mic, label: isHy ? 'Աուդիո տեքստ' : 'Транскрибация' },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setActiveTab(t.id as StudioTab);
                  setResultText('');
                  setResultImage('');
                  setResultAudio('');
                  setErrorMsg('');
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer ${
                  activeTab === t.id
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-800/70 text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'transcribe' ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                {isHy
                  ? 'Վերբեռնեք աուդիո ֆայլ՝ Gemini 3.5 Transcribe-ի միջոցով տեքստի վերածելու համար:'
                  : 'Загрузите аудиофайл для точной расшифровки через Gemini 3.5 Transcribe:'}
              </p>
              <input
                ref={audioFileRef}
                type="file"
                accept="audio/*"
                onChange={handleAudioUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => audioFileRef.current?.click()}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>{isHy ? 'Ընտրել աուդիո ֆայլ' : 'Выбрать аудиофайл'}</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleRun} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  {isHy ? 'Հարցում կամ նկարագրություն (Prompt)' : 'Запрос или описание (Prompt)'}
                </label>
                <textarea
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    activeTab === 'search'
                      ? 'Актуальные цены на цемент и клей ПВА в Ереване...'
                      : activeTab === 'maps'
                      ? 'Строительные магазины рядом с центром Еревана...'
                      : activeTab === 'image'
                      ? 'Современный шоурум стройматериалов Система 2000...'
                      : activeTab === 'video'
                      ? 'Динамичный рекламный ролик магазина Система 2000...'
                      : 'Энергичная фоновая музыка для магазина...'
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {activeTab === 'video' && (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400">{isHy ? 'Ձևաչափ՝' : 'Формат:'}</span>
                    {(['16:9', '9:16'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setAspectRatio(r)}
                        className={`px-2.5 py-1 rounded text-xs font-mono font-bold cursor-pointer ${
                          aspectRatio === r ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>
                      {imageBase64
                        ? (isHy ? 'Նկարը կցված է ✓' : 'Фото прикреплено ✓')
                        : (isHy ? 'Կցել նկար (ըստ ցանկության)' : 'Прикрепить фото (опционально)')}
                    </span>
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isHy ? 'Գործարկել AI-ն' : 'Запустить AI'}</span>
              </button>
            </form>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-700 text-xs text-rose-200">
              {errorMsg}
            </div>
          )}

          {resultText && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
              {resultText}
            </div>
          )}

          {resultImage && (
            <div className="rounded-xl overflow-hidden border border-slate-700">
              <img src={resultImage} alt="AI Generated" className="w-full max-h-80 object-contain bg-black" />
            </div>
          )}

          {resultAudio && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <audio controls src={resultAudio} className="w-full" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
