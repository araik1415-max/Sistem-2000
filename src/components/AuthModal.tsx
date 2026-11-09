import React, { useState } from 'react';
import {
  X,
  UserPlus,
  LogIn,
  User,
  Lock,
  Mail,
  Phone,
  Sparkles,
  CheckCircle2,
  Clock,
  Activity,
  Shield,
} from 'lucide-react';
import { UserProfile, Language } from '../types';
import { formatUsageDuration } from '../utils/time';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onLogin: (user: UserProfile) => void;
  onLogout: () => void;
  lang: Language;
  totalUsageSeconds: number;
  transactionCount: number;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
  lang,
  totalUsageSeconds,
  transactionCount,
}) => {
  const [tab, setTab] = useState<'register' | 'login'>('register');
  const [name, setName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const { user, profile, signInWithGoogle, signOutUser } = useAuth();

  if (!isOpen) return null;

  const isHy = lang === 'hy';

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setError('');
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setError(err?.message || 'Ошибка авторизации через Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogoutAction = async () => {
    try {
      await signOutUser();
    } catch {
      // ignore
    }
    onLogout();
    onClose();
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(isHy ? 'Խնդրում ենք լրացնել Ձեր անունը' : 'Пожалуйста, введите ваше имя');
      return;
    }
    if (!emailOrPhone.trim()) {
      setError(isHy ? 'Լրացրեք հեռախոսահամարը կամ էլ. փոստը' : 'Введите телефон или email');
      return;
    }
    if (password.length < 4) {
      setError(isHy ? 'Գաղտնաբառը պետք է լինի առնվազն 4 նիշ' : 'Пароль должен быть не менее 4 символов');
      return;
    }

    const newUser: UserProfile = {
      id: `usr_${Date.now()}`,
      name: name.trim(),
      emailOrPhone: emailOrPhone.trim(),
      isLoggedIn: true,
      registeredAt: new Date().toLocaleDateString(isHy ? 'hy-AM' : 'ru-RU'),
    };

    onLogin(newUser);
    setError('');
    onClose();
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone.trim()) {
      setError(isHy ? 'Մուտքագրեք հեռախոսահամար կամ էլ. փոստ' : 'Введите телефон или email');
      return;
    }
    const loggedUser: UserProfile = {
      id: currentUser.id || `usr_${Date.now()}`,
      name: currentUser.name || (isHy ? 'Արայիկ Պետրոսյան' : 'Араик Петросян'),
      emailOrPhone: emailOrPhone.trim(),
      isLoggedIn: true,
      registeredAt: currentUser.registeredAt || new Date().toLocaleDateString(),
    };
    onLogin(loggedUser);
    setError('');
    onClose();
  };

  const handleQuickDemo = (
    demoName: string,
    contact: string,
    role: 'customer' | 'supplier' | 'admin' = 'customer',
    extra?: Partial<UserProfile>
  ) => {
    const user: UserProfile = {
      id: role === 'admin' ? 'owner_araik_1995' : `${role}_${Date.now()}`,
      name: demoName,
      emailOrPhone: contact,
      isLoggedIn: true,
      role,
      isAdmin: role === 'admin',
      b2cContractStatus: role === 'customer' ? 'none' : undefined,
      b2bContractStatus: role === 'supplier' ? 'none' : undefined,
      registeredAt: new Date().toLocaleDateString(isHy ? 'hy-AM' : 'ru-RU'),
      ...extra,
    };
    onLogin(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl p-6 text-slate-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label={isHy ? 'Փակել' : 'Закрыть'}
        >
          <X className="w-5 h-5" />
        </button>

        {user || currentUser.isLoggedIn ? (
          /* Окно профиля авторизованного пользователя (Firebase Auth + Firestore) */
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="avatar"
                    className="w-full h-full rounded-[10px] object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center text-emerald-400 font-bold text-lg">
                    {(user?.displayName || currentUser.name).charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  <span>{user?.displayName || currentUser.name}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  {profile?.role === 'admin' && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      ADMIN
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400">{user?.email || currentUser.emailOrPhone}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400/90 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>{user ? 'Google Auth & Firestore Live' : (isHy ? 'Գրանցված է՝ ' : 'Зарегистрирован: ') + currentUser.registeredAt}</span>
                </div>
              </div>
            </div>

            {/* МЕТРИКИ АВТОРИЗОВАННОГО ПОЛЬЗОВАТЕЛЯ: Балансы Firestore */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-slate-850 p-2.5 rounded-xl border border-slate-750 text-center">
                <div className="text-[10px] text-slate-400 mb-0.5">{isHy ? 'Հաշվեկշիռ' : 'Баланс'}</div>
                <div className="text-xs font-bold text-white font-mono">
                  {(profile?.realBalance ?? 50000).toLocaleString()} ֏
                </div>
              </div>
              <div className="bg-slate-850 p-2.5 rounded-xl border border-slate-750 text-center">
                <div className="text-[10px] text-emerald-400 mb-0.5">10% {isHy ? 'Ավանդ' : 'Депозит'}</div>
                <div className="text-xs font-bold text-emerald-400 font-mono">
                  {(profile?.deposit ?? 150000).toLocaleString()} ֏
                </div>
              </div>
              <div className="bg-slate-850 p-2.5 rounded-xl border border-slate-750 text-center">
                <div className="text-[10px] text-amber-400 mb-0.5">⭐ {isHy ? 'Բալեր' : 'Баллы'}</div>
                <div className="text-xs font-bold text-amber-400 font-mono">
                  {(profile?.bonusPoints ?? 1500).toLocaleString()}
                </div>
              </div>
            </div>

            {/* МЕТРИКИ: Время в системе + Транзакции */}
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <div className="bg-slate-850 p-3 rounded-xl border border-slate-750">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isHy ? 'Համակարգում' : 'В системе'}</span>
                </div>
                <div className="text-sm font-bold text-white font-mono">
                  {formatUsageDuration(totalUsageSeconds, lang)}
                </div>
              </div>

              <div className="bg-slate-850 p-3 rounded-xl border border-slate-750">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isHy ? 'Գործարքներ' : 'Транзакции'}</span>
                </div>
                <div className="text-sm font-bold text-emerald-400 font-mono">
                  {transactionCount} {isHy ? 'գործարք' : 'операций'}
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-850 rounded-xl border border-slate-750 mb-5 text-xs text-slate-300">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-1">
                <Sparkles className="w-4 h-4" />
                <span>{isHy ? 'Համակարգ 2000-ի պաշտպանված հաշիվ' : 'Защищенный аккаунт Система 2000'}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isHy
                  ? 'Տվյալները համաժամեցվում են Firestore տվյալների բազայի հետ: Բոլոր գործարքները գրանցվում են լեջերում:'
                  : 'Данные синхронизируются с базой Firestore. Все операции фиксируются в финансовом леджере.'}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleLogoutAction}
                className="flex-1 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 text-xs font-semibold transition-colors cursor-pointer"
              >
                {isHy ? 'Դուրս գալ հաշվից' : 'Выйти из аккаунта'}
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                {isHy ? 'Պատրաստ է' : 'Готово'}
              </button>
            </div>
          </div>
        ) : (
          /* Форма регистрации и входа */
          <div>
            {/* КНОПКА GOOGLE SIGN-IN FIREBASE */}
            <div className="mb-4">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2.5 transition-all shadow-md cursor-pointer disabled:opacity-60"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>
                  {googleLoading
                    ? (isHy ? 'Մուտք...' : 'Авторизация...')
                    : (isHy ? 'Մուտք Google-ով (Firebase Auth)' : 'Войти через Google (Firebase Auth)')}
                </span>
              </button>

              <div className="relative my-3 flex items-center justify-center">
                <div className="border-t border-slate-800 w-full"></div>
                <span className="bg-slate-900 px-2 text-[10px] text-slate-500 uppercase tracking-wider relative">
                  {isHy ? 'կամ սովորական գրանցում' : 'или обычная регистрация'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTab('register');
                    setError('');
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    tab === 'register'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isHy ? 'Գրանցում' : 'Регистрация'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setError('');
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    tab === 'login'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{isHy ? 'Մուտք' : 'Вход'}</span>
                </button>
              </div>
            </div>


            {error && (
              <div className="mb-3 p-2 bg-rose-950/40 border border-rose-800/60 text-rose-300 rounded-lg text-xs">
                {error}
              </div>
            )}

            {tab === 'register' ? (
              <form onSubmit={handleRegister} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    {isHy ? 'Անուն և Ազգանուն' : 'Имя и Фамилия'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder={isHy ? 'Օրինակ՝ Արայիկ Պետրոսյան' : 'Например: Араик Петросян'}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    {isHy ? 'Հեռախոսահամար կամ էլ. փոստ' : 'Телефон или Email'}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="+374 91 123456"
                      value={emailOrPhone}
                      onChange={(e) => setEmailOrPhone(e.target.value)}
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    {isHy ? 'Գաղտնաբառ' : 'Пароль'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="p-2.5 bg-emerald-950/20 border border-emerald-900/40 rounded-xl text-[11px] text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    {isHy
                      ? 'Գրանցման պահին Ձեզ կտրամադրվի 500 բոնուսային միավոր նվեր:'
                      : 'При регистрации вам начисляется приветственный бонус 500 баллов!'}
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-700/20 cursor-pointer"
                >
                  {isHy ? 'Ստեղծել հաշիվ' : 'Зарегистрироваться'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    {isHy ? 'Հեռախոսահամար կամ էլ. փոստ' : 'Телефон или Email'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="+374 91 123456"
                      value={emailOrPhone}
                      onChange={(e) => setEmailOrPhone(e.target.value)}
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    {isHy ? 'Գաղտնաբառ' : 'Пароль'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-700/20 cursor-pointer"
                >
                  {isHy ? 'Մուտք գործել' : 'Войти'}
                </button>
              </form>
            )}

            {/* 3 типа входа в систему: Клиент (B2C), Поставщик (B2B), Администратор и Владелец */}
            <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 block text-center">
                {isHy ? 'Ընտրեք մուտքի տեսակը համակարգ՝' : 'Выберите тип входа в систему:'}
              </span>

              <button
                type="button"
                onClick={() =>
                  handleQuickDemo(
                    isHy ? 'Արամ Սարգսյան (Հաճախորդ B2C)' : 'Арам Саргсян (Клиент B2C)',
                    '+374 91 200001',
                    'customer'
                  )
                }
                className="w-full py-2 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-sky-500/30 text-left transition-colors cursor-pointer"
              >
                <div className="text-xs font-bold text-sky-300">
                  1. {isHy ? 'Հաճախորդ (B2C Գնորդ)' : 'Клиент (B2C Покупатель)'}
                </div>
                <div className="text-[10px] text-slate-400">
                  {isHy
                    ? 'Գնումներ, կատալոգ, B2C պայմանագիր ադմինի հաստատմամբ (ՀՀ օրենք)'
                    : 'Покупки, каталог, B2C договор с одобрения админа (Закон РА)'}
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickDemo(
                    isHy ? '«ԱրմՍոսինձ» ՍՊԸ (Մատակարար B2B)' : 'ООО «АрмСосиндз» (Поставщик B2B)',
                    '+374 10 550022',
                    'supplier'
                  )
                }
                className="w-full py-2 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-emerald-500/30 text-left transition-colors cursor-pointer"
              >
                <div className="text-xs font-bold text-emerald-300">
                  2. {isHy ? 'Մատակարար (B2B Գործընկեր)' : 'Поставщик (B2B Партнёр)'}
                </div>
                <div className="text-[10px] text-slate-400">
                  {isHy
                    ? 'Ապրանքների ավելացում (ստուգումից հետո), B2B պայմանագիր, վերադարձի վիճարկում'
                    : 'Добавление товаров (после проверки), B2B договор, споры по возврату'}
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickDemo(
                    isHy ? 'Արայիկ Բաղդասարյան Անուշ' : 'Араик Багдасарян Ануш',
                    '+374 77 47 12 58 • araik1415@gmail.com',
                    'admin',
                    {
                      birthDate: '17.06.1995',
                      phone: '+374 77 47 12 58',
                      email: 'araik1415@gmail.com',
                    }
                  )
                }
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/10 hover:from-amber-500/30 hover:to-orange-500/20 border border-amber-500/50 text-left transition-colors cursor-pointer"
              >
                <div className="text-xs font-extrabold text-amber-300">
                  3. {isHy ? 'Ադմինիստրատոր և Սեփականատեր՝ Արայիկ Բաղդասարյան Անուշ' : 'Администратор и Владелец: Араик Багдасарян Ануш'}
                </div>
                <div className="text-[10px] text-amber-200/80 font-mono">
                  17.06.1995 • +374 77 47 12 58 • araik1415@gmail.com
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
