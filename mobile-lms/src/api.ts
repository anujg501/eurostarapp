// API client for the Eurostar back room (LMS candidate app).
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';

const CONFIGURED: string =
  (Constants.expoConfig?.extra as any)?.apiBaseUrl || 'https://eurostar-api.onrender.com';

// How long to wait before giving up on a request. Without this a phone that
// cannot reach the back room simply spins forever — fetch has no default
// timeout, so the Register button stayed in its loading state indefinitely.
const TIMEOUT_MS = 20000;

/**
 * On a real phone "localhost" is the phone itself, so a dev config pointing at
 * http://localhost:4000 only works while an `adb reverse` tunnel is up — and
 * that tunnel dies the moment the USB cable is unplugged. Metro already knows
 * the dev machine's address, so borrow its host and keep the configured port.
 */
function resolveBaseUrl(url: string): string {
  const m = /^(https?:\/\/)(localhost|127\.0\.0\.1)(:\d+)?(.*)$/i.exec(url);
  if (!m) return url;

  // e.g. "192.168.1.19:8081" — the packager the app was loaded from.
  const hostUri: string | undefined =
    (Constants.expoConfig as any)?.hostUri ||
    (Constants as any).expoGoConfig?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
  const host = hostUri?.split(':')[0];
  if (!host || host === 'localhost' || host === '127.0.0.1') return url;

  return `${m[1]}${host}${m[3] ?? ''}${m[4] ?? ''}`;
}

const BASE_URL: string = resolveBaseUrl(CONFIGURED);

// Which address the app actually settled on is the first thing worth knowing
// when requests fail on a device, so say it once at start-up.
// eslint-disable-next-line no-console
if (__DEV__) console.log(`[api] back room: ${BASE_URL} (configured: ${CONFIGURED})`);

let accessToken: string | null = null;

export async function loadToken(): Promise<string | null> {
  if (accessToken) return accessToken;
  accessToken = await AsyncStorage.getItem('eurostar_lms_token');
  return accessToken;
}

export async function setToken(token: string | null): Promise<void> {
  accessToken = token;
  if (token) await AsyncStorage.setItem('eurostar_lms_token', token);
  else await AsyncStorage.removeItem('eurostar_lms_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };
  // A caller can clear a default by passing it as undefined — a multipart upload
  // must let the runtime set content-type itself so the boundary is included.
  for (const k of Object.keys(headers)) {
    if (headers[k] === undefined) delete headers[k];
  }
  const token = await loadToken();
  if (token) headers.authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let resp: Response;
  try {
    resp = await fetch(BASE_URL + path, { ...options, headers, signal: controller.signal });
  } catch (e: any) {
    // A dead tunnel, the wrong Wi-Fi or a stopped server all land here. Say so
    // plainly instead of leaving the caller's spinner running.
    const timedOut = e?.name === 'AbortError';
    throw new Error(
      timedOut
        ? `The back room did not respond (${BASE_URL}). Check it is running and reachable from this phone.`
        : `Cannot reach the back room at ${BASE_URL}. Check your network.`
    );
  } finally {
    clearTimeout(timer);
  }

  const text = await resp.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!resp.ok) {
    const message = (data && data.error) || `Request failed (${resp.status})`;
    // Carry the status: callers need to tell "the server rejected you" apart
    // from "the server could not be reached", which look identical otherwise.
    throw Object.assign(new Error(message), { status: resp.status });
  }
  return data as T;
}

export type Candidate = {
  id: string;
  candId?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  source?: string | null;
  exp?: string | null;
  stage: string; // applied | screening | training | test | recommended | hired | rejected
  score?: number | null;
  repId?: string | null;
  // Journey state the server keeps for this candidate, whichever device they
  // are on: videos ticked off, whether the one attempt has been used, and the
  // sitting in progress.
  watched?: string[];
  testConsumed?: boolean;
  testUnlockedOn?: string | null;
  passPct?: number;
  // Set on hire: the permanent Rep ID and the one-time Sales App password.
  tempPassword?: string;
  onboarding?: {
    confidentiality?: boolean;
    bank?: { holder: string; acc: string; bankName: string; ifsc: string };
    photo?: { key: string; at: string };
    aadhaarImg?: { key: string; at: string };
    panImg?: { key: string; at: string };
  };
};

export type TrainingModule = {
  id: string;
  title: string;
  summary?: string | null;
  videoUrl?: string | null;
  videoDuration?: string | null;
  checklist: string[];
  mandatory?: boolean;
  sortOrder?: number;
};

