import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import authBgImg from '../../assets/images/user_drive_bg.png';
import { 
  Mail, Lock, LogIn, UserPlus, AlertCircle, Eye, CheckCircle2, KeyRound, ArrowLeft 
} from 'lucide-react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile 
} from '../../lib/firebase';
import { saveUserProfile } from '../../lib/firestoreService';
import { getGoogleDriveDirectUrl } from '../../lib/treeUtils';

const posterBgImg = '/poster.jpg';
const directVideoUrl = '/login-bg.mp4';

interface AuthLandingScreenProps {
  onContinueAsGuest: () => void;
  onSuccessAuth: (message: string) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export function AuthLandingScreen({
  onContinueAsGuest,
  onSuccessAuth,
}: AuthLandingScreenProps) {
  const [customBg, setCustomBg] = useState<string | null>(() => {
    try {
      return localStorage.getItem('centralize_custom_login_bg');
    } catch {
      return null;
    }
  });

  const [imgSrc, setImgSrc] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('centralize_custom_login_bg');
      if (saved) {
        if (saved.startsWith('data:image/') || saved.startsWith('blob:')) {
          return saved;
        }
        const directUrl = getGoogleDriveDirectUrl(saved);
        if (directUrl) return directUrl;
      }
    } catch {}
    return authBgImg;
  });

  const handleImageError = () => {
    try {
      localStorage.removeItem('centralize_custom_login_bg');
    } catch {}
    setImgSrc(authBgImg);
  };

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResetSent(false);

    if (mode === 'forgot') {
      if (!email.trim()) {
        setError('Por favor, informe seu e-mail para recuperar a senha.');
        return;
      }
      setLoading(true);
      try {
        await sendPasswordResetEmail(auth, email.trim());
        setResetSent(true);
      } catch (err: any) {
        console.error('Erro ao enviar e-mail de redefinição:', err);
        if (err.code === 'auth/user-not-found') {
          setError('Nenhuma conta encontrada com este e-mail.');
        } else if (err.code === 'auth/invalid-email') {
          setError('Formato de e-mail inválido.');
        } else {
          setError('Não foi possível enviar o e-mail de redefinição. Verifique o endereço e tente novamente.');
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (mode === 'register' && password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name.trim()) {
          await updateProfile(userCredential.user, { displayName: name.trim() });
        }
        await saveUserProfile(userCredential.user);
        onSuccessAuth(`Conta criada com sucesso! Bem-vindo(a), ${name.trim() || userCredential.user.email}.`);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        await saveUserProfile(userCredential.user);
        onSuccessAuth(`Sessão iniciada como ${userCredential.user.displayName || userCredential.user.email}`);
      }
    } catch (err: any) {
      console.error('Erro de autenticação:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso. Faça login.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Formato de e-mail inválido.');
      } else {
        setError(err.message || 'Erro ao realizar login/cadastro. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await saveUserProfile(result.user);
      onSuccessAuth(`Conectado com o Google como ${result.user.displayName || result.user.email}!`);
    } catch (err: any) {
      console.error('Erro no Google Sign-In:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Não foi possível entrar com o Google. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] h-screen w-full bg-black text-neutral-100 font-sans flex flex-col md:flex-row overflow-hidden selection:bg-[#c8ff00] selection:text-neutral-950">
      
      {/* LEFT SIDE PANEL: Solid Black Sidebar containing Logo, Auth System & Non-clickable Platform Badges */}
      <div className="w-full md:w-[400px] lg:w-[460px] xl:w-[500px] 2xl:w-[540px] h-full bg-black z-20 border-r border-neutral-800/80 flex flex-col justify-between p-6 sm:p-7 lg:p-9 overflow-y-auto scrollbar-none flex-shrink-0 relative shadow-2xl">
        
        {/* Top Header: Brand Name */}
        <div className="flex items-center justify-between mb-3 lg:mb-4">
          <span className="font-bold text-xl tracking-tight text-white block">
            Centralize
          </span>
        </div>

        {/* Main Auth Form System */}
        <div className="my-auto py-2 w-full max-w-[380px] mx-auto">
          {/* Form Header Tabs */}
          <AnimatePresence mode="wait">
            {mode === 'forgot' ? (
              <motion.div
                key="forgot-header"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-between p-1.5 bg-black border border-neutral-800 rounded-2xl mb-3 sm:mb-4"
              >
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                    setResetSent(false);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer group"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-[#c8ff00] group-hover:-translate-x-0.5 transition-transform" />
                  <span>Voltar ao Login</span>
                </button>
                <span className="text-xs font-bold text-white pr-3">Recuperar Senha</span>
              </motion.div>
            ) : (
              <motion.div
                key="tab-header"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="relative flex items-center justify-between p-1 bg-black border border-neutral-800 rounded-2xl mb-3 sm:mb-4"
              >
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                    setResetSent(false);
                  }}
                  className={`relative z-10 flex-1 py-2 text-xs font-semibold rounded-xl transition-colors duration-200 cursor-pointer text-center ${
                    mode === 'login'
                      ? 'text-neutral-950 font-bold'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {mode === 'login' && (
                    <motion.div
                      layoutId="activeTabPill"
                      className="absolute inset-0 bg-[#c8ff00] rounded-xl shadow-md shadow-[#c8ff00]/25 z-[-1]"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    />
                  )}
                  Entrar na Conta
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                    setResetSent(false);
                  }}
                  className={`relative z-10 flex-1 py-2 text-xs font-semibold rounded-xl transition-colors duration-200 cursor-pointer text-center ${
                    mode === 'register'
                      ? 'text-neutral-950 font-bold'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {mode === 'register' && (
                    <motion.div
                      layoutId="activeTabPill"
                      className="absolute inset-0 bg-[#c8ff00] rounded-xl shadow-md shadow-[#c8ff00]/25 z-[-1]"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    />
                  )}
                  Criar Conta Grátis
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Social Google Login Button */}
          <AnimatePresence>
            {mode !== 'forgot' && (
              <motion.div
                key="google-auth-section"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-2 px-4 rounded-xl border border-neutral-800 bg-black hover:bg-neutral-900 hover:border-neutral-700 text-white font-semibold text-xs transition-all duration-200 cursor-pointer shadow-sm disabled:opacity-50 active:scale-[0.99]"
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continuar com o Google</span>
                </button>

                <div className="relative my-3 sm:my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-800"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-semibold">
                    <span className="bg-black px-3 text-neutral-400 border border-neutral-800 rounded-full">
                      ou com e-mail
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="p-2.5 sm:p-3 rounded-xl bg-red-950/50 border border-red-500/30 text-red-200 text-xs flex items-center gap-2 overflow-hidden"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                  <span>{error}</span>
                </motion.div>
              )}

              {resetSent && (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="p-2.5 sm:p-3 rounded-xl bg-[#c8ff00]/10 border border-[#c8ff00]/30 text-[#c8ff00] text-xs flex items-center gap-2 overflow-hidden"
                >
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#c8ff00]" />
                  <span>E-mail de redefinição enviado com sucesso! Verifique sua caixa de entrada e spam.</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Registration Name Field */}
            <AnimatePresence>
              {mode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Seu Nome
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nome completo ou apelido"
                    className="w-full px-3.5 py-2 text-xs bg-black border border-neutral-800 rounded-xl outline-none focus:border-[#c8ff00] focus:ring-2 focus:ring-[#c8ff00]/20 text-white placeholder-neutral-500 transition-all duration-200"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  required
                  className="w-full pl-10 pr-3.5 py-2 text-xs bg-black border border-neutral-800 rounded-xl outline-none focus:border-[#c8ff00] focus:ring-2 focus:ring-[#c8ff00]/20 text-white placeholder-neutral-500 transition-all duration-200"
                />
              </div>
            </div>

            {/* Password Field */}
            <AnimatePresence>
              {mode !== 'forgot' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden space-y-1"
                >
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-neutral-300">
                      Senha
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
                          setError(null);
                          setResetSent(false);
                        }}
                        className="text-[11px] text-neutral-300 hover:text-white hover:underline font-medium cursor-pointer transition-colors duration-200"
                      >
                        Esqueci a senha?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-3.5 py-2 text-xs bg-black border border-neutral-800 rounded-xl outline-none focus:border-[#c8ff00] focus:ring-2 focus:ring-[#c8ff00]/20 text-white placeholder-neutral-500 transition-all duration-200"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <motion.button
              layout
              type="submit"
              disabled={loading}
              className="w-full h-8 sm:h-9 px-3 bg-[#c8ff00] hover:bg-[#d4ff33] text-neutral-950 font-bold text-xs rounded-xl transition-all duration-200 shadow-md shadow-[#c8ff00]/25 hover:shadow-lg hover:shadow-[#c8ff00]/35 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2 active:scale-[0.98] overflow-hidden"
            >
              <AnimatePresence mode="wait">
                {mode === 'login' && (
                  <motion.div
                    key="btn-login"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{loading ? 'Entrando...' : 'Entrar no Sistema'}</span>
                  </motion.div>
                )}
                {mode === 'register' && (
                  <motion.div
                    key="btn-register"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{loading ? 'Cadastrando...' : 'Criar Minha Conta'}</span>
                  </motion.div>
                )}
                {mode === 'forgot' && (
                  <motion.div
                    key="btn-forgot"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-2"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>{loading ? 'Enviando...' : 'Enviar E-mail de Redefinição'}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </form>

          {/* Continue as Guest Button */}
          <div className="mt-3 sm:mt-4 pt-3 border-t border-neutral-800 text-center">
            <button
              type="button"
              onClick={onContinueAsGuest}
              className="w-full h-8 sm:h-9 px-3 rounded-xl bg-black hover:bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800 hover:border-neutral-700 text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <Eye className="w-3.5 h-3.5 text-[#c8ff00]" />
              <span>Experimentar sem conta (Modo Visitante)</span>
            </button>
          </div>
        </div>

        {/* Bottom Section: Non-clickable Platform Icons Indicating Availability */}
        <div className="pt-3 mt-2 border-t border-neutral-800/80 flex items-center justify-center gap-5 select-none pointer-events-none">
          {/* iOS Badge */}
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-neutral-300">
            <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.64-.78 1.08-1.85.96-2.92-.93.04-2.06.62-2.73 1.4-.59.68-1.11 1.78-.97 2.83 1.04.08 2.1-.53 2.74-1.31z"/>
            </svg>
            <span>iOS (iPhone)</span>
          </div>

          {/* Android Badge */}
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-neutral-300">
            <svg className="w-4 h-4 text-[#c8ff00] fill-current" viewBox="0 0 24 24">
              <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997 0-.5511.4482-.9993.9993-.9993.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997 0-.5511.4482-.9993.9993-.9993.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503c-1.4283-.6507-3.0401-1.0135-4.7368-1.0135-1.6967 0-3.3085.3628-4.7368 1.0135L4.6362 5.4467a.4158.4158 0 00-.5676-.1521.4158.4158 0 00-.1521.5676l1.9973 3.4592C2.6826 11.0705 0.5 14.2831 0 18h24c-.5-3.7169-2.6826-6.9295-5.8815-8.6786z"/>
            </svg>
            <span>Android</span>
          </div>
        </div>

      </div>

      {/* RIGHT SIDE DISPLAY AREA */}
      <div className="hidden md:flex flex-1 h-full relative overflow-hidden bg-black items-center justify-center">
        <img
          src={imgSrc}
          onError={handleImageError}
          alt="Centralize AI"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center select-none"
        />
      </div>

    </div>
  );
}

