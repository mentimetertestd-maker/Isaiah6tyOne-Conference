import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

// 💡 방금 복사하신 구글 앱스 스크립트 웹 앱 URL을 아래 따옴표 안에 그대로 넣어주세요!
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbylGFRWdEbr_7Qcs9j72uOhgZ7HjXPUpKqAffqZJYX6IJn0jS963WfZxUMSVKQYS_k/exec';

export default function App() {
  const [mode, setMode] = useState('lookup'); // 'lookup' (참가자 조회) 또는 'admin' (현장 스태프 체크인)
  
  // 조회용 상태
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState(null);

  // 관리자 체크인용 상태
  const [scanCode, setScanCode] = useState('');
  const [adminMessage, setAdminMessage] = useState('');

  // 1. 티켓 조회하기
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

  // 2. 관리자 체크인 처리하기
  const handleCheckin = async (e) => {
    e.preventDefault();
    if (!scanCode) return;
    setLoading(true);
    setAdminMessage('');
    try {
      const res = await fetch(`${SCRIPT_URL}?action=checkin&ticket_code=${encodeURIComponent(scanCode)}`);
      const result = await res.json();
      if (result.success) {
        setAdminMessage(`✅ [${result.data.name}] 님 수령완료 처리되었습니다!`);
        setScanCode('');
      } else {
        setAdminMessage(`❌ ${result.message}`);
      }
    } catch (err) {
      setAdminMessage('❌ 통신 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1b2a] text-[#e0e1dd] flex flex-col items-center justify-center p-6">
      {/* 상단 모드 전환 버튼 */}
      <div className="absolute top-6 right-6 flex gap-2">
        <button 
          onClick={() => setMode('lookup')} 
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === 'lookup' ? 'bg-[#1b263b] text-[#778da9] border border-[#415a77]' : 'text-gray-400 hover:text-white'}`}
        >
          참가자 조회
        </button>
        <button 
          onClick={() => setMode('admin')} 
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === 'admin' ? 'bg-[#1b263b] text-[#778da9] border border-[#415a77]' : 'text-gray-400 hover:text-white'}`}
        >
          현장 스태프(체크인)
        </button>
      </div>

      <div className="max-w-md w-full bg-[#1b263b] rounded-2xl p-8 shadow-2xl border border-[#415a77]">
        <h1 className="text-3xl font-extrabold text-center mb-2 tracking-wide text-white">Soli Deo Gloria</h1>
        <p className="text-center text-[#778da9] text-sm mb-8">컨퍼런스 티켓 조회 및 현장 체크인 시스템</p>

        {/* 1. 참가자 티켓 조회 화면 */}
        {mode === 'lookup' && (
          <div>
            {!ticket ? (
              <form onSubmit={handleLookup} className="space-y-5">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#778da9] mb-1.5 font-semibold">이름</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#0d1b2a] border border-[#415a77] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#778da9]"
                    placeholder="성함을 입력하세요"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#778da9] mb-1.5 font-semibold">연락처 (전체 또는 뒷자리)</label>
                  <input 
                    type="text" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#0d1b2a] border border-[#415a77] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#778da9]"
                    placeholder="예: 01012345678 또는 5678"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-[#415a77] hover:bg-[#778da9] text-white font-bold py-3.5 rounded-xl transition-all shadow-lg"
                >
                  {loading ? '조회 중...' : '내 티켓 및 QR 확인하기'}
                </button>
              </form>
            ) : (
              <div className="text-center space-y-6">
                <div className="bg-[#0d1b2a] p-6 rounded-xl border border-[#415a77]">
                  <h2 className="text-xl font-bold text-white mb-1">{ticket.name} 님 환영합니다!</h2>
                  <p className="text-xs text-[#778da9] mb-4">티켓 코드: <span className="text-white font-mono">{ticket.ticket_code}</span></p>
                  
                  {/* 고유 QR 코드 출력 */}
                  <div className="bg-white p-4 rounded-xl inline-block shadow-inner mb-4">
                    <QRCodeCanvas value={ticket.ticket_code} size={180} />
                  </div>

                  <div className="text-sm space-y-1 mt-2">
                    <p className="text-gray-300">상태: <span className={`font-bold ${ticket.status === '수령완료' ? 'text-emerald-400' : 'text-amber-400'}`}>{ticket.status}</span></p>
                    {ticket.checked_at && <p className="text-xs text-gray-400">수령 시간: {ticket.checked_at}</p>}
                  </div>
                </div>

                <button 
                  onClick={() => setTicket(null)}
                  className="w-full bg-[#415a77] hover:bg-[#778da9] text-white font-semibold py-3 rounded-xl transition-all"
                >
                  다른 이름으로 조회하기
                </button>
              </div>
            )}
          </div>
        )}

        {/* 2. 현장 스태프 체크인 화면 */}
        {mode === 'admin' && (
          <div className="space-y-6">
            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-xs text-amber-300 text-center">
              스태프 전용: 참가자의 티켓 코드를 입력하거나 스캔하여 수령 처리를 진행합니다.
            </div>
            
            <form onSubmit={handleCheckin} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#778da9] mb-1.5 font-semibold">티켓 코드 입력</label>
                <input 
                  type="text" 
                  value={scanCode} 
                  onChange={(e) => setScanCode(e.target.value)}
                  className="w-full bg-[#0d1b2a] border border-[#415a77] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#778da9]"
                  placeholder="예: SDG-001"
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg"
              >
                {loading ? '처리 중...' : '체크인 완료 처리'}
              </button>
            </form>

            {adminMessage && (
              <div className="p-4 rounded-xl bg-[#0d1b2a] border border-[#415a77] text-center text-sm font-semibold">
                {adminMessage}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
