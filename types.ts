export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface SearchResult {
  text: string;
  groundingChunks: GroundingChunk[];
}

export interface SearchState {
  isLoading: boolean;
  error: string | null;
  data: SearchResult | null;
}

export enum Region {
  SEOUL = '서울',
  BUSAN = '부산',
  DAEGU = '대구',
  INCHEON = '인천',
  GWANGJU = '광주',
  DAEJEON = '대전',
  ULSAN = '울산',
  SEJONG = '세종',
  GYEONGGI = '경기',
  GANGWON = '강원',
  CHUNGBUK = '충북',
  CHUNGNAM = '충남',
  JEONBUK = '전북',
  JEONNAM = '전남',
  GYEONGBUK = '경북',
  GYEONGNAM = '경남',
  JEJU = '제주'
}

export interface BusinessInfo {
  bizNumber: string;
  region: Region | '';
  industry: string;
  bizType: string; // Individual or Corporate (derived roughly or selected)
}

export interface ApplicationData extends BusinessInfo {
  companyName: string;
  contactName: string;
  phoneNumber: string;
}