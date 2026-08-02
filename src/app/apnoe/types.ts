export type PlanType = "co2" | "o2";
export type TrainingType = "co2" | "o2" | "max" | "free" | "light" | "water";
export type PlanRound = { hold: number; rest: number };
export type RecordRow = {
  id: string; duration_seconds: number; record_date: string;
  first_urge_seconds: number | null; first_contraction_seconds: number | null; note: string | null;
};
export type TrainingRow = {
  id: string; training_date: string; type: TrainingType;
  planned_rounds: PlanRound[] | null; actual_rounds: number[] | null;
  completed_rounds: number; total_rounds: number; note: string | null;
};
