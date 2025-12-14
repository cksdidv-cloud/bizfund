import React from 'react';

const Header: React.FC = () => {
  const handleApiKeySetting = async () => {
    // Check if running in an environment that supports dynamic API key selection (e.g., IDX/AI Studio)
    if ((window as any).aistudio && (window as any).aistudio.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
    } else {
      alert("현재 환경에서는 API Key 설정 팝업을 사용할 수 없습니다.");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50 flex items-center justify-between px-4 md:px-8">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30">
          AI
        </div>
        <span className="font-bold text-xl text-slate-800 tracking-tight">정책자금 <span className="text-blue-600">AI</span></span>
      </div>
      
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
        <a href="#" className="hover:text-blue-600 transition-colors">홈</a>
        <a href="#" className="hover:text-blue-600 transition-colors">지원사업 찾기</a>
        <a href="#" className="hover:text-blue-600 transition-colors">컨설팅 매칭</a>
        <a href="#" className="hover:text-blue-600 transition-colors">커뮤니티</a>
      </nav>

      <div className="flex items-center gap-3">
        {/* API Key Management Button */}
        <button 
          onClick={handleApiKeySetting}
          className="px-3 py-2 text-xs md:text-sm font-medium text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100 flex items-center gap-1"
          title="API Key 설정"
        >
          <span>🔑</span>
          <span className="hidden sm:inline">API Key</span>
        </button>

        <button className="hidden md:block px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
          로그인
        </button>
        <button className="px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-full transition-colors shadow-sm">
          기업진단 무료
        </button>
      </div>
    </header>
  );
};

export default Header;