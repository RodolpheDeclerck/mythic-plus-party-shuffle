'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { LogIn, LogOut, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher/LanguageSwitcher';
import useAuthCheck from '@/hooks/useAuthCheck';

export function EventPageToolbar() {
  const { t } = useTranslation();
  const { isAuthenticated, isAuthChecked, handleLogout } = useAuthCheck();

  return (
    <div className="fixed right-4 top-4 z-50 flex flex-nowrap items-center justify-end gap-2 sm:gap-3">
      <div className="flex shrink-0 items-center">
        <LanguageSwitcher />
      </div>
      {isAuthChecked ? (
        isAuthenticated ? (
          <div className="flex shrink-0 flex-nowrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-purple-500/20 bg-purple-900/30 px-3 py-1.5 text-sm text-muted-foreground">
              <User className="h-3.5 w-3.5 shrink-0" />
              <span>{t('common.account')}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void handleLogout?.()}
              className="text-muted-foreground hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut className="mr-1.5 h-4 w-4" />
              {t('common.logout')}
            </Button>
          </div>
        ) : (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="shrink-0 border-purple-500/40 text-purple-400 hover:bg-purple-500/10"
          >
            <Link href="/login">
              <LogIn className="mr-1.5 h-4 w-4" />
              {t('common.login')}
            </Link>
          </Button>
        )
      ) : null}
    </div>
  );
}
