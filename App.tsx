import React, { useState, useRef } from 'react';
import Header from './components/Header';
import ResultsView from './components/ResultsView';
import { matchPolicyFunds } from './services/geminiService';
import { SearchState, Region, BusinessInfo, ApplicationData } from './types';

// Mock Data for Landing Page Content
const SUCCESS_CASES = [
  {
    id: 1,
    category: "제조업",
    region: "경기 화성시",
    amount: "3억원",
    type: "운전자금 확보",
    desc: "매출 감소로 자금난을 겪던 중 중진공 긴급경영안정자금 매칭 성공",
    badge: "금리 2.5% 대환"
  },
  {
    id: 2,
    category: "IT/SW",
    region: "서울 강남구",
    amount: "5,000만원",
    type: "R&D 지원금",
    desc: "초기창업패키지 매칭을 통해 시제품 제작 비용 전액 확보",
    badge: "상환 의무 없음"
  },
  {
    id: 3,
    category: "도소매/카페",
    region: "부산 부산진구",
    amount: "7,000만원",
    type: "저금리 대출",
    desc: "지역 신용보증재단 특례보증으로 고금리 대출을 저금리로 전환",
    badge: "이자 연 400만 절감"
  }
];

const REVIEWS = [
  {
    id: 1,
    author: "김OO 대표님",
    company: "(주)스마트텍",
    text: "사업자번호만 넣었는데 우리 회사가 받을 수 있는 자금이 3개나 나왔습니다. 컨설팅 비용 아꼈네요.",
    stars: 5
  },
  {
    id: 2,
    author: "이OO 사장님",
    company: "데일리커피",
    text: "복잡한 공고문 읽기 힘들었는데, AI가 딱 필요한 요점만 정리해주니 정말 편하네요.",
    stars: 5
  },
  {
    id: 3,
    author: "박OO 대표님",
    company: "성실건설",
    text: "지자체 자금은 몰라서 못 받고 있었는데 덕분에 신청해서 선정되었습니다. 감사합니다!",
    stars: 5
  }
];

