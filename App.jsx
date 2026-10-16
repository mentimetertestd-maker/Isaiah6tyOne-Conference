import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { QRCodeCanvas } from 'qrcode.react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { 
  Menu, Bus, TrainFront, Heart, Info, ChevronRight, 
  MapPin, X, QrCode, Sparkles, Camera, CheckCircle2, AlertCircle, Search 
} from 'lucide-react';

const SUPABASE_URL = 'https://ixsdjtnwreukyykxhjbb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4c2RqdG53cmV1a3l5a3hoamJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxMzM4NDEsImV4cCI6MjEwNzcwOTg0MX0.Jn2dWyTxlLDRlM5Jeb74e4Qz5n3d-wFbcBzkJcHMJG4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function SoliDeoGloriaApp() {
  const [viewMode, setViewMode] = useState('guide'); 
  const [selectedItem, setSelectedItem] = useState(null);
  
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [myTicket, setMyTicket] = useState(null);
  const [loading, setLoading] = useState(false);

  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ticketId = params.get('ticket');
    if (ticketId) fetchTicketById(ticketId);
  }, []);

  const fetchTicketById = async (id) => {
    setLoading(true);
    setShowTicketModal(true);
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('id', id)
      .single();
    if (!error && data) setMyTicket(data);
    setLoading(false);
  };

  const handleSearchTicket = async (e) => {
    e.preventDefault();
    if (!searchName || !searchPhone) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('name', searchName.trim())
      .ilike('phone', `%${searchPhone.trim()}`)
      .limit(1)
      .single();

    if (error || !data) {
      alert('일치하는 참가자 정보를 찾을 수 없습니다. 이름과 연락처를 확인해 주세요.');
    } else {
      setMyTicket(data);
    }
    setLoading(false);
  };

  const handleScan = async (detectedCodes) => {
    if (!detectedCodes || detectedCodes.length === 0 || loading) return;
    const rawValue = detectedCodes[0].rawValue;
    if (!rawValue) return;

    let participantId = rawValue;
    if (rawValue.includes('ticket=')) {
      participantId = new URL(rawValue).searchParams.get('ticket');
    }

    setLoading(true);
    const { data: user, error } = await supabase
      .from('participants')
      .select('*')
      .eq('id', participantId)
      .single();

    if (error || !user) {
      setScanResult({ status: 'error', message: '유효하지 않은 QR 코드입니다.' });
      setLoading(false);
      return;
    }

    if (user.is_checked_in) {
      setScanResult({ 
        status: 'already', 
        user, 
        message: `이미 수령 완료된 참가자입니다! (${new Date(user.checked_in_at).toLocaleTimeString('ko-KR')})` 
      });
      setLoading(false);
      return;
    }

    const now = new Date().toISOString();
    await supabase
      .from('participants')
      .update({ is_checked_in: true, checked_in_at: now })
      .eq('id', participantId);

    setScanResult({ status: 'success', user, message: '수령 처리가 완료되었습니다!' });
    setLoading(false);
  };

  const menuSections = [
    {
      title: '교통 & 주차', subTitle: 'GETTING HERE', badge: '필독 안내',
      items: [
        { id: 'shuttle', label: '셔틀버스 & 주차 안내', content: '킨텍스 제2전시장 지하주차장 이용 가능합니다.' },
        { id: 'transit', label: '대중교통 오시는 길 (GTX-A 킨텍스역)', content: 'GTX-A 킨텍스역 하차 후 도보 이동 동선입니다.' },
      ]
    },
    {
      title: '메인', subTitle: 'MAIN',
      items: [
        { id: 'about', label: 'Soli Deo Gloria 컨퍼런스 소개', content: '오직 하나님께 영광 (Soli Deo Gloria)\n아이자야씩스티원 컨퍼런스입니다.' },
        { id: 'timetable', label: '타임테이블 (01.26 - 01.28)', content: '일차별 워십 및 세션 상세 일정표입니다.' },
      ]
    }
  ];

  if (viewMode === 'scanner') {
    return (
      <div className="min-h-screen bg-[#14100d] text-[#f5efe6] p-4 flex flex-col items-center">
        <div className="w-full max-w-md flex items-center justify-between py-3 border-b border-[#3a2e25] mb-6">
          <div>
            <span className="text-[#c5a059] text-xs font-bold block">STAFF ONLY</span>
            <h1 className="text-lg font-extrabold">현장 QR 수령 확인 스캐너</h1>
          </div>
          <button onClick={() => setViewMode('guide')} className="text-xs bg-[#2a211b] px-3 py-2 rounded-lg border border-[#c5a059]/40">
            가이드로 돌아가기
          </button>
        </div>
        <div className="w-full max-w-sm aspect-square rounded-2xl overflow-hidden border-2 border-[#c5a059] shadow-lg bg-black relative">
          <Scanner onScan={handleScan} allowMultiple={false} scanDelay={1500} />
        </div>
        {scanResult && (
          <div className={`w-full max-w-sm mt-6 p-5 rounded-2xl border ${
            scanResult.status === 'success' ? 'bg-emerald-950/90 border-emerald-500 text-emerald-100' :
            scanResult.status === 'already' ? 'bg-amber-950/90 border-amber-500 text-amber-100' :
            'bg-red-950/90 border-red-500 text-red-100'
          }`}>
            <div className="flex items-center gap-3 mb-2">
              {scanResult.status === 'success' ? <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" /> : <AlertCircle className="w-7 h-7 text-amber-400 shrink-0" />}
              <h2 className="text-lg font-extrabold">{scanResult.message}</h2>
            </div>
            {scanResult.user && (
              <div className="mt-3 pt-3 border-t border-white/10 text-sm space-y-1">
                <p><strong>이름:</strong> {scanResult.user.name}</p>
                <p><strong>연락처:</strong> {scanResult.user.phone}</p>
              </div>
            )}
            <button onClick={() => setScanResult(null)} className="w-full mt-4 py-3 bg-white text-black font-extrabold rounded-xl text-sm">
              다음 사람 스캔하기
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4efe6] text-[#1e1813] pb-20 font-sans">
      <header className="bg-[#18120e] text-[#f4efe6] sticky top-0 z-40 border-b border-[#3a2d22]">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-serif italic font-bold text-lg text-[#dfbe7f]">Soli Deo Gloria</span>
          <button onClick={() => setViewMode('scanner')} className="p-2 text-[#dfbe7f] hover:bg-white/10 rounded-lg flex items-center gap-1 text-xs">
            <Camera className="w-4 h-4" /> 스태프 스캔
          </button>
        </div>
      </header>

      <div className="bg-gradient-to-b from-[#231912] via-[#38271b] to-[#1e150f] text-white py-10 px-4 text-center border-b border-[#c5a059]/30">
        <div className="max-w-xl mx-auto">
          <span className="text-xs tracking-widest text-[#d4b475] font-semibold">2027. 01.26 – 01.28</span>
          <h1 className="font-serif text-3xl sm:text-4xl mt-1 text-[#f7f2e7]">Soli Deo GLORIA</h1>
          <p className="text-xs text-[#d4b475] mt-1 tracking-widest">: 오직 하나님께 영광</p>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 pt-5 space-y-3.5">
        <div className="space-y-2.5">
          <button onClick={() => setShowTicketModal(true)} className="w-full bg-[#261b13] hover:bg-[#36271c] transition text-[#f7f2e7] border border-[#c5a059]/50 text-center py-4 rounded-xl shadow-sm">
            <div className="font-bold text-sm flex items-center justify-center gap-2 text-[#dfbe7f]">
              <QrCode className="w-4 h-4" /> 내 모바일 QR 티켓 확인하기
            </div>
            <div className="text-[11px] text-[#cbb89d] mt-0.5">이름과 연락처로 현장 수령용 QR 코드를 확인하세요</div>
          </button>
        </div>

        <div className="space-y-6 pt-2">
          {menuSections.map((section, idx) => (
            <section key={idx} className="space-y-2">
              <div className="flex items-baseline gap-2 px-1">
                <h3 className="font-extrabold text-base">{section.title}</h3>
                <span className="text-[11px] font-bold text-neutral-400">{section.subTitle}</span>
              </div>
              <div className="bg-[#fbf9f5] rounded-xl border border-[#e2d9c8] divide-y divide-[#e2d9c8] overflow-hidden">
                {section.items.map((item) => (
                  <button key={item.id} onClick={() => setSelectedItem(item)} className="w-full px-4 py-4 flex items-center justify-between hover:bg-white transition text-left">
                    <span className="text-xs sm:text-sm font-bold">{item.label}</span>
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      {showTicketModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowTicketModal(false)}>
          <div className="bg-[#fbf9f5] w-full max-w-sm rounded-2xl p-6 space-y-4 border border-[#c5a059]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#e2d9c8] pb-3">
              <h4 className="font-extrabold text-base text-[#261b13]">모바일 QR 티켓</h4>
              <button onClick={() => setShowTicketModal(false)}><X className="w-5 h-5 text-neutral-500" /></button>
            </div>

            {!myTicket ? (
              <form onSubmit={handleSearchTicket} className="space-y-3 pt-2">
                <p className="text-xs text-neutral-600">이름과 연락처 뒷자리 4자리를 입력해주세요.</p>
                <div>
                  <label className="text-xs font-bold block mb-1">이름</label>
                  <input type="text" required placeholder="홍길동" value={searchName} onChange={(e) => setSearchName(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-[#d8ccb8] text-sm bg-white" />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">연락처 뒷자리 (4자리)</label>
                  <input type="text" required placeholder="5678" value={searchPhone} onChange={(e) => setSearchPhone(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-[#d8ccb8] text-sm bg-white" />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-[#261b13] text-[#dfbe7f] font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-1.5 mt-2">
                  <Search className="w-4 h-4" /> {loading ? '조회 중...' : '내 QR 코드 불러오기'}
                </button>
              </form>
            ) : (
              <div className="flex flex-col items-center text-center space-y-4 py-2">
                <div className="bg-white p-4 rounded-2xl border-2 border-[#c5a059] shadow-sm">
                  <QRCodeCanvas value={`${window.location.origin}/?ticket=${myTicket.id}`} size={180} />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold mt-1.5">{myTicket.name} 님</h3>
                  <p className="text-xs text-neutral-500">{myTicket.phone}</p>
                </div>
                <div className={`w-full py-2.5 rounded-xl text-xs font-extrabold ${myTicket.is_checked_in ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  {myTicket.is_checked_in ? '✓ 현장 수령 완료' : '현장 부스에서 이 QR을 제시해 주세요'}
                </div>
                <button onClick={() => setMyTicket(null)} className="text-xs text-neutral-400 underline pt-1">다른 이름으로 다시 조회하기</button>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
          <div className="bg-[#fbf9f5] w-full max-w-lg rounded-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#e2d9c8] pb-3">
              <h4 className="font-extrabold text-base">{selectedItem.label}</h4>
              <button onClick={() => setSelectedItem(null)}><X className="w-5 h-5 text-neutral-500" /></button>
            </div>
            <div className="text-sm text-neutral-700 leading-relaxed py-2">{selectedItem.content}</div>
            <button onClick={() => setSelectedItem(null)} className="w-full bg-[#261b13] text-[#dfbe7f] font-bold text-xs py-3 rounded-xl">닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}

