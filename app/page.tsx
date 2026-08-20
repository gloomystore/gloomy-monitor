'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

interface UrlItem {
  id: number;
  program_id: number;
  url: string;
  last_status: number | null;
  last_checked_at: string | null;
  last_error: string | null;
}

interface Program {
  id: number;
  name: string;
  is_down: number;
  updated_at: string;
  urls: UrlItem[];
}

interface Recipient {
  id: number;
  email: string;
}

export default function Home() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [intervalSeconds, setIntervalSeconds] = useState(60);
  const [mailStatus, setMailStatus] = useState<{
    ok: number | null;
    error: string | null;
    at: string | null;
  }>({ ok: null, error: null, at: null });

  const [newName, setNewName] = useState('');
  const [newUrls, setNewUrls] = useState(['']);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [newEmail, setNewEmail] = useState('');
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(1);
  const [seconds, setSeconds] = useState(0);
  const [checking, setChecking] = useState(false);

  const [downThresholdSeconds, setDownThresholdSeconds] = useState(0);
  const [dtDays, setDtDays] = useState(0);
  const [dtHours, setDtHours] = useState(0);
  const [dtMinutes, setDtMinutes] = useState(0);
  const [dtSeconds, setDtSeconds] = useState(0);

  const loadPrograms = useCallback(async () => {
    const res = await fetch('/api/programs', { cache: 'no-store' });
    setPrograms(await res.json());
  }, []);

  const loadRecipients = useCallback(async () => {
    const res = await fetch('/api/recipients', { cache: 'no-store' });
    setRecipients(await res.json());
  }, []);

  const loadSettings = useCallback(async () => {
    const res = await fetch('/api/settings', { cache: 'no-store' });
    const data = await res.json();
    const total: number = data.interval_seconds ?? 60;
    setIntervalSeconds(total);
    setDays(Math.floor(total / 86400));
    setHours(Math.floor((total % 86400) / 3600));
    setMinutes(Math.floor((total % 3600) / 60));
    setSeconds(total % 60);
    setMailStatus({ ok: data.last_mail_ok, error: data.last_mail_error, at: data.last_mail_at });

    const dtTotal: number = data.down_threshold_seconds ?? 0;
    setDownThresholdSeconds(dtTotal);
    setDtDays(Math.floor(dtTotal / 86400));
    setDtHours(Math.floor((dtTotal % 86400) / 3600));
    setDtMinutes(Math.floor((dtTotal % 3600) / 60));
    setDtSeconds(dtTotal % 60);
  }, []);

  useEffect(() => {
    loadPrograms();
    loadRecipients();
    loadSettings();
    const timer = setInterval(loadPrograms, 5000);
    return () => clearInterval(timer);
  }, [loadPrograms, loadRecipients, loadSettings]);

  function resetForm() {
    setNewName('');
    setNewUrls(['']);
    setEditingId(null);
  }

  function startEdit(p: Program) {
    setEditingId(p.id);
    setNewName(p.name);
    setNewUrls(p.urls.map((u) => u.url).length ? p.urls.map((u) => u.url) : ['']);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function submitProgram(e: React.FormEvent) {
    e.preventDefault();
    const urls = newUrls.map((u) => u.trim()).filter(Boolean);
    if (!newName.trim() || urls.length === 0) return;

    const payload = { name: newName.trim(), urls };
    if (editingId) {
      await fetch(`/api/programs/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch('/api/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    resetForm();
    loadPrograms();
  }

  async function deleteProgram(id: number) {
    if (!confirm('삭제할까요?')) return;
    await fetch(`/api/programs/${id}`, { method: 'DELETE' });
    loadPrograms();
  }

  async function addRecipient(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim()) return;
    await fetch('/api/recipients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail.trim() }),
    });
    setNewEmail('');
    loadRecipients();
  }

  async function removeRecipient(id: number) {
    await fetch(`/api/recipients?id=${id}`, { method: 'DELETE' });
    loadRecipients();
  }

  async function saveInterval() {
    const total = days * 86400 + hours * 3600 + minutes * 60 + seconds;
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interval_seconds: total }),
    });
    setIntervalSeconds(total);
  }

  async function saveDownThreshold() {
    const total = dtDays * 86400 + dtHours * 3600 + dtMinutes * 60 + dtSeconds;
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ down_threshold_seconds: total }),
    });
    setDownThresholdSeconds(total);
  }

  async function runCheckNow() {
    setChecking(true);
    try {
      await fetch('/api/check', { method: 'POST' });
      await Promise.all([loadPrograms(), loadSettings()]);
    } finally {
      setChecking(false);
    }
  }

  async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  return (
    <main>
      <div className="header-row">
        <div>
          <h1>gloomymonitor</h1>
          <p className="sub" style={{ marginBottom: 0 }}>
            등록한 프로그램의 URL을 주기적으로 확인하고, 200이 아닌 상태가 나타나면 메일로 알려줍니다.
          </p>
        </div>
        <div className="row" style={{ marginBottom: 0 }}>
          <Link href="/stats">
            <button type="button">통계</button>
          </Link>
          <button onClick={logout}>로그아웃</button>
        </div>
      </div>

      <section>
        <h2>{editingId ? '프로그램 수정' : '프로그램 등록'}</h2>
        <form onSubmit={submitProgram}>
          <div className="field">
            <label>프로그램 이름</label>
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="예: gloomystore" />
          </div>
          <div className="field">
            <label>URL (하나라도 200이 아니면 비정상으로 처리)</label>
            {newUrls.map((url, idx) => (
              <div className="url-row" key={idx}>
                <input
                  type="text"
                  value={url}
                  placeholder="https://..."
                  onChange={(e) => {
                    const next = [...newUrls];
                    next[idx] = e.target.value;
                    setNewUrls(next);
                  }}
                />
                <button
                  type="button"
                  onClick={() => setNewUrls(newUrls.filter((_, i) => i !== idx))}
                  disabled={newUrls.length === 1}
                >
                  삭제
                </button>
              </div>
            ))}
            <button type="button" onClick={() => setNewUrls([...newUrls, ''])}>
              + URL 추가
            </button>
          </div>
          <div className="row" style={{ marginTop: 14 }}>
            <button className="primary" type="submit">
              {editingId ? '수정 저장' : '등록'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm}>
                취소
              </button>
            )}
          </div>
        </form>
      </section>

      <section>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ marginBottom: 0 }}>모니터링 목록 ({programs.length})</h2>
          <button onClick={runCheckNow} disabled={checking}>
            {checking ? '체크 중...' : '지금 체크'}
          </button>
        </div>
        {programs.length === 0 && <p className="empty">등록된 프로그램이 없습니다.</p>}
        {programs.map((p) => (
          <div className="program" key={p.id}>
            <div className="program-head">
              <div className="row" style={{ marginBottom: 0 }}>
                <span className="program-name">{p.name}</span>
                <span className={`badge ${p.is_down ? 'fail' : 'ok'}`}>
                  {p.is_down ? '비정상' : '정상'}
                </span>
              </div>
              <div className="actions">
                <button onClick={() => startEdit(p)}>수정</button>
                <button className="danger" onClick={() => deleteProgram(p.id)}>
                  삭제
                </button>
              </div>
            </div>
            {p.urls.map((u) => (
              <div className="url-item" key={u.id}>
                <span>{u.url}</span>
                <span className={`status ${u.last_status === 200 ? 'ok' : 'fail'}`}>
                  {u.last_status ?? (u.last_checked_at ? 'ERROR' : '미확인')}
                </span>
              </div>
            ))}
          </div>
        ))}
      </section>

      <section>
        <h2>메일 수신자</h2>
        {mailStatus.at && (
          <p className="sub" style={{ marginBottom: 12 }}>
            마지막 발송:{' '}
            <span className={`badge ${mailStatus.ok ? 'ok' : 'fail'}`}>
              {mailStatus.ok ? '성공' : '실패'}
            </span>{' '}
            ({new Date(mailStatus.at).toLocaleString('ko-KR')})
            {!mailStatus.ok && mailStatus.error && (
              <>
                {' — '}
                {mailStatus.error}
              </>
            )}
          </p>
        )}
        <form onSubmit={addRecipient} className="row">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <button className="primary" type="submit">
            추가
          </button>
        </form>
        <div style={{ marginTop: 10 }}>
          {recipients.length === 0 && <p className="empty">등록된 수신자가 없습니다.</p>}
          {recipients.map((r) => (
            <span className="chip" key={r.id}>
              {r.email}
              <button onClick={() => removeRecipient(r.id)}>×</button>
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2>체크 주기 (현재 {intervalSeconds}초)</h2>
        <div className="interval-grid">
          <div className="field">
            <label>일</label>
            <input type="number" min={0} value={days} onChange={(e) => setDays(Number(e.target.value))} />
          </div>
          <div className="field">
            <label>시간</label>
            <input type="number" min={0} value={hours} onChange={(e) => setHours(Number(e.target.value))} />
          </div>
          <div className="field">
            <label>분</label>
            <input type="number" min={0} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} />
          </div>
          <div className="field">
            <label>초</label>
            <input type="number" min={0} value={seconds} onChange={(e) => setSeconds(Number(e.target.value))} />
          </div>
        </div>
        <button className="primary" onClick={saveInterval}>
          저장
        </button>
      </section>

      <section>
        <h2>장애 판정 기준 시간 (현재 {downThresholdSeconds === 0 ? '즉시' : `${downThresholdSeconds}초`})</h2>
        <p className="sub" style={{ marginBottom: 12 }}>
          실패 상태가 이 시간 이상 계속돼야 장애로 판정하고 메일을 보냅니다. 0으로 두면 실패가 감지되는 즉시 발송합니다(기존 동작).
        </p>
        <div className="interval-grid">
          <div className="field">
            <label>일</label>
            <input type="number" min={0} value={dtDays} onChange={(e) => setDtDays(Number(e.target.value))} />
          </div>
          <div className="field">
            <label>시간</label>
            <input type="number" min={0} value={dtHours} onChange={(e) => setDtHours(Number(e.target.value))} />
          </div>
          <div className="field">
            <label>분</label>
            <input type="number" min={0} value={dtMinutes} onChange={(e) => setDtMinutes(Number(e.target.value))} />
          </div>
          <div className="field">
            <label>초</label>
            <input type="number" min={0} value={dtSeconds} onChange={(e) => setDtSeconds(Number(e.target.value))} />
          </div>
        </div>
        <button className="primary" onClick={saveDownThreshold}>
          저장
        </button>
      </section>
    </main>
  );
}
