import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from './api';

// The candidate's journey progress.
//
// This used to live in memory only, which made progress a property of the
// handset rather than of the candidate: the watched list came back empty after
// every restart and on every other device they signed in on, and since the test
// gate reads that list, the assessment could not be started there at all. It is
// now seeded from the server and written back to it, so the same account shows
// the same progress everywhere.
export type Stage = 'new' | 'registered' | 'applied' | 'screening' | 'training' | 'testing' | 'recommended' | 'hired';

export type CandidateState = {
  name: string;
  candId: string | null; // display id from the pipeline, e.g. "EC-1008"
  applied: boolean;
  watched: string[]; // module/video ids watched
  score: number | null;
  passPct: number; // the pass mark the office set (the server is the source of truth)
  stage: Stage;
  testConsumed: boolean; // the one attempt has been used (server's answer, not this phone's)
};

type Ctx = {
  cand: CandidateState;
  setName: (n: string) => void;
  submitApplication: () => void;
  markWatched: (id: string) => void;
  // The server marks the paper, so it decides pass/fail and reports the mark it
  // used. Both are optional so the old local fallback still compiles.
  setScore: (score: number, passed?: boolean, passPct?: number) => void;
};

const PASS_PCT = 70;

const CandidateContext = createContext<Ctx | null>(null);

export function CandidateProvider({
  children,
  profile,
}: {
  children: React.ReactNode;
  // Who is signed in, from /auth/me. Without this the dashboard greeted a
  // registered candidate as "Hi 👋" with no name and no id.
  profile?: {
    name?: string;
    candId?: string | null;
    stage?: string;
    score?: number | null;
    applied?: boolean;
    watched?: string[];
    testConsumed?: boolean;
  };
}) {
  const [cand, setCand] = useState<CandidateState>({
    name: profile?.name ?? '',
    candId: profile?.candId ?? null,
    applied: false,
    watched: [],
    score: null,
    passPct: PASS_PCT,
    stage: 'new',
    testConsumed: false,
  });

  // The profile arrives after the first render (it is fetched), so fold it in
  // when it lands — but never clobber a name the candidate has since edited.
  useEffect(() => {
    if (!profile) return;
    setCand((c) => ({
      ...c,
      name: c.name || profile.name || '',
      candId: c.candId ?? profile.candId ?? null,
      // Registration already creates the pipeline row at stage "applied", so
      // the stage cannot tell us whether the FORM was submitted — the saved
      // form fields do. Without this the dashboard asked them to apply again
      // after every restart.
      applied: c.applied || !!profile.applied,
      score: c.score ?? profile.score ?? null,
      stage: (profile.stage as Stage) ?? c.stage,
      // The server's list is the real one — it holds what was watched on every
      // device, not just this one. Anything ticked off here while the profile
      // was in flight is folded in rather than dropped.
      watched: [...new Set([...(profile.watched ?? []), ...c.watched])],
      testConsumed: c.testConsumed || !!profile.testConsumed,
    }));
  }, [profile?.name, profile?.candId, profile?.stage, profile?.score, profile?.watched, profile?.testConsumed]);

  const setName = useCallback((name: string) => setCand((c) => ({ ...c, name })), []);

  const submitApplication = useCallback(
    () => setCand((c) => ({ ...c, applied: true, stage: c.stage === 'new' ? 'training' : c.stage })),
    []
  );

  // Shown at once, saved to the server behind it: a candidate should never wait
  // on the network to see a video tick off. If the write fails the next profile
  // load simply restores the server's list.
  const markWatched = useCallback((id: string) => {
    let isNew = false;
    setCand((c) => {
      if (c.watched.includes(id)) return c;
      isNew = true;
      return { ...c, watched: [...c.watched, id], stage: c.stage === 'applied' ? 'training' : c.stage };
    });
    if (isNew) api.markWatched(id).catch(() => {});
  }, []);

  const setScore = useCallback(
    (score: number, passed?: boolean, passPct?: number) =>
      setCand((c) => {
        const pp = passPct ?? c.passPct;
        const ok = passed ?? score >= pp;
        return { ...c, score, passPct: pp, stage: ok ? 'recommended' : 'testing', testConsumed: true };
      }),
    []
  );

  return (
    <CandidateContext.Provider value={{ cand, setName, submitApplication, markWatched, setScore }}>
      {children}
    </CandidateContext.Provider>
  );
}

export function useCandidate() {
  const ctx = useContext(CandidateContext);
  if (!ctx) throw new Error('useCandidate must be used within CandidateProvider');
  return ctx;
}

export const LMS_PASS_PCT = PASS_PCT;