const App: React.FC = () => {
  const [bizInfo, setBizInfo] = useState<BusinessInfo>({
    bizNumber: '',
    region: '',
    industry: '',
    bizType: '개인사업자'
  });
  
  const [searchState, setSearchState] = useState<SearchState>({
    isLoading: false,
    error: null,
    data: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [applicationForm, setApplicationForm] = useState({
    companyName: '',
    contactName: '',
    phoneNumber: ''
  });

  const resultsRef = useRef<HTMLDivElement>(null);

  const handleSearch = async () => {
    if (!bizInfo.bizNumber || !bizInfo.region || !bizInfo.industry) {
      alert("모든 필수 정보를 입력해주세요.");
      return;
    }

    // Basic Validation for biz number
    const bizNumClean = bizInfo.bizNumber.replace(/-/g, '');
    if (bizNumClean.length !== 10) {
      alert("사업자등록번호 10자리를 정확히 입력해주세요.");
      return;
    }

    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setSearchState({ isLoading: true, error: null, data: null });

    try {
      const result = await matchPolicyFunds(bizInfo);
      
      if (abortController.signal.aborted) return;

      setSearchState({ isLoading: false, error: null, data: result });
      
      // Smooth scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

    } catch (err: any) {
      if (abortController.signal.aborted) return;

      setSearchState({ 
        isLoading: false, 
        error: err.message || "매칭 분석 중 오류가 발생했습니다.", 
        data: null 
      });
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const handleStopSearch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setSearchState(prev => ({ ...prev, isLoading: false, error: "검색이 사용자에 의해 중단되었습니다." }));
  };

  // Auto-format business number
  const handleBizNumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length > 10) value = value.slice(0, 10);
    
    let formatted = value;
    if (value.length > 3 && value.length <= 5) {
      formatted = `${value.slice(0, 3)}-${value.slice(3)}`;
    } else if (value.length > 5) {
      formatted = `${value.slice(0, 3)}-${value.slice(3, 5)}-${value.slice(5)}`;
    }
    
    setBizInfo(prev => ({ ...prev, bizNumber: formatted }));
  };

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationForm.companyName || !applicationForm.contactName || !applicationForm.phoneNumber) {
      alert("업체명, 담당자명, 연락처를 모두 입력해주세요.");
      return;
    }

    const finalData: ApplicationData = {
      ...bizInfo,
      ...applicationForm
    };

    console.log(">>> Saving to Database: ", finalData);
    
    alert(`${applicationForm.contactName}님, 신청이 완료되었습니다!\n입력하신 연락처(${applicationForm.phoneNumber})로 전문 컨설턴트가 24시간 내에 연락드립니다.`);
    
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
      <Header />

      <main className="pt-24 px-4 md:px-8 max-w-7xl mx-auto">
        
        {/* Hero Section */}
        <div className={`transition-all duration-700 ease-out ${searchState.data ? 'py-8' : 'py-12 md:py-20'} flex flex-col items-center text-center space-y-8`}>
          
          {!searchState.data && (
            <div className="space-y-6 animate-fadeIn">
              <span className="inline-flex items-center gap-1.5 py-1.5 px-4 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-semibold tracking-wide shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                실시간 정책자금 매칭 가동 중
              </span>
              <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                사업자번호와 지역만 입력하면<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">최적의 자금</span>을 찾아드립니다
              </h1>
              <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
                "우리 회사가 받을 수 있는 돈이 이렇게 많았나요?"<br className="hidden md:inline"/>
                <span className="font-semibold text-slate-700">평균 1.5억원 매칭</span>, 놓치고 있던 정책자금을 AI가 10초 만에 분석해드립니다.
              </p>
            </div>
          )}

          {/* Form Area */}
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative z-10 text-left transform transition-transform hover:scale-[1.01] duration-300">
            <div className="bg-gradient-to-r from-slate-50 to-white px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                내 자금 한도 무료 조회
              </h3>
              <span className="text-xs font-medium px-2 py-1 bg-red-100 text-red-600 rounded">오늘 1,243명 조회완료</span>
            </div>
            
            <div className="p-6 md:p-8 space-y-6">
              
              {/* Row 1: Biz Number & Region */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 block">사업자등록번호</label>
                  <input
                    type="text"
                    value={bizInfo.bizNumber}
                    onChange={handleBizNumChange}
                    maxLength={12}
                    placeholder="000-00-00000"
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono tracking-wide text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 block">사업장 소재지</label>
                  <div className="relative">
                    <select
                      value={bizInfo.region}
                      onChange={(e) => setBizInfo(prev => ({ ...prev, region: e.target.value as Region }))}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer text-slate-700"
                    >
                      <option value="">지역 선택</option>
                      {Object.values(Region).map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-4 pointer-events-none text-slate-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Industry */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 block">업종 / 주요생산품</label>
                <div className="relative">
                  <input
                    type="text"
                    value={bizInfo.industry}
                    onChange={(e) => setBizInfo(prev => ({ ...prev, industry: e.target.value }))}
                    placeholder="예: 카페, 의류 쇼핑몰, 반도체 장비 제조"
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all pl-11"
                  />
                  <div className="absolute left-3.5 top-3.5 text-slate-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSearch}
                disabled={searchState.isLoading}
                className="w-full py-4 bg-slate-900 hover:bg-blue-800 text-white font-bold text-lg rounded-xl transition-all shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
              >
                {searchState.isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>AI 정밀 분석 중...</span>
                  </>
                ) : (
                  <>
                    <span>내 자금 매칭결과 확인하기</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
            
            {/* Security Note */}
            <div className="bg-slate-50/80 px-6 py-3 border-t border-slate-100 flex justify-center text-xs text-slate-500">
               <p>🔒 입력하신 정보는 조회 목적으로만 사용되며 저장되지 않습니다.</p>
            </div>
          </div>
        </div>

        {/* Content Section (Hidden when searching/results) */}
        {!searchState.data && !searchState.isLoading && (
          <div className="animate-fadeIn pb-20">
            {/* Stats */}
            <div className="max-w-4xl mx-auto mb-20">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 text-center divide-x divide-slate-200">
                <div>
                  <div className="text-3xl font-bold text-slate-900">3,421<span className="text-blue-600 text-xl">+</span></div>
                  <div className="text-sm text-slate-500 mt-1">누적 매칭 기업</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-slate-900">890<span className="text-sm text-slate-600">억</span></div>
                  <div className="text-sm text-slate-500 mt-1">총 매칭 금액</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-slate-900">98<span className="text-sm text-slate-600">%</span></div>
                  <div className="text-sm text-slate-500 mt-1">사용자 만족도</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-slate-900">0<span className="text-sm text-slate-600">원</span></div>
                  <div className="text-sm text-slate-500 mt-1">서비스 이용료</div>
                </div>
              </div>
            </div>

            {/* Success Cases */}
            <div className="mb-20">
              <div className="text-center mb-10">
                <span className="text-blue-600 font-semibold tracking-wide uppercase text-sm">Success Stories</span>
                <h2 className="text-3xl font-bold text-slate-900 mt-2">최근 자금 조달 성공 사례</h2>
                <p className="text-slate-500 mt-3">비슷한 업종의 대표님들은 이미 혜택을 받고 계십니다.</p>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {SUCCESS_CASES.map((item) => (
                  <div key={item.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded">{item.category}</span>
                      <span className="text-xs text-slate-400">{item.region}</span>
                    </div>
                    <div className="mb-1 text-sm text-slate-500 font-medium">{item.type}</div>
                    <div className="text-2xl font-bold text-blue-600 mb-4">{item.amount} <span className="text-lg text-slate-800">승인</span></div>
                    <p className="text-slate-600 text-sm leading-relaxed mb-4 border-t border-slate-50 pt-4">"{item.desc}"</p>
                    <div className="inline-block bg-green-50 text-green-700 text-xs font-bold px-2 py-1 rounded border border-green-100">👍 {item.badge}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-slate-900 rounded-3xl p-8 md:p-12 text-center md:text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
              <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
              
              <div className="relative z-10 grid md:grid-cols-12 gap-10 items-center">
                <div className="md:col-span-4 space-y-4">
                  <h2 className="text-3xl font-bold text-white">대표님들의<br />생생한 이용 후기</h2>
                  <p className="text-slate-400">정책자금 AI를 통해 자금난을 해결한<br />1,200여 명의 대표님이 추천합니다.</p>
                  <button className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-medium transition-colors">후기 더보기 →</button>
                </div>
                <div className="md:col-span-8 grid gap-4">
                  {REVIEWS.map((review) => (
                    <div key={review.id} className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10 flex gap-4 items-start text-left">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                        {review.author.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-white text-sm">{review.author}</span>
                          <span className="text-slate-400 text-xs">{review.company}</span>
                          <div className="flex text-yellow-400 text-xs">
                            {[...Array(review.stars)].map((_, i) => <span key={i}>★</span>)}
                          </div>
                        </div>
                        <p className="text-slate-200 text-sm leading-snug">{review.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Area */}
        <div ref={resultsRef} className="scroll-mt-24">
          {searchState.isLoading && (
            <div className="w-full max-w-2xl mx-auto mt-8 p-8 bg-white rounded-2xl shadow-sm border border-slate-100">
              <div className="flex flex-col items-center justify-center space-y-6 py-8">
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-slate-800"><span className="text-blue-600">AI</span>가 자금을 매칭하고 있습니다</h3>
                  <p className="text-slate-500 text-sm">
                    {bizInfo.region} 지역의 공고와 지원 자격을 분석 중입니다.<br/>
                    <span className="font-semibold text-blue-600">약 30초 내외로 소요됩니다</span>
                  </p>
                </div>
                
                <div className="w-full max-w-[200px] space-y-4">
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full animate-[progress_2s_ease-in-out_infinite] w-1/3"></div>
                  </div>
                  <button 
                    onClick={handleStopSearch}
                    className="w-full py-2 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg transition-colors font-medium"
                  >
                    검색 중단
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {searchState.error && (
            <div className="w-full max-w-2xl mx-auto mt-8 p-6 bg-red-50 border border-red-100 rounded-xl text-center animate-fadeIn">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-red-900 mb-1">
                {searchState.error === "검색이 사용자에 의해 중단되었습니다." ? "검색이 중단되었습니다" : "매칭 중 오류가 발생했습니다"}
              </h3>
              <p className="text-red-700 text-sm mb-4">{searchState.error}</p>
              <button 
                onClick={handleSearch} 
                className="px-6 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium transition-colors"
              >
                다시 시도하기
              </button>
            </div>
          )}

          {searchState.data && !searchState.isLoading && (
            <ResultsView 
              data={searchState.data} 
              onApplyClick={() => setIsModalOpen(true)} 
              userRegion={bizInfo.region}
            />
          )}
        </div>
      </main>

      {/* Bottom CTA */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 py-12 px-4 md:px-8 mt-12">
        <div className="max-w-4xl mx-auto text-center text-white space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold">아직 고민되시나요?</h2>
          <p className="text-blue-100 text-lg">
            복잡한 과정 없이, 전문가에게 직접 자금 매칭 상담을 신청해보세요.<br className="hidden md:inline"/>
            입력하신 정보가 있다면 자동으로 연동되어 빠르게 신청할 수 있습니다.
          </p>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 text-lg font-bold px-8 py-4 rounded-xl shadow-lg hover:bg-blue-50 transition-all transform hover:-translate-y-1"
          >
            <span>간편 상담 신청하기</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Application Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl transform transition-all scale-100 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">전문가 상담 / 자금 매칭 신청</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmitApplication} className="p-6 space-y-5">
              <div className="bg-blue-50 p-4 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">사업자번호</span>
                  <span className="font-mono font-medium text-slate-800">{bizInfo.bizNumber || '(미입력)'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">소재지</span>
                  <span className="font-medium text-slate-800">{bizInfo.region || '(미선택)'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">업종</span>
                  <span className="font-medium text-slate-800 truncate max-w-[200px]">{bizInfo.industry || '(미입력)'}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">업체명 (상호)</label>
                  <input 
                    type="text" 
                    required 
                    value={applicationForm.companyName} 
                    onChange={(e) => setApplicationForm(prev => ({ ...prev, companyName: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="사업자등록증 상의 업체명"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">담당자 성명</label>
                  <input 
                    type="text" 
                    required 
                    value={applicationForm.contactName} 
                    onChange={(e) => setApplicationForm(prev => ({ ...prev, contactName: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="대표자 또는 담당자 성명"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">휴대전화번호</label>
                  <input 
                    type="tel" 
                    required 
                    value={applicationForm.phoneNumber} 
                    onChange={(e) => setApplicationForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="010-0000-0000"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-500/30"
                >
                  상담 신청하기
                </button>
                <p className="text-center text-xs text-slate-400 mt-3">신청하시면 개인정보처리방침에 동의하는 것으로 간주됩니다.</p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;