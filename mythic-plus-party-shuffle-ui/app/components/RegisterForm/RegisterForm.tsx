'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import axios, { isAxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import { Trans, useTranslation } from 'react-i18next';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import apiUrl from '@/config/apiConfig';
import { cn } from '@/lib/utils';
import { riftVoidFill80, riftVoidFill50 } from '@/lib/riftUi';

const PASSWORD_MIN = 6;
const USERNAME_MIN = 3;

function passwordStrengthScore(password: string): 0 | 1 | 2 | 3 | 4 {
  if (!password) return 0;
  let score = 0;
  if (password.length >= PASSWORD_MIN) score += 1;
  if (password.length >= 10) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(4, score) as 0 | 1 | 2 | 3 | 4;
}

const RegisterForm = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const strength = useMemo(() => passwordStrengthScore(password), [password]);

  const passwordsMatch = confirmPassword === '' || password === confirmPassword;

  const isFormValid =
    email.trim() !== '' &&
    username.trim().length >= USERNAME_MIN &&
    password.length >= PASSWORD_MIN &&
    password === confirmPassword &&
    acceptTerms;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (username.trim().length < USERNAME_MIN) {
      setErrorMessage(t('register.usernameTooShort'));
      return;
    }
    if (password.length < PASSWORD_MIN) {
      setErrorMessage(t('register.passwordTooShort'));
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage(t('register.passwordsDoNotMatch'));
      return;
    }
    if (!acceptTerms) {
      setErrorMessage(t('register.mustAcceptTerms'));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(`${apiUrl}/auth/register`, {
        email,
        password,
        username,
      });

      if (response.status === 200 || response.status === 201) {
        router.replace('/login');
        return;
      }
      setIsSubmitting(false);
    } catch (error: unknown) {
      const message =
        isAxiosError(error) && error.response?.data?.message
          ? String(error.response.data.message)
          : t('register.errorGeneric');
      setErrorMessage(message);
      setIsSubmitting(false);
    }
  };

  const inputClass = cn(
    'h-11 border-purple-500/30 pr-11 text-[var(--rift-text)] shadow-none placeholder:text-muted-foreground focus-visible:border-cyan-400/50 focus-visible:ring-cyan-400',
    riftVoidFill80,
  );
  const inputClassNoToggle = cn(
    'h-11 border-purple-500/30 text-[var(--rift-text)] shadow-none placeholder:text-muted-foreground focus-visible:border-cyan-400/50 focus-visible:ring-cyan-400',
    riftVoidFill80,
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {errorMessage ? (
        <div
          id="register-form-error"
          role="alert"
          aria-live="polite"
          className="rounded-md border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400"
        >
          {errorMessage}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <label
          htmlFor="register-email"
          className="text-sm font-medium text-[var(--rift-text)]"
        >
          {t('register.emailLabel')}
        </label>
        <Input
          id="register-email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder={t('register.emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
          required
          aria-describedby={errorMessage ? 'register-form-error' : undefined}
          className={inputClassNoToggle}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="register-username"
          className="text-sm font-medium text-[var(--rift-text)]"
        >
          {t('register.username')}
        </label>
        <Input
          id="register-username"
          type="text"
          name="username"
          autoComplete="username"
          placeholder={t('register.usernamePlaceholder')}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isSubmitting}
          required
          minLength={USERNAME_MIN}
          className={inputClassNoToggle}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="register-password"
          className="text-sm font-medium text-[var(--rift-text)]"
        >
          {t('register.passwordLabel')}
        </label>
        <div className="relative">
          <Input
            id="register-password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            autoComplete="new-password"
            placeholder={t('register.passwordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
            required
            minLength={PASSWORD_MIN}
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--rift-void)]"
            aria-label={
              showPassword ? t('login.hidePassword') : t('login.showPassword')
            }
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {password.length > 0 ? (
          <div className="space-y-2">
            <div className="flex gap-1.5" aria-hidden>
              {[0, 1, 2, 3].map((i) => {
                const active = strength > i;
                const barClass =
                  strength <= 1
                    ? active
                      ? 'bg-red-500/90'
                      : 'bg-white/10'
                    : strength === 2
                      ? active
                        ? 'bg-amber-500/90'
                        : 'bg-white/10'
                      : strength === 3
                        ? active
                          ? 'bg-yellow-400/90'
                          : 'bg-white/10'
                        : active
                          ? 'bg-cyan-400/90'
                          : 'bg-white/10';
                return (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${barClass}`}
                  />
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {t(`register.passwordStrength.level${strength}`)}
            </p>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="register-confirm-password"
          className="text-sm font-medium text-[var(--rift-text)]"
        >
          {t('register.confirmPasswordLabel')}
        </label>
        <div className="relative">
          <Input
            id="register-confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            name="confirmPassword"
            autoComplete="new-password"
            placeholder={t('register.confirmPasswordPlaceholder')}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isSubmitting}
            required
            aria-invalid={!passwordsMatch}
            className={`${inputClass} pr-11 ${!passwordsMatch ? 'border-red-500/50' : ''}`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--rift-void)]"
            aria-label={
              showConfirmPassword
                ? t('login.hidePassword')
                : t('login.showPassword')
            }
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {confirmPassword.length > 0 && !passwordsMatch ? (
          <p className="text-xs text-red-400">
            {t('register.passwordsDoNotMatch')}
          </p>
        ) : null}
      </div>

      <div
        className={cn(
          'flex items-start gap-3 rounded-md border border-purple-500/20 p-3',
          riftVoidFill50,
        )}
      >
        <Checkbox
          id="register-terms"
          checked={acceptTerms}
          onCheckedChange={(checked) => setAcceptTerms(checked === true)}
          className="mt-0.5 border-purple-500/50 data-[state=checked]:border-cyan-500 data-[state=checked]:bg-cyan-500"
        />
        <label
          htmlFor="register-terms"
          className="cursor-pointer text-sm leading-snug text-muted-foreground"
        >
          <Trans
            i18nKey="register.acceptTerms"
            components={{
              termsLink: (
                <Link
                  href="/terms"
                  className="font-medium text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline focus:outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-cyan-400"
                />
              ),
              privacyLink: (
                <Link
                  href="/privacy"
                  className="font-medium text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline focus:outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-cyan-400"
                />
              ),
            }}
          />
        </label>
      </div>

      <Button
        type="submit"
        variant="portal"
        disabled={!isFormValid || isSubmitting}
        className="mt-1 h-12 w-full"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner className="h-4 w-4 text-white" />
            {t('register.submitting')}
          </span>
        ) : (
          t('register.submit')
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t('register.hasAccount')}{' '}
        <Link
          href="/login"
          className="font-medium text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline focus:outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--rift-void)]"
        >
          {t('register.signIn')}
        </Link>
      </p>

      <div className="mt-2 border-t border-purple-500/20 pt-4 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-cyan-400 hover:underline focus:outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--rift-void)]"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('login.joinWithCode')}
        </Link>
      </div>
    </form>
  );
};

export default RegisterForm;
