import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Mail, Lock, LogIn, UserPlus, Sparkles, 
  AlertCircle, CheckCircle2, UserCheck, KeyRound, ArrowLeft
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

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  if (!isOpen) return null;

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
        console.error('Erro de redefinição de senha:', err);
        if (err.code === 'auth/user-not-found') {
          setError('Nenhuma conta encontrada com este e-mail.');
        } else if (err.code === 'auth/invalid-email') {
          setError('Formato de e-mail inválido.');
        } else {
          setError('Erro ao enviar e-mail de redefinição. Verifique o endereço e tente novamente.');
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError('Por favor, preencha todos os campos.');
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
        onSuccess(`Bem-vindo, ${name.trim() || userCredential.user.email}! Conta criada com sucesso.`);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        await saveUserProfile(userCredential.user);
        onSuccess(`Sessão iniciada como ${userCredential.user.displayName || userCredential.user.email}!`);
      }
      onClose();
    } catch (err: any) {
      console.error('Erro de autenticação:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está cadastrado. Faça login.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Formato de e-mail inválido.');
      } else {
        setError(err.message || 'Ocorreu um erro ao autenticar. Tente novamente.');
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
      onSuccess(`Conectado com o Google como ${result.user.displayName || result.user.email}!`);
      onClose();
    } catch (err: any) {
      console.error('Erro no Google Sign-In:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Erro ao conectar com a conta do Google. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-neutral-950/70 backdrop-blur-md transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", duration: 0.35, bounce: 0.1 }}
          className="bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-2xl rounded-2xl w-full max-w-md p-6 sm:p-7 shadow-2xl border border-neutral-200/80 dark:border-neutral-800 relative z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#c8ff00]/10 text-[#c8ff00] flex items-center justify-center shadow-2xs border border-[#c8ff00]/20">
                <Sparkles className="w-4 h-4 text-[#c8ff00]" />
              </div>
              <div>
                <h3 className="font-sans font-bold text-base text-neutral-900 dark:text-neutral-100">
                  {mode === 'login' && 'Entrar no Centralize AI'}
                  {mode === 'register' && 'Criar Conta'}
                  {mode === 'forgot' && 'Recuperar Senha'}
                </h3>
                <p className="font-sans text-xs text-neutral-500 dark:text-neutral-400">
                  {mode === 'forgot'
                    ? 'Enviaremos um link de redefinição para seu e-mail'
                    : 'Sincronize suas conversas e notas na nuvem'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Social Google Login Button (Only for login and register) */}
          {mode !== 'forgot' && (
            <>
              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-2 px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-sans text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-700/80 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              </div>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200 dark:border-neutral-800"></div>
                </div>
                <div className="relative flex justify-center text-[11px] uppercase tracking-wider font-semibold">
                  <span className="bg-white dark:bg-[#18181b] px-3 text-neutral-400">ou com e-mail</span>
                </div>
              </div>
            </>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5 mt-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {resetSent && (
              <div className="p-3 rounded-xl bg-[#c8ff00]/10 border border-[#c8ff00]/30 text-[#c8ff00] text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#c8ff00]" />
                <span>E-mail de redefinição enviado com sucesso! Verifique sua caixa de entrada e spam.</span>
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Nome (opcional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:border-[#c8ff00] focus:ring-2 focus:ring-[#c8ff00]/20 text-neutral-800 dark:text-neutral-100 transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:border-[#c8ff00] focus:ring-2 focus:ring-[#c8ff00]/20 text-neutral-800 dark:text-neutral-100 transition-all"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
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
                      className="text-[11px] text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:underline font-medium cursor-pointer transition-colors"
                    >
                      Esqueci a senha?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:border-[#c8ff00] focus:ring-2 focus:ring-[#c8ff00]/20 text-neutral-800 dark:text-neutral-100 transition-all"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-9 px-4 bg-[#c8ff00] hover:bg-[#b8e600] text-neutral-950 font-sans text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2 active:scale-98"
            >
              {mode === 'login' && (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>{loading ? 'Entrando...' : 'Entrar na Conta'}</span>
                </>
              )}
              {mode === 'register' && (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>{loading ? 'Cadastrando...' : 'Criar Conta'}</span>
                </>
              )}
              {mode === 'forgot' && (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>{loading ? 'Enviando...' : 'Enviar E-mail de Redefinição'}</span>
                </>
              )}
            </button>
          </form>

          {/* Toggle login / register / forgot */}
          <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-center font-sans text-xs">
            {mode === 'login' && (
              <p className="text-neutral-500 dark:text-neutral-400">
                Ainda não tem conta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                    setResetSent(false);
                  }}
                  className="text-[#c8ff00] font-semibold hover:underline cursor-pointer"
                >
                  Cadastre-se grátis
                </button>
              </p>
            )}
            {mode === 'register' && (
              <p className="text-neutral-500 dark:text-neutral-400">
                Já possui uma conta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                    setResetSent(false);
                  }}
                  className="text-[#c8ff00] font-semibold hover:underline cursor-pointer"
                >
                  Faça login
                </button>
              </p>
            )}
            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setResetSent(false);
                }}
                className="text-neutral-400 hover:text-neutral-200 font-semibold hover:underline cursor-pointer flex items-center justify-center gap-1 mx-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#c8ff00]" />
                <span>Voltar para o Login</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
