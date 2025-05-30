
export interface Subject {
  id: string;
  code: string;
  name: string;
  required: boolean;
  class: string;
  capacity: number;
  filledSpots: number;
  professor: string;
  difficulty: number;
  hasFriend: boolean;
  schedule: string;
  hours: number;
  priority?: number;
}

export interface TimeSlot {
  day: string;
  startTime: number;
  endTime: number;
}

export interface ScheduleConfiguration {
  weightVacancies: number;
  weightFriend: number;
  weightDifficulty: number;
  unavailableSlots?: string[];
}

export interface OptimizedSchedule {
  subjects: Subject[];
  totalSubjects: number;
  conflicts: string[];
}

export interface AvailableTime {
  day: string;
  timeSlots: string[];
}