export type TestConfig = { count: number; passPct: number; durationMin: number; randomize: boolean };
// The paper the candidate sits — questions WITHOUT the answer key (the office
// keeps that; the server marks the paper).
export type TestPaper = {
  config: TestConfig;
  questions: { id: string; type: string; prompt: string; options: string[] }[];
};
export type TestResult = { score: number; correct: number; total: number; passPct: number; passed: boolean };

// One sitting of the assessment, held on the server so it survives a restart
// and follows the candidate to whichever phone they sign in on. `secondsLeft`
// is worked out by the server from when the sitting actually began — the clock
// cannot be reset by opening the other device.
export type TestRun = {
  qIds: string[];
  answers: Record<string, number>;
  index: number;
  startedAt: string;
  durationMin: number;
  submittedAt?: string;
  endsAt: string;
  secondsLeft: number;
  expired: boolean;
  running: boolean; // false while the candidate is away from the test screen
};

// Training videos the office uploaded (not linked externally) come back as a
// server-relative path like "/media/training-video/xxx.mp4" — the web candidate
// screen prefixes these with the API origin before use, but the mobile Training
// screen was passing the bare path straight to Linking.openURL(), which needs a
// full URI and silently does nothing for a relative one. That's why an uploaded
// video never opened for a candidate on the app, only on the web.
export function resolveMediaUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : BASE_URL + url;
}

