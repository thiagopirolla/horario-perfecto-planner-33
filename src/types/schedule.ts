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
  grade?: number; // Nova propriedade para a nota da matéria
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
  weightGrade: number; // Novo peso para média de notas
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
