import React, { createContext, useContext, useState, useCallback } from 'react';

// The candidate's journey progress. Kept in-app for this v0.1 (the web candidate
// flow is likewise driven by local/seed state — the candidate-write API is
// staff-only). Swap to server persistence when a candidate-scoped API exists.
export type Stage = 'new' | 'applied' | 'screening' | 'training' | 'testing' | 'recommended' | 'hired';

export type CandidateState = {
  name: string;
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

export function CandidateProvider({ children }: { children: React.ReactNode }) {
  const [cand, setCand] = useState<CandidateState>({
    name: '',
    applied: false,
    watched: [],
    score: null,
    stage: 'new',
  });

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
