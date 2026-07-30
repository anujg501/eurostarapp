import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// The candidate's journey progress. Kept in-app for this v0.1 (the web candidate
// flow is likewise driven by local/seed state — the candidate-write API is
// staff-only). Swap to server persistence when a candidate-scoped API exists.
export type Stage = 'new' | 'registered' | 'applied' | 'screening' | 'training' | 'testing' | 'recommended' | 'hired';

export type CandidateState = {
  name: string;
  candId: string | null; // display id from the pipeline, e.g. "EC-1008"
  applied: boolean;
  watched: string[]; // module/video ids watched
  score: number | null;
  stage: Stage;
};

type Ctx = {
  cand: CandidateState;
  setName: (n: string) => void;
  submitApplication: () => void;
  markWatched: (id: string) => void;
  setScore: (score: number) => void;
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
  profile?: { name?: string; candId?: string | null; stage?: string; score?: number | null; applied?: boolean };
}) {
  const [cand, setCand] = useState<CandidateState>({
    name: profile?.name ?? '',
    candId: profile?.candId ?? null,
    applied: false,
    watched: [],
    score: null,
    stage: 'new',
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
    }));
  }, [profile?.name, profile?.candId, profile?.stage, profile?.score]);

  const setName = useCallback((name: string) => setCand((c) => ({ ...c, name })), []);

  const submitApplication = useCallback(
    () => setCand((c) => ({ ...c, applied: true, stage: c.stage === 'new' ? 'training' : c.stage })),
    []
  );

  const markWatched = useCallback(
    (id: string) =>
      setCand((c) => (c.watched.includes(id) ? c : { ...c, watched: [...c.watched, id] })),
    []
  );

  const setScore = useCallback(
    (score: number) =>
      setCand((c) => ({
        ...c,
        score,
        stage: score >= PASS_PCT ? 'recommended' : 'testing',
      })),
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
