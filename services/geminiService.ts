import { GoogleGenAI } from "@google/genai";
import { SearchResult, GroundingChunk, BusinessInfo, Region } from "../types";

// User provided specific URLs for certain regions
const REGIONAL_TARGET_URLS: Partial<Record<Region, string>> = {
  [Region.GANGWON]: 'https://www.gwsinbo.or.kr/board/board_list.php?board_name=product',
  [Region.GYEONGGI]: 'https://www.gcgf.or.kr/gcgf/cm/conts/contsView.do?mi=1051&contsId=1022',
  [Region.BUSAN]: 'https://www.busansinbo.or.kr/portal/board/post/list.do?bcIdx=623&mid=0103010000&token=1765718429302',
  [Region.GYEONGNAM]: 'https://www.gnsinbo.or.kr/bbs/content.php?co_id=2_2',
};

export const matchPolicyFunds = async (info: BusinessInfo): Promise<SearchResult> => {
  try {
    // Initialize AI client inside the function to ensure the latest API Key is used
    // This allows the key to be updated dynamically via window.aistudio.openSelectKey()
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const { region, industry, bizNumber } = info;
    
    // Determine the specific target URL for the selected region
    const targetUrl = REGIONAL_TARGET_URLS[region as Region];
    const regionSpecificInstruction = targetUrl 
      ? `- ${region} 신용보증재단 자금 목록: ${targetUrl}`
      : `- ${region} 지역 신용보증재단 홈페이지`;

    const prompt = `
      당신은 대한민국 정책자금 매칭 AI입니다.
      
      [기업 정보]
      - 사업자번호: ${bizNumber}
      - 소재지: ${region}
      - 업종: ${industry}

      [검색 대상 및 지침]
      아래 사이트들의 **현재 모집 중인 공고 게시판**을 정밀 검색하여, 이 기업이 **지금 당장 신청 가능한 자금**을 찾아주세요.
      
      1. 소상공인시장진흥공단 (https://www.sbiz24.kr/#/)
      2. ${regionSpecificInstruction}
      
      [필수 요청 사항]
      1. 단순한 기관 소개나 홈페이지 메인 연결은 **절대 하지 마세요.**
      2. **"2024년 희망리턴패키지"**, **"강원형 저신용 소상공인 지원자금"** 처럼 구체적인 **자금/공고명**을 찾으세요.
      3. 찾은 자금명에 대해 **해당 공고의 상세 페이지 URL**을 찾아서 반드시 **링크**를 걸어주세요.
      4. 신청 불가능하거나 마감된 자금은 제외하세요.

      [출력 양식 (Markdown)]
      
      ## 🎯 ${region} 소재 [${industry}] 맞춤 자금 (신청 가능)

      1. **[자금명 (반드시 링크로 작성)](URL)**
         - **지원한도/금리**: [내용]
         - **자격요건**: [핵심 요건]
         - **신청방법**: [온라인/방문 등]

      2. **[자금명 (반드시 링크로 작성)](URL)**
         ...

      (적합한 자금이 명확하지 않을 경우, 가장 유사한 현재 진행 중인 공고를 보여주세요.)
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1, // Lower temperature for more factual results
      },
    });

    const text = response.text || "죄송합니다. 현재 조건에 맞는 상세 공고를 찾지 못했습니다.";
    
    // Extract grounding chunks (sources)
    const groundingChunks = (response.candidates?.[0]?.groundingMetadata?.groundingChunks || []) as GroundingChunk[];

    return {
      text,
      groundingChunks
    };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "자금 매칭 분석 중 오류가 발생했습니다.");
  }
};