import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { QRCodeCanvas } from 'qrcode.react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { 
  Menu, Bus, TrainFront, Heart, Info, ChevronRight, 
  MapPin, X, QrCode, Sparkles, Camera, CheckCircle2, AlertCircle, Search 
} from 'lucide-react';

const SUPABASE_URL = 'https://ixsdjtnwreukyykxhjbb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4c2p0bndyZXVreXlreGhqYmIiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczMDQ1NjY1OCwiZXhwIjoyMDQ2MDMyNjU4fQ.Jn2dWytxLLDRlM5b74e4Qz5n3d-WfcBzkJChMJG4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function App() {
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
      .ilike('name', `%${searchName.trim()}%`)
      .eq('phone', searchPhone.trim())
      .single();

    if (!error && data) {
      setMyTicket(data);
      setShowTicketModal(true);
    } else {
      alert('일치하는 티켓 정보를 찾을 수 없습니다.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 flex flex-col items-center justify-center">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-700">
        <h1 className="text-2xl font-bold text-center mb-4 text-emerald-400">Soli Deo Gloria</h1>
        <p className="text-center text-slate-300 mb-6">컨퍼런스 체크인 시스템에 오신 것을 환영합니다.</p>
        
        <form onSubmit={handleSearchTicket} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">이름</label>
            <input 
              type="text" 
              value={searchName} 
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
              placeholder="성함을 입력하세요"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">연락처 뒷자리 또는 전체</label>
            <input 
              type="text" 
              value={searchPhone} 
              onChange={(e) => setSearchPhone(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
              placeholder="연락처를 입력하세요"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {loading ? '조회 중...' : '내 티켓 확인하기'}
          </button>
        </form>

        {showTicketModal && myTicket && (
          <div className="mt-6 p-4 bg-slate-900 rounded-xl border border-slate-700 text-center">
            <h2 className="text-lg font-bold text-emerald-400">{myTicket.name} 님 환영합니다!</h2>
            <p className="text-sm text-slate-400 mt-1">티켓 번호: {myTicket.id}</p>
            <div className="my-4 flex justify-center bg-white p-3 rounded-lg inline-block">
              <QRCodeCanvas value={myTicket.id} size={150} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
