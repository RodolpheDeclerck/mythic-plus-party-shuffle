'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, ExternalLink, Calendar, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import apiUrl from '@/config/apiConfig';
import useWebSocket from '@/hooks/useWebSocket';
import useAuthCheck from '@/hooks/useAuthCheck';
import { cn } from '@/lib/utils';
import { riftVoidFill50, riftVoidFill60, riftVoidFill95 } from '@/lib/riftUi';

interface Event {
  id: number;
  name: string;
  code: string;
  createdAt?: string;
  participantCount?: number;
}

const Dashboard = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isAuthChecked } = useAuthCheck();
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [deleteConfirmCode, setDeleteConfirmCode] = useState<string | null>(
    null,
  );

  const fetchAdminEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const response = await axios.get<Event[]>(
        `${apiUrl}/api/events/admin-events`,
        { withCredentials: true },
      );
      setEvents(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthChecked && isAuthenticated !== null) {
      if (!isAuthenticated) {
        window.location.href = '/login';
      } else {
        void fetchAdminEvents();
      }
    }
  }, [isAuthenticated, isAuthChecked, fetchAdminEvents]);

  useWebSocket(
    () => {},
    () => {},
    fetchAdminEvents,
  );

  const handleOpenEvent = (eventCode: string) => {
    window.location.href = `/event?code=${encodeURIComponent(eventCode)}`;
  };

  const handleDeleteEvent = async (eventCode: string) => {
    try {
      await axios.delete(`${apiUrl}/api/events/${eventCode}`, {
        withCredentials: true,
      });
      setDeleteConfirmCode(null);
      void fetchAdminEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isAuthChecked && isAuthenticated === false) {
    return null;
  }
  if (!isAuthChecked || isAuthenticated !== true) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <Spinner className="h-8 w-8 text-cyan-400" />
        <p className="text-sm text-muted-foreground">
          {t('createEvent.checkingAuth')}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-cyan-400">
            {t('dashboard.eyebrow')}
          </p>
          <h1 className="text-2xl font-bold text-foreground">
            {t('dashboard.title')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('dashboard.subtitle')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button
            asChild
            variant="outline"
            className={cn(
              'border-purple-500/40 text-foreground hover:bg-purple-500/10',
              riftVoidFill60,
            )}
          >
            <Link href="/">{t('dashboard.joinExisting')}</Link>
          </Button>
          <Button asChild variant="portal">
            <Link href="/event/create">
              <Plus className="mr-2 h-4 w-4" />
              {t('dashboard.createEvent')}
            </Link>
          </Button>
        </div>
      </div>

      {eventsLoading ? (
        <div
          className={cn(
            'flex flex-col items-center justify-center gap-3 rounded-2xl border border-purple-500/20 py-16',
            riftVoidFill50,
          )}
        >
          <Spinner className="h-8 w-8 text-cyan-400" />
          <p className="text-sm text-muted-foreground">
            {t('dashboard.loadingEvents')}
          </p>
        </div>
      ) : events.length === 0 ? (
        <div
          className={cn(
            'rounded-2xl border border-purple-500/20 px-4 py-16 text-center',
            riftVoidFill50,
          )}
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/10">
            <Calendar className="h-8 w-8 text-purple-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            {t('dashboard.noEvents')}
          </h3>
          <p className="mx-auto mb-6 max-w-sm text-sm text-muted-foreground">
            {t('dashboard.noEventsDescription')}
          </p>
          <Button asChild variant="portal" className="shadow-none">
            <Link href="/event/create">
              <Plus className="mr-2 h-4 w-4" />
              {t('dashboard.createEvent')}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="relative rounded-xl bg-gradient-to-r from-purple-500/30 via-cyan-500/20 to-purple-500/30 p-px"
            >
              <div
                className={cn(
                  'rounded-xl p-5 backdrop-blur-sm',
                  riftVoidFill95,
                )}
              >
                {deleteConfirmCode === event.code ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-foreground">
                      {t('dashboard.confirmDelete')}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteConfirmCode(null)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {t('dashboard.deleteCancel')}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => void handleDeleteEvent(event.code)}
                        className="border border-red-500/50 bg-red-500/20 text-red-400 hover:bg-red-500/30"
                      >
                        {t('dashboard.deleteConfirm')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold text-foreground">
                        {event.name}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="rounded bg-cyan-400/10 px-2 py-0.5 font-mono text-xs text-cyan-400">
                            {event.code}
                          </span>
                        </span>
                        {event.createdAt ? (
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                            {t('dashboard.createdOn')}{' '}
                            {formatDate(event.createdAt) ?? '—'}
                          </span>
                        ) : null}
                        {typeof event.participantCount === 'number' ? (
                          <span className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 shrink-0" />
                            {event.participantCount}{' '}
                            {t('dashboard.participants')}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 sm:ml-4">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleOpenEvent(event.code)}
                        className="border border-cyan-500/50 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
                      >
                        <ExternalLink className="mr-1.5 h-4 w-4" />
                        {t('dashboard.openEvent')}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteConfirmCode(event.code)}
                        className="text-muted-foreground hover:bg-red-500/10 hover:text-red-400"
                        aria-label={t('dashboard.deleteConfirm')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
