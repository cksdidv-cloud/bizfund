import { GoogleGenAI } from "@google/genai";
import { SearchResult, GroundingChunk, BusinessInfo, Region, Fund } from "../types.ts";

// 1. 전국 공통 지원 기관 (항상 검색 대상)
const NATIONAL_URLS = [
  "https://www.sbiz24.kr/",       // 소상공인시장진흥공단 (24)
  "https://www.kosmes.or.kr/",    // 중소벤처기업진흥공단
  "https://www.kodit.co.kr/",     // 신용보증기금
  "https://www.kibo.or.kr/",      // 기술보증기금
];

// 2. 지역별 신용보증재단 매핑 (사용자 선택 지역에 따라 타겟팅)
const REGIONAL_TARGET_URLS: Record<Region, string> = {
  [Region.SEOUL]: 'https://www.seoulshinbo.co.kr/',
  [Region.BUSAN]: 'https://www.busansinbo.or.kr/main.do',
  [Region.DAEGU]: 'https://www.dgsinbo.or.kr/',
  [Region.INCHEON]: 'https://www.icsinbo.or.kr/',
  [Region.GWANGJU]: 'https://www.gjsinbo.or.kr/',
  [Region.DAEJEON]: 'https://www.sinbo.or.kr/',
  [Region.ULSAN]: 'https://www.ulsanshinbo.co.kr/',
  [Region.SEJONG]: 'https://sjsinbo.or.kr/',
  [Region.GYEONGGI]: 'https://www.gcgf.or.kr/gcgf/intro.do',
  [Region.GANGWON]: 'https://www.gwsinbo.or.kr/main/intro.php',
  [Region.CHUNGBUK]: 'https://www.cbsinbo.or.kr/',
  [Region.CHUNGNAM]: 'https://www.cnsinbo.co.kr/intro.html',
  [Region.JEONBUK]: 'https://www.jbcredit.or.kr/',
  [Region.JEONNAM]: 'https://www.jnsinbo.or.kr/jnsinbo/intro.do',
  [Region.GYEONGBUK]: 'https://gbsinbo.co.kr/',
  [Region.GYEONGNAM]: 'https://www.gnsinbo.or.kr/',
  [Region.JEJU]: 'https://www.jcgf.or.kr/index2.php'
};

export const matchPolicyFunds = async (info: BusinessInfo): Promise<SearchResult> => {
  try {
    // 1. Validate API Key
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API Key가 설정되지 않았습니다. 우측 상단 '🔑 API Key' 버튼을 눌러 키를 설정해주세요.");
    }

    // 2. Initialize Client
    const ai = new GoogleGenAI({ apiKey: apiKey });

    const { region, industry, bizNumber } = info;
    
    // 타겟 URL 선정
    const targetRegionUrl = REGIONAL_TARGET_URLS[region as Region];
    const searchTargets = [...NATIONAL_URLS];
    if (targetRegionUrl) {
      searchTargets.push(targetRegionUrl);
    }
    const targetUrlString = searchTargets.join(', ');

    // 3. Prompt Optimization for Speed
    const systemInstruction = `
      You are an expert policy fund consultant.
      Context: Business in ${region}, Industry: ${industry}.
      Task: Find 3 currently active policy funds from these sources: ${targetUrlString}.
      
      Output Rules:
      1. Return ONLY a JSON array. DO NOT include markdown code blocks (e.g. \`\`\`json).
      2. Fields: 
         - "agency": Exact Agency Name (e.g., ${region}신용보증재단)
         - "category": Fund Type (e.g., 운전자금)
         - "title": Exact Fund Name
         - "url": URL to the notice
         - "summary": Max 30 chars description (Include limit/rate)
         - "eligibility": Max 30 chars criteria
      3. Speed is critical. Keep texts short.
    `;

    const userPrompt = `Find 3 active funds for ${bizNumber} in ${region}.`;

    let text = "";
    let groundingChunks: GroundingChunk[] = [];

    // Retry Logic for Google Search Permission (403 Error)
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: userPrompt,
            config: {
                systemInstruction: systemInstruction,
                tools: [{ googleSearch: {} }],
                temperature: 0.1,
            },
        });
        text = response.text || "";
        groundingChunks = (response.candidates?.[0]?.groundingMetadata?.groundingChunks || []) as GroundingChunk[];
        
    } catch (e: any) {
        if (e.message && (e.message.includes("403") || e.message.includes("PERMISSION_DENIED") || e.message.includes("permission"))) {
            console.warn("Google Search Grounding failed (403). Falling back to internal knowledge.");
            
            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: userPrompt,
                config: {
                    systemInstruction: systemInstruction + "\n(Note: Live search is unavailable. Suggest standard known funds for this region based on your knowledge.)",
                    temperature: 0.3,
                },
            });
            text = response.text || "";
            groundingChunks = []; 
        } else {
            throw e;
        }
    }

    // Parse JSON from text
    let funds: Fund[] = [];
    try {
      let cleanText = text.trim();
      if (cleanText.startsWith("```")) {
         cleanText = cleanText.replace(/^```(json)?\s*/, "").replace(/```$/, "");
      }
      
      funds = JSON.parse(cleanText);
    } catch (e) {
      const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        try {
            funds = JSON.parse(jsonMatch[0]);
        } catch (e2) { console.error(e2); }
      }
      
      if (funds.length === 0 && text.length > 0) {
           funds = [{
             agency: "AI 분석 결과",
             category: "알림",
             title: "상세 공고 내용을 확인해주세요",
             url: targetRegionUrl || "",
             summary: "자동 변환 실패",
             eligibility: text.substring(0, 50) + "..."
           }];
      }
    }

    return {
      funds,
      groundingChunks
    };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "자금 매칭 분석 중 오류가 발생했습니다.");
  }
};