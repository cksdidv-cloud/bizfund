
import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- 1. Types ---
export enum Region {
  SEOUL = '서울', BUSAN = '부산', DAEGU = '대구', INCHEON = '인천',
  GWANGJU = '광주', DAEJEON = '대전', ULSAN = '울산', SEJONG = '세종',
  GYEONGGI = '경기', GANGWON = '강원', CHUNGBUK = '충북', CHUNGNAM = '충남',
  JEONBUK = '전북', JEONNAM = '전남', GYEONGBUK = '경북', GYEONGNAM = '경남', JEJU = '제주'
}

export interface Fund {
  agency: string;
  category: string;
  title: string;
  url: string;
  summary: string;
  eligibility: string;
}

export interface SearchResult {
  funds: Fund[];
  groundingChunks: any[];
}

export interface BusinessInfo {
  bizNumber: string;
  region: Region | '';
  industry: string;
  bizType: string;
}

// --- 2. Gemini Service ---
const NATIONAL_URLS = [
  "https://www.sbiz24.kr/", "https://www.kosmes.or.kr/",
  "https://www.kodit.co.kr/", "https://www.kibo.or.kr/",
];

const REGIONAL_TARGET_URLS: Record<string, string> = {
  '서울': 'https://www.seoulshinbo.co.kr/', '부산': 'https://www.busansinbo.or.kr/',
  '경기': 'https://www.gcgf.or.kr/', '인천': 'https://www.icsinbo.or.kr/'
};

const matchPolicyFunds = async (info: BusinessInfo): Promise<SearchResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key가 설정되지 않았습니다.");

  const ai = new GoogleGenAI({ apiKey });
  const { region, industry, bizNumber } = info;
  const targetUrlString = [...NATIONAL_URLS, REGIONAL_TARGET_URLS[region] || ''].filter(Boolean).join(', ');

  const systemInstruction = `
    You are an expert policy fund consultant. Find 3 active funds for a business in ${region}, Industry: ${industry}.
    Sources: ${targetUrlString}.
    Output: Return ONLY a JSON array. Fields: "agency", "category", "title", "url", "summary" (max 30 chars), "eligibility" (max 30 chars).
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Find 3 active funds for ${bizNumber} in ${region}.`,
    config: { systemInstruction, temperature: 0.2 },
  });

  let funds = [];
  try {
    const text = response.text.replace(/```json|```/g, "").trim();
    funds = JSON.parse(text);
  } catch (e) {
    console.error("Parse Error", e);
    funds = [{ agency: "AI 분석", category: "정보", title: "검색 결과를 확인해주세요", url: "", summary: "분석 중 오류", eligibility: "직접 확인 필요" }];
  }

  return { funds, groundingChunks: [] };
};

// --- 3. Header Component ---
const Header = () => {
  const handleApiKeySetting = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      alert("API Key가 설정되었습니다.");
    } else {
      alert("이 환경에서는 API Key 설정을 지원하지 않습니다.");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50 flex items-center justify-between px-4 md:px-8">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">AI</div>
        <span className="font-bold text-xl text-slate-800">정책자금 <span className="text-blue-600">AI</span></span>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={handleApiKeySetting} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg text-sm">🔑 Key 설정</button>
        <button className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-full">기업진단</button>
      </div>
    </header>
  );
};

// --- 4. ResultsView Component ---
const ResultsView = ({ data, onApplyClick }: { data: SearchResult, onApplyClick: () => void }) => (
  <div className="max-w-4xl mx-auto w-full animate-fadeIn py-8">
    <div className="grid gap-6">
      {data.funds.map((fund, i) => (
        <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-3">
            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded">{fund.agency}</span>
            <span className="text-xs text-green-600 font-bold">접수중</span>
          </div>
          <h3 className="text-xl font-bold mb-2">{fund.title}</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="text-slate-500 font-bold mb-1">지원혜택</p>
              <p>{fund.summary}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="text-slate-500 font-bold mb-1">자격요건</p>
              <p>{fund.eligibility}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {fund.url && <a href={fund.url} target="_blank" className="flex-1 text-center py-2 border border-slate-200 rounded-lg text-sm font-medium">공고확인</a>}
            <button onClick={onApplyClick} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold">상담신청</button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// --- 5. Main App Component ---
const App = () => {
  const [bizInfo, setBizInfo] = useState<BusinessInfo>({ bizNumber: '', region: '', industry: '', bizType: '개인' });
  const [status, setStatus] = useState<{ loading: boolean, error: string | null, data: SearchResult | null }>({ loading: false, error: null, data: null });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSearch = async () => {
    if (!bizInfo.bizNumber || !bizInfo.region || !bizInfo.industry) return alert("정보를 모두 입력해주세요.");
    setStatus({ loading: true, error: null, data: null });
    try {
      const res = await matchPolicyFunds(bizInfo);
      setStatus({ loading: false, error: null, data: res });
    } catch (e: any) {
      setStatus({ loading: false, error: e.message, data: null });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Header />
      <main className="pt-24 px-4 max-w-4xl mx-auto text-center">
        {!status.data && !status.loading && (
          <div className="mb-12 space-y-4">
            <h1 className="text-4xl font-extrabold">놓치고 있는 <span className="text-blue-600">정책자금</span>,<br/>AI가 찾아드립니다</h1>
            <p className="text-slate-500">사업자번호와 지역만으로 10초 만에 분석 완료</p>
          </div>
        )}

        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-100 text-left mb-8">
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-1">사업자번호</label>
              <input type="text" placeholder="000-00-00000" className="w-full p-3 bg-slate-50 border rounded-xl" value={bizInfo.bizNumber} onChange={e => setBizInfo({...bizInfo, bizNumber: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-1">지역</label>
              <select className="w-full p-3 bg-slate-50 border rounded-xl" value={bizInfo.region} onChange={e => setBizInfo({...bizInfo, region: e.target.value as any})}>
                <option value="">선택</option>
                {Object.values(Region).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-6">
            <label className="text-sm font-bold text-slate-700 block mb-1">업종</label>
            <input type="text" placeholder="예: 카페, 제조업" className="w-full p-3 bg-slate-50 border rounded-xl" value={bizInfo.industry} onChange={e => setBizInfo({...bizInfo, industry: e.target.value})} />
          </div>
          <button onClick={handleSearch} disabled={status.loading} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl text-lg shadow-lg shadow-blue-200">
            {status.loading ? "AI 분석 중..." : "맞춤 자금 확인하기"}
          </button>
        </div>

        {status.loading && <div className="py-20 text-blue-600 font-bold animate-pulse">실시간 공고 데이터를 정밀 분석 중입니다...</div>}
        {status.error && <div className="p-4 bg-red-50 text-red-600 rounded-xl">{status.error}</div>}
        {status.data && <ResultsView data={status.data} onApplyClick={() => setIsModalOpen(true)} />}
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">상담 신청</h3>
            <p className="text-slate-500 mb-6">전문 컨설턴트가 24시간 내에 연락드립니다.</p>
            <button onClick={() => { alert("신청되었습니다."); setIsModalOpen(false); }} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl">확인</button>
          </div>
        </div>
      )}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
