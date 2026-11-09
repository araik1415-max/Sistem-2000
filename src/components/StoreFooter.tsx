import React from 'react';
import { Phone, Mail, Send, MessageCircle, MapPin, ShieldCheck, Heart } from 'lucide-react';
import { StoreContactInfo, Language } from '../types';

interface StoreFooterProps {
  contact: StoreContactInfo;
  lang: Language;
  annualRate: number;
  onOpenAgreement?: () => void;
}

export const StoreFooter: React.FC<StoreFooterProps> = ({ contact, lang, annualRate, onOpenAgreement }) => {
  const isHy = lang === 'hy';

  return (
    <footer className="w-full mt-4 pt-6 pb-8 border-t border-slate-800/80 text-slate-400">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        {/* Սյուն 1: Խանութի տվյալներ */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-bold text-white text-sm">
              {isHy ? '«Համակարգ 2000» Խանութ' : '«Система 2000» Магазин'}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-mono font-bold">
              {(annualRate * 100).toFixed(0)}% APY
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
            {isHy
              ? 'Առաջին հայկական էլեկտրոնային խանութը, որտեղ յուրաքանչյուր գնում վերածվում է աճող դեպոզիտի:'
              : 'Первый армянский интернет-магазин, где каждая покупка формирует растущий капитал.'}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{contact.deliveryCity}</span>
          </div>
        </div>

        {/* Սյուն 2: Կապ և աջակցություն */}
        <div>
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2.5">
            {isHy ? 'Հետադարձ կապ' : 'Связь и поддержка'}
          </h4>
          <div className="space-y-1.5 text-xs">
            <a
              href={`tel:${contact.phone}`}
              className="flex items-center gap-2 text-slate-300 hover:text-emerald-400 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>{contact.phone}</span>
            </a>
            <a
              href={`mailto:${contact.email}`}
              className="flex items-center gap-2 text-slate-300 hover:text-emerald-400 transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-sky-400" />
              <span>{contact.email}</span>
            </a>
            <div className="flex items-center gap-3 pt-1">
              <span className="flex items-center gap-1 text-[11px] text-sky-400">
                <Send className="w-3 h-3" />
                {contact.telegram}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                <MessageCircle className="w-3 h-3" />
                {contact.whatsapp}
              </span>
            </div>
          </div>
        </div>

        {/* Սյուն 3: Վճարային գործընկերներ */}
        <div>
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2.5">
            {isHy ? 'Ընդունվող վճարումներ' : 'Платежные методы'}
          </h4>
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold">
              Idram QR
            </span>
            <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold">
              Telcell QR
            </span>
            <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold">
              ArCa
            </span>
            <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold">
              Visa / MC
            </span>
            <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold">
              Apple Pay
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isHy ? '3D Secure 256-bit պաշտպանություն' : '3D Secure 256-bit шифрование'}</span>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-3 flex-wrap">
          <span>
            © 2026 {isHy ? '«Համակարգ 2000» Բոլոր իրավունքները պաշտպանված են:' : '«Система 2000» Все права защищены.'}
          </span>
          {onOpenAgreement && (
            <button
              onClick={onOpenAgreement}
              className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors cursor-pointer"
            >
              {isHy ? 'Էկոհամակարգի օֆերտայի պայմանագիր' : 'Договор-оферта экосистемы'}
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span>{isHy ? 'Պատրաստված է' : 'Сделано с'}</span>
          <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
          <span>{isHy ? 'Հայաստանում' : 'в Армении'}</span>
        </div>
      </div>
    </footer>
  );
};
