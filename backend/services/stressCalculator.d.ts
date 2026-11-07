export interface HourlyStressPoint {
  time: string;
  stress: number;
  sampleCount: number;
}

export function hourlyStress(samples: {measured_at: string; bpm: number}[]): HourlyStressPoint[];
