import React from 'react';
import { SearchResult, Fund } from '../types';

interface ResultsViewProps {
  data: SearchResult;
  onApplyClick: () => void;
  userRegion?: string;
}

const ResultsView: React.FC<ResultsViewProps> = ({ data, onApplyClick }) => {
  const { funds } = data;

  // Group funds by Agency
  const groupedFunds = funds.reduce((acc, fund) => {
    const agencyName = fund.agency || '기타 지원기관';
    if (!acc[agencyName]) acc[agencyName] = [];
    acc[agencyName].push(fund);
    return acc;
  }, {} as Record<string, Fund[]>);

  const agencies = Object.keys(groupedFunds);

  return (
    <div className="max-w-4xl mx-auto w-full animate-fadeIn pb-12">
       {/* Title Header */}
       <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                   <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                   </svg>
                </div>
                <div>
                   <h2 className="text-xl font-bold text-white">AI 맞춤 자금 분석 결과</h2>
                   <p className="text-blue-100 text-sm">입력하신 정보를 바탕으로 가장 적합한 자금을 찾았습니다.</p>
                </div>
             </div>
          </div>
          
          <div className="p-6 md:p-8 bg-slate-50/50">
             {agencies.length === 0 ? (
                <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200 border-dashed">
                  <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                     <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  <p className="font-medium text-slate-700 mb-1">조건에 맞는 현재 진행 중인 공고를 찾지 못했습니다.</p>
                  <p className="text-sm">입력하신 정보를 다시 확인하거나, 전문 컨설턴트 상담을 이용해보세요.</p>
                </div>
             ) : (
                <div className="space-y-12">
                   {agencies.map((agency) => (
                      <div key={agency} className="animate-fadeIn">
                         {/* Agency Header - Distinct Headline */}
                         <div className="flex items-center justify-between gap-3 mb-6 border-b-2 border-slate-200 pb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-8 bg-blue-600 rounded-lg"></div>
                                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{agency}</h3>
                            </div>
                            <span className="text-sm font-bold px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
                               {groupedFunds[agency].length}건 매칭
                            </span>
                         </div>

                         {/* Cards Grid */}
                         <div className="grid grid-cols-1 gap-5">
                            {groupedFunds[agency].map((fund, idx) => (
                               <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
                                  <div className="p-5 md:p-6">
                                     <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                        <div className="flex-1">
                                           <div className="flex items-center gap-2 mb-2">
                                              <span className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-md border border-indigo-100">
                                                 {fund.category}
                                              </span>
                                              <span className="inline-block px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold rounded-full border border-green-100">
                                                 접수중
                                              </span>
                                           </div>
                                           <h4 className="text-lg md:text-xl font-bold text-slate-900 leading-snug group-hover:text-blue-700 transition-colors">
                                              {fund.title}
                                           </h4>
                                        </div>
                                        {fund.url && fund.url !== 'null' && (
                                           <a 
                                             href={fund.url} 
                                             target="_blank" 
                                             rel="noopener noreferrer" 
                                             className="hidden md:inline-flex flex-shrink-0 items-center justify-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 text-sm font-semibold rounded-lg transition-colors border border-slate-200 hover:border-blue-200"
                                           >
                                              공고 확인
                                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                           </a>
                                        )}
                                     </div>
                                     
                                     <div className="grid md:grid-cols-2 gap-4 bg-slate-50/50 rounded-lg p-4 border border-slate-100">
                                        <div>
                                           <p className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                              지원 혜택
                                           </p>
                                           <p className="text-sm text-slate-800 font-medium leading-relaxed">{fund.summary}</p>
                                        </div>
                                        <div>
                                           <p className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                              자격 요건
                                           </p>
                                           <p className="text-sm text-slate-700 leading-relaxed">{fund.eligibility}</p>
                                        </div>
                                     </div>

                                     {/* Mobile CTA */}
                                     {fund.url && fund.url !== 'null' && (
                                        <div className="mt-4 md:hidden">
                                           <a 
                                             href={fund.url} 
                                             target="_blank" 
                                             rel="noopener noreferrer" 
                                             className="flex items-center justify-center w-full py-3 bg-blue-600 text-white text-sm font-bold rounded-lg shadow-sm"
                                           >
                                              상세 공고 확인하기
                                           </a>
                                        </div>
                                     )}
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>
                   ))}
                </div>
             )}
          </div>
       </div>

       {/* Bottom CTA Banner */}
       <div className="bg-slate-900 rounded-2xl p-8 text-center md:text-left md:flex items-center justify-between shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full mix-blend-overlay filter blur-3xl opacity-10 -mr-16 -mt-16"></div>
          <div className="relative z-10 md:max-w-xl">
             <h3 className="text-2xl font-bold text-white mb-2">선정 확률을 높이고 싶으신가요?</h3>
             <p className="text-slate-300">우리 기업에 딱 맞는 자금 선정 노하우, 전문 컨설턴트가 <strong>무료로 진단</strong>해드립니다.</p>
          </div>
          <button 
             onClick={onApplyClick}
             className="relative z-10 mt-6 md:mt-0 px-8 py-4 bg-white hover:bg-blue-50 text-slate-900 font-bold rounded-xl transition-all shadow-lg transform hover:-translate-y-1 flex items-center justify-center gap-2"
          >
             <span>자금 매칭 상담 신청하기</span>
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
             </svg>
          </button>
       </div>
    </div>
  );
};

export default ResultsView;