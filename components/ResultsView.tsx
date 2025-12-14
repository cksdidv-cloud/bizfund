import React from 'react';
import { SearchResult } from '../types';

interface ResultsViewProps {
  data: SearchResult;
  onApplyClick: () => void;
  userRegion?: string;
}

const ResultsView: React.FC<ResultsViewProps> = ({ data, onApplyClick }) => {
  // Formatter to handle Markdown including links [text](url)
  const formatText = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Headers
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-2xl font-bold text-slate-900 mt-8 mb-4">{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-xl font-semibold text-slate-800 mt-6 mb-3">{line.replace('### ', '')}</h3>;
      }
      
      // Handle Lines
      const content = line.trim();
      
      // If empty line
      if (!content) {
        return <div key={index} className="h-2" />;
      }

      // Check for List items
      const isList = content.startsWith('- ') || content.startsWith('* ') || /^\d+\.\s/.test(content);
      const cleanContent = content.replace(/^[-*]\s/, '').replace(/^\d+\.\s/, '');
      
      // Parser for Links [text](url) and Bold **text**
      // We use a regex to split by links first, then bold
      const parseLine = (str: string) => {
        // Regex for markdown links: [text](url)
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = linkRegex.exec(str)) !== null) {
          // Push text before link
          if (match.index > lastIndex) {
            parts.push(<span key={`text-${lastIndex}`}>{processBold(str.slice(lastIndex, match.index))}</span>);
          }
          // Push link
          parts.push(
            <a 
              key={`link-${match.index}`} 
              href={match[2]} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline font-semibold transition-colors"
            >
              {match[1]}
            </a>
          );
          lastIndex = linkRegex.lastIndex;
        }
        // Push remaining text
        if (lastIndex < str.length) {
          parts.push(<span key={`text-${lastIndex}`}>{processBold(str.slice(lastIndex))}</span>);
        }
        return parts;
      };

      // Helper to process bold **text** within the string segments
      const processBold = (str: string) => {
        const boldRegex = /(\*\*.*?\*\*)/g;
        return str.split(boldRegex).map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
          }
          return part;
        });
      };

      if (isList) {
        return (
          <div key={index} className="flex gap-2 mb-2 ml-1">
            <span className="text-blue-500 mt-1.5 flex-shrink-0 text-xs">●</span>
            <p className="text-slate-700 leading-relaxed">
              {parseLine(cleanContent)}
            </p>
          </div>
        );
      }

      return (
        <p key={index} className="text-slate-700 leading-relaxed mb-2">
          {parseLine(content)}
        </p>
      );
    });
  };

  return (
    <div className="max-w-4xl mx-auto w-full animate-fadeIn pb-12">
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden mb-8">
        
        {/* AI Insight Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="font-semibold text-blue-900">맞춤 자금 분석 결과</h2>
        </div>

        {/* Main Content */}
        <div className="p-6 md:p-10">
          <div className="prose prose-slate max-w-none">
            {formatText(data.text)}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-slate-900 rounded-2xl p-8 text-center md:text-left md:flex items-center justify-between shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full mix-blend-overlay filter blur-3xl opacity-10 -mr-16 -mt-16"></div>
        
        <div className="relative z-10 md:max-w-xl">
          <h3 className="text-2xl font-bold text-white mb-2">선정 확률을 높이고 싶으신가요?</h3>
          <p className="text-slate-300">
            복잡한 서류 준비와 심사 과정, 전문 컨설턴트가 <strong>무료로 진단</strong>해드립니다.
          </p>
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