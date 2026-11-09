import React from 'react';
import { X, ShieldCheck, TrendingUp, HelpCircle, AlertTriangle, Clock, Award, FileCheck } from 'lucide-react';
import { Language } from '../types';

interface RuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const RuleExplanationModal: React.FC<RuleModalProps> = ({ isOpen, onClose, lang }) => {
  if (!isOpen) return null;
  const isHy = lang === 'hy';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl p-5 sm:p-6 text-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label={isHy ? 'Փակել' : 'Закрыть'}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {isHy ? '«Համակարգ 2000»-ի հիմնական կանոնները' : 'Основные правила «Системы 2000»'}
            </h3>
            <p className="text-xs text-slate-400">
              {isHy
                ? 'Ծախսերի վերածումը 10% ցմահ ավանդի՝ ժառանգության իրավունքով'
                : 'Превращение всех затрат в 10% пожизненный депозит с правом наследования'}
            </p>
          </div>
        </div>

        <div className="space-y-3.5 text-xs leading-relaxed">
          {/* Правило 1: 10 000 AMD purchase -> lifelong deposit with inheritance */}
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-emerald-500/40">
            <div className="flex items-center gap-2 font-semibold text-emerald-400 mb-1 text-sm">
              <Award className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                {isHy
                  ? '1. Գնումներ 10 000 ֏-ից ➔ 10% Ցմահ դեպոզիտ ժառանգության իրավունքով'
                  : '1. Покупки от 10 000 ֏ ➔ 10% Пожизненный депозит с правом наследования'}
              </span>
            </div>
            <p className="text-slate-300">
              {isHy
                ? '10 000 ՀՀ դրամ և ավելի ցանկացած ապրանքի գնման 100%-ը վերածվում է Ձեր ցմահ ավանդի: Այն գործում է անժամկետ և ունի ժառանգության իրավունք՝ փոխանցվելով Ձեր ընտանիքին:'
                : 'Любая ваша покупка продукции от 10 000 Армянских драм и больше становится пожизненным депозитом 10% годовых с правом наследования. Все ваши затраты превращаются в капитал!'}
            </p>
          </div>

          {/* Правило 2: 15 дней на возврат и начисление бонусов ежесекундно */}
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-teal-500/40">
            <div className="flex items-center gap-2 font-semibold text-teal-400 mb-1 text-sm">
              <Clock className="w-4 h-4 text-teal-400 shrink-0" />
              <span>
                {isHy
                  ? '2. 15 օր վերադարձի ժամկետ ➔ Բոնուսների վայրկյան առ վայրկյան հաշվեգրում'
                  : '2. 15 дней на возврат товара ➔ Ежесекундное начисление бонусов'}
              </span>
            </div>
            <p className="text-slate-300">
              {isHy
                ? 'ՀՀ օրենսդրությամբ սահմանված է ապրանքի վերադարձի 15-օրյա երաշխիքային ժամկետ: Բոնուսային միավորները սկսում են հաշվեգրվել ԵՐԵՔՈՒՆԴ ԱՌ ԵՐԵՔՈՒՆԴ 15 օր անց, եթե ապրանքի վերադարձ չի կատարվել:'
                : 'Бонусные баллы после покупки зачисляются ежесекундно спустя 15 дней, если за этот период не был сделан возврат товаров (в соответствии с Законом РА «О защите прав потребителей»).'}
            </p>
            <div className="mt-2 p-2 bg-slate-950 rounded-lg font-mono text-[11px] text-teal-300 border border-slate-800 text-center">
              {isHy
                ? '15 օր առանց վերադարձի ➔ Դեպոզիտ × 10% / 31 536 000 վրկ (վայրկյան առ վայրկյան)'
                : '15 дней без возврата ➔ Депозит × 10% / 31 536 000 сек (ежесекундный поток)'}
            </div>
          </div>

          {/* Правило 3: Обязательный договор-оферта */}
          <div className="p-3.5 rounded-xl bg-slate-850/80 border border-cyan-500/40">
            <div className="flex items-center gap-2 font-semibold text-cyan-400 mb-1 text-sm">
              <FileCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                {isHy
                  ? '3. Պայմանագրի պայմանների պարտադիր ընդունում'
                  : '3. Обязательное принятие условий договора-оферты'}
              </span>
            </div>
            <p className="text-slate-300">
              {isHy
                ? '«Համակարգ 2000»-ը տալիս է ծախսերը ցմահ ավանդի վերածելու հնարավորություն պայմանագրի պայմաններով, որոնք Դուք պետք է ընթերցեք և ընդունեք:'
                : 'Система 2000 даёт возможность все ваши затраты превратить в пожизненный депозит с условиями договора, которые вы должны прочитать и принять.'}
            </p>
          </div>

          {/* Правило 4: Защита от бесконечного закольцовывания */}
          <div className="p-3.5 rounded-xl bg-slate-850/80 border border-amber-500/40">
            <div className="flex items-center gap-2 font-semibold text-amber-400 mb-1 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {isHy ? '4. Բոնուսներով վճարումը չի հանդիսանում դեպոզիտ' : '4. Оплата баллами не является депозитом'}
              </span>
            </div>
            <p className="text-slate-300">
              {isHy
                ? 'Ապրանքների դիմաց բոնուսներով վճարելիս դեպոզիտի մարմինը ՄՆՈՒՄ Է ԱՆՓՈՓՈԽ: Բոնուսները ծախսվում են միայն էկոհամակարգի ներսում:'
                : 'Оплата бонусными баллами списывает баллы, но не меняет тело депозита. Это гарантирует 100% экономическую стабильность.'}
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            {isHy ? 'Հասկանալի է, փակել' : 'Понятно, закрыть'}
          </button>
        </div>
      </div>
    </div>
  );
};