export const api = {
  baseUrl: BASE_URL,

  // Candidate sign-in / register uses mobile number + OTP (test mode returns the
  // code so it can be shown on screen).
  //
  // These are the *candidate* routes, not the customer ones: a customer sign-up
  // demands a GSTIN, which an applicant for a sales job does not have.
  requestOtp: (phone: string, mode: 'login' | 'signup' = 'signup') =>
    request<{ sent: boolean; devCode?: string; registered?: boolean }>('/auth/candidate/otp/request', {
      method: 'POST',
      body: JSON.stringify({ phone, mode }),
    }),

  verifyOtp: (phone: string, otp: string, name?: string, email?: string, password?: string) =>
    request<{ accessToken: string; user: any }>('/auth/candidate/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, otp, name, email, password, remember: true }),
    }),

  // Coming back after sign-up: email + password, no SMS round-trip.
  login: (email: string, password: string, remember = true) =>
    request<{ accessToken: string; user: any }>('/auth/candidate/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, remember }),
    }),

  me: () =>
    request<{
      id: string;
      role: string;
      name: string;
      phone?: string;
      email?: string;
      candId?: string;
      hasPassword?: boolean;
    }>('/auth/me'),

  // Set or change the password used for email login. `currentPassword` is only
  // needed by candidates who already have one.
  changePassword: (newPassword: string, currentPassword?: string) =>
    request<{ changed: boolean }>('/auth/candidate/password', {
      method: 'POST',
      body: JSON.stringify({ newPassword, currentPassword }),
    }),

  // The candidate's own pipeline record — stage, city, score…
  myCandidate: () => request<Candidate>('/candidates/me'),

  // Submit the Apply Now form against their own record.
  apply: (body: { city: string; state: string; exp: string; source: string }) =>
    request<Candidate>('/candidates/me/apply', { method: 'POST', body: JSON.stringify(body) }),

  // Attach a CV.
  //
  // Uploaded with expo-file-system rather than fetch + FormData: React Native's
  // FormData takes a {uri,name,type} stand-in for the file, and on Android it
  // frequently posts the multipart body with the file part empty — the server
  // then answers "No file was uploaded" even though the picker worked. The
  // native uploader streams the file off disk itself, so the part is always
  // populated (and a 100MB CV never has to sit in JS memory).
  uploadResume: async (file: { uri: string; name: string; mimeType: string }): Promise<Candidate> => {
    const token = await loadToken();
    const res = await FileSystem.uploadAsync(BASE_URL + '/candidates/me/resume', file.uri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'file',
      mimeType: file.mimeType,
      // Without this the part is named from the temp cache file, losing the
      // real filename (and its extension, which the server validates on).
      parameters: { filename: file.name },
      headers: {
        accept: 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    });

    let data: any = null;
    try { data = res.body ? JSON.parse(res.body) : null; } catch { data = res.body; }
    if (res.status < 200 || res.status >= 300) {
      const message = (data && data.error) || `Upload failed (${res.status})`;
      throw Object.assign(new Error(message), { status: res.status });
    }
    return data as Candidate;
  },

  // Training modules the candidate must watch before the test.
  modules: () => request<TrainingModule[]>('/modules'),

  // The live assessment. The paper is drawn from the office's question bank
  // (count / pass mark / time limit all set by the office) and comes down
  // WITHOUT the answers — the server marks it. This replaces the old hard-coded
  // 5-question quiz that scored itself in the app.
  // Pass the ids of a sitting already in progress to get that exact paper back,
  // in that exact order — otherwise a randomised bank would serve the other
  // device a different set of questions.
  testPaper: (qIds?: string[]) =>
    request<TestPaper>('/questions/paper' + (qIds?.length ? `?ids=${encodeURIComponent(qIds.join(','))}` : '')),

  // Server-side marking: send { questionId: chosenOptionIndex }, get the score.
  scoreTest: (answers: Record<string, number>) =>
    request<TestResult>('/questions/score', { method: 'POST', body: JSON.stringify({ answers }) }),

  // Tick a training video off on the server. Progress used to live in memory
  // only, so it vanished on restart and never followed the candidate to a
  // second phone — which the test gate read as "training unfinished".
  markWatched: (videoId: string) =>
    request<Candidate>('/candidates/me/watched', {
      method: 'POST',
      body: JSON.stringify({ videoId }),
    }),

  // The sitting in progress, if any — the same paper, answers and clock on
  // every device the candidate signs in on.
  testRun: () => request<{ run: TestRun | null }>('/candidates/me/test-run'),

  // Begin the sitting, or join the one already open. The server decides: a
  // second device never gets a fresh clock.
  startTestRun: (qIds: string[], durationMin: number) =>
    request<{ run: TestRun; resumed: boolean }>('/candidates/me/test-run', {
      method: 'POST',
      body: JSON.stringify({ qIds, durationMin }),
    }),

  // Save answers as they are chosen (fire-and-forget from the screen).
  saveTestRun: (answers: Record<string, number>, index: number) =>
    request<{ run: TestRun }>('/candidates/me/test-run', {
      method: 'PATCH',
      body: JSON.stringify({ answers, index }),
    }),

  // The countdown holds while the candidate is off the test screen. Both sides
  // are recorded on the server, so the pause survives a restart and cannot be
  // faked by the app.
  pauseTestRun: () => request<{ run: TestRun }>('/candidates/me/test-run/pause', { method: 'POST' }),
  resumeTestRun: () => request<{ run: TestRun }>('/candidates/me/test-run/resume', { method: 'POST' }),

  // End the sitting and have the server mark it. Answers sent here only count
  // while the clock is still running — once the deadline passes the server
  // marks what was saved during the test, so backgrounding the app cannot buy
  // extra time.
  submitTestRun: (answers?: Record<string, number>) =>
    request<{
      score: number;
      correct?: number;
      total?: number;
      passPct: number;
      passed: boolean;
      expired: boolean;
      alreadySubmitted?: boolean;
    }>('/candidates/me/test-run/submit', {
      method: 'POST',
      body: JSON.stringify({ answers: answers || {} }),
    }),

  // Write the marked result onto the candidate's own pipeline row so the office
  // actually sees it (passing moves them into the approval queue).
  submitTestResult: (score: number, passed: boolean) =>
    request<Candidate>('/candidates/me/test-result', {
      method: 'POST',
      body: JSON.stringify({ score, passed }),
    }),

  // Onboarding, once hired: sign the confidentiality undertaking and file the
  // bank details commission is paid into.
  saveOnboarding: (patch: { confidentiality?: true; bank?: { holder: string; acc: string; bankName: string; ifsc: string } }) =>
    request<Candidate>('/candidates/me/onboarding', { method: 'POST', body: JSON.stringify(patch) }),

  // The KYC images. Uses the same upload path as the CV, because React Native's
  // FormData posts an empty file part on Android.
  uploadOnboardingDoc: async (kind: 'photo' | 'aadhaar' | 'pan', file: { uri: string; name: string; mimeType: string }) => {
    const res = await FileSystem.uploadAsync(`${BASE_URL}/candidates/me/onboarding-doc?kind=${kind}`, file.uri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'file',
      mimeType: file.mimeType,
      parameters: { filename: file.name },
      headers: { authorization: `Bearer ${await loadToken()}` },
    });
    let data: any = null;
    try { data = JSON.parse(res.body); } catch {}
    if (res.status < 200 || res.status >= 300) {
      const message = (data && data.error) || `Upload failed (${res.status})`;
      throw Object.assign(new Error(message), { status: res.status });
    }
    return data as Candidate;
  },

  // Candidate-facing alerts the office pushed (screening scheduled, training/test
  // unlocked, hired…), keyed by candId. Public read; filter to your own candId.
  candNotifs: () => request<Record<string, { id: string; icon?: string; text: string; time?: string }[]>>('/admin/lms/notifs'),

  // Mira — the in-app assistant. Same brain as the web chat bubble.
  chat: (sessionId: string, message: string, who?: string) =>
    request<{ reply: string }>('/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ sessionId, message, app: 'lms', who }),
    }),
};
