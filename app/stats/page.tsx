'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

interface Incident {
  id: number;
  program_name: string;
  type: 'down' | 'recovered';
  detail: string | null;
  occurred_at: string;
}

export default function StatsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  const loadIncidents = useCallback(async () => {
    const res = await fetch('/api/incidents', { cache: 'no-store' });
    setIncidents(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  const downCount = incidents.filter((i) => i.type === 'down').length;
  const recoveredCount = incidents.filter((i) => i.type === 'recovered').length;

  return (
    <main>
      <div className="header-row">
        <div>
          <h1>통계</h1>
          <p className="sub" style={{ marginBottom: 0 }}>
            지금까지 감지된 장애/복구 기록입니다. 최근 500건까지 표시됩니다.
          </p>
        </div>
        <div className="row" style={{ marginBottom: 0 }}>
          <Link href="/">
            <button type="button">모니터링으로</button>
          </Link>
          <button onClick={logout}>로그아웃</button>
        </div>
      </div>

      <section>
        <h2 style={{ marginBottom: 0 }}>
          장애 {downCount}건 · 복구 {recoveredCount}건
        </h2>
      </section>

      <section>
        {loading && <p className="empty">불러오는 중...</p>}
        {!loading && incidents.length === 0 && <p className="empty">아직 기록된 장애/복구 이력이 없습니다.</p>}
        {incidents.map((i) => (
          <div className="program" key={i.id}>
            <div className="program-head">
              <div className="row" style={{ marginBottom: 0 }}>
                <span className="program-name">{i.program_name}</span>
                <span className={`badge ${i.type === 'down' ? 'fail' : 'ok'}`}>
                  {i.type === 'down' ? '장애' : '복구'}
                </span>
              </div>
              <span className="sub" style={{ marginBottom: 0 }}>
                {new Date(i.occurred_at).toLocaleString('ko-KR')}
              </span>
            </div>
            {i.detail && (
              <div className="url-item" style={{ whiteSpace: 'pre-wrap' }}>
                <span>{i.detail}</span>
              </div>
            )}
          </div>
        ))}
      </section>
    </main>
  );
}
