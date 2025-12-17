export interface ApiResponse {
  data: GenerationData[];
}

export interface GenerationData {
  from: string;
  to: string;
  generationmix: Generation[];
}

export interface Generation {
  fuel: string;
  perc: number;
}

export interface AvgCounter {
  name: string;
  total: number;
  number: number;
}

export interface DayCounter {
  today: AvgCounter[];
  tomorrow: AvgCounter[];
  dayAfter: AvgCounter[];
}

export interface DayAverage {
  name: string;
  avg: number;
}
