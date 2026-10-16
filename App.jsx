import React, { useState, useEffect, useRef } from 'react';

// 방금 복사하신 구글 앱스 스크립트 웹 앱 URL을 따옴표 안에 넣어주세요!
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz8Oh5oSMMPpukjNo7T4cTx1Rb1s4pWerIAwmB9aBpW8s_kHcm5XiNTkOLmxU6lGj0a/exec';

export default function App() {
  const [mode, setMode] = useState('lookup'); // 'lookup' (참가자 조회) 또는 'admin' (현장 스태프 체크인)

  // 1. 조회용 상태
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState(null);

  // 2. 현장 스태프 체크인용 상태 (안전한 스캐너 입력 대기)
  const [scanInput, setScanInput] = useState('');
  const [checkinResult, setCheckinResult] = useState(null);
  const scanInputRef = useRef(null);

  // 체크인 화면일 때 스캐너 입력창에 항상 커서 유지
  useEffect(() => {
    if (mode === 'admin' && scanInputRef.current) {
      scanInputRef.current.focus();
    }
  }, [mode, checkinResult]);

  // 참가자 티켓 조회하기
  const handleLookup = async (e) => {
    e.preventDefault();
    if (!name || !phone) {
      alert('이름과 연락처를 모두 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${SCRIPT_URL}?action=search&name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}`);
      const result = await res.json();
      if (result.success) {
        setTicket(result.data);
      } else {
        alert(result.message || '일치하는 티켓을 찾을 수 없습니다.');
        setTicket(null);
      }
    } catch (err) {
      alert('서버 통신 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 현장 스캐너 입력 및 중복 체크인 방지 처리
  const handleCheckinSubmit = async (e) => {
    e.preventDefault();
    if (!scanInput.trim()) return;

    const ticketCode = scanInput.trim();
    setScanInput(''); // 입력창 초기화

    try {
      const res = await fetch(`${SCRIPT_URL}?action=checkin&ticket_code=${encodeURIComponent(ticketCode)}`);
      const result = await res.json();
      setCheckinResult(result);
    } catch (err) {
      setCheckinResult({ success: false, message: '서버 통신 중 오류가 발생했습니다.' });
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0d1b2a', color: '#e0e1dd', fontFamily: 'sans-serif', padding: '20px' }}>
      {/* 상단 네비게이션 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', maxWidth: '600px', margin: '0 auto 20px auto' }}>
        <button 
          onClick={() => { setMode('lookup'); setCheckinResult(null); }}
          style={{ padding: '10px 20px', borderRadius: '8px', background: mode === 'lookup' ? '#4ade80' : '#1b263b', color: mode === 'lookup' ? '#0d1b2a' : '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
          참가자 조회
        </button>
        <button 
          onClick={() => { setMode('admin'); setTicket(null); }}
          style={{ padding: '10px 20px', borderRadius: '8px', background: mode === 'admin' ? '#4ade80' : '#1b263b', color: mode === 'admin' ? '#0d1b2a' : '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
          현장 스태프 (체크인)
        </button>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', background: '#1b263b', padding: '30px', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)', textAlign: 'center' }}>
        <h1 style={{ color: '#fff', fontSize: '24px', marginBottom: '5px' }}>Soli Deo Gloria</h1>
        <p style={{ color: '#778da9', marginBottom: '30px' }}>컨퍼런스 티켓 조회 및 안전한 현장 체크인 시스템</p>

        {/* 1. 참가자 조회 화면 */}
        {mode === 'lookup' && (
          <div>
            {!ticket ? (
              <form onSubmit={handleLookup} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input 
                  type="text" 
                  placeholder="이름을 입력하세요" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  style={{ padding: '14px', borderRadius: '8px', border: '1px solid #415a77', background: '#0d1b2a', color: '#fff', fontSize: '16px' }}
                />
                <input 
                  type="text" 
                  placeholder="연락처 뒷자리 또는 티켓 코드" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ padding: '14px', borderRadius: '8px', border: '1px solid #415a77', background: '#0d1b2a', color: '#fff', fontSize: '16px' }}
                />
                <button 
                  type="submit" 
                  disabled={loading}
                  style={{ padding: '14px', borderRadius: '8px', background: '#4ade80', color: '#0d1b2a', border: 'none', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>
                  {loading ? '조회 중...' : '내 티켓 조회하기'}
                </button>
              </form>
            ) : (
              <div style={{ background: '#0d1b2a', padding: '25px', borderRadius: '12px', border: '1px solid #415a77' }}>
                <h3 style={{ color: '#4ade80', marginBottom: '10px' }}>{ticket.name} 님 환영합니다!</h3>
                <p style={{ fontSize: '14px', color: '#778da9' }}>티켓 코드: <b>{ticket.ticket_code}</b></p>
                <div style={{ background: '#fff', padding: '15px', display: 'inline-block', borderRadius: '8px', margin: '15px 0' }}>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(ticket.ticket_code)}`} 
                    alt="QR Code" 
                  />
                </div>
                <p style={{ fontSize: '14px', color: ticket.status === '수령완료' ? '#4ade80' : '#fbbf24' }}>
                  상태: <b>{ticket.status || '미수령'}</b>
                </p>
                <button 
                  onClick={() => setTicket(null)}
                  style={{ marginTop: '15px', padding: '10px 20px', background: '#415a77', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                  다른 이름으로 조회하기
                </button>
              </div>
            )}
          </div>
        )}

        {/* 2. 현장 스태프 체크인 화면 (스캐너 연동 + 중복 방지) */}
        {mode === 'admin' && (
          <div>
            <div style={{ background: '#0d1b2a', padding: '20px', borderRadius: '12px', border: '2px dashed #4ade80', marginBottom: '20px' }}>
              <p style={{ fontSize: '16px', marginBottom: '10px', color: '#4ade80', fontWeight: 'bold' }}>📷 QR 스캐너 대기 중</p>
              <p style={{ fontSize: '13px', color: '#778da9', marginBottom: '15px' }}>스캐너로 QR을 찍으면 자동으로 인식되어 처리됩니다.</p>
              
              <form onSubmit={handleCheckinSubmit}>
                <input 
                  ref={scanInputRef}
                  type="text"
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  placeholder="스캔 대기 중..."
                  style={{ padding: '12px', width: '80%', maxWidth: '300px', borderRadius: '8px', border: '1px solid #4ade80', background: '#1b263b', color: '#fff', fontSize: '16px', textAlign: 'center' }}
                  autoFocus
                />
              </form>
            </div>

            {/* 체크인 결과 및 중복 경고 팝업 */}
            {checkinResult && (
              <div style={{ 
                padding: '20px', 
                borderRadius: '12px', 
                background: checkinResult.success ? '#1b4332' : '#5c1d1d',
                border: `2px solid ${checkinResult.success ? '#4ade80' : '#f87171'}`
              }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', color: checkinResult.success ? '#4ade80' : '#f87171' }}>
                  {checkinResult.success ? '✅ 체크인 완료!' : (checkinResult.alreadyChecked ? '⚠️ 중복 입장 경고!' : '❌ 처리 실패')}
                </h3>
                <p style={{ fontSize: '16px', margin: '5px 0' }}>{checkinResult.message}</p>
                {checkinResult.data && (
                  <div style={{ marginTop: '10px', fontSize: '14px', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '6px', textAlign: 'left' }}>
                    <p><b>이름:</b> {checkinResult.data.name}</p>
                    <p><b>티켓 코드:</b> {checkinResult.data.ticket_code}</p>
                    {checkinResult.data.checked_at && <p><b>처리 시간:</b> {checkinResult.data.checked_at}</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
