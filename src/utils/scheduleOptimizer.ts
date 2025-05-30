
import { Subject, TimeSlot, ScheduleConfiguration, OptimizedSchedule } from '@/types/schedule';

export class ScheduleOptimizer {
  private subjects: Subject[];
  private availableSlots: string[];
  private configuration: ScheduleConfiguration;

  constructor(subjects: Subject[], availableSlots: string[], config: ScheduleConfiguration) {
    this.subjects = subjects;
    this.availableSlots = availableSlots;
    this.configuration = config;
  }

  optimize(): OptimizedSchedule {
    console.log('Iniciando otimização com', this.subjects.length, 'matérias');
    
    // Preprocessar horários das matérias
    const processedSubjects = this.subjects.map(subject => ({
      ...subject,
      timeSlots: this.parseSchedule(subject.schedule),
      priority: this.calculatePriority(subject)
    }));

    // Agrupar matérias por código
    const subjectGroups = this.groupSubjectsByCode(processedSubjects);
    
    // Aplicar otimização respeitando disponibilidade
    const optimizedSubjects = this.optimizeWithAvailability(subjectGroups);

    const conflicts = this.detectConflicts(optimizedSubjects);
    
    return {
      subjects: optimizedSubjects,
      totalSubjects: optimizedSubjects.length,
      conflicts
    };
  }

  private optimizeWithAvailability(subjectGroups: { [key: string]: Subject[] }): Subject[] {
    const unavailableSlots = this.configuration.unavailableSlots || [];
    console.log('Horários indisponíveis:', unavailableSlots);

    // Filtrar matérias que não conflitam com horários indisponíveis
    const validSubjects: { [key: string]: Subject[] } = {};
    
    for (const [code, subjects] of Object.entries(subjectGroups)) {
      validSubjects[code] = subjects.filter(subject => 
        !this.hasConflictWithUnavailableSlots(subject, unavailableSlots)
      );
    }

    console.log('Matérias válidas após filtrar indisponibilidade:', Object.keys(validSubjects).length);

    return this.maximizeSubjects(validSubjects);
  }

  private hasConflictWithUnavailableSlots(subject: Subject, unavailableSlots: string[]): boolean {
    const subjectSlots = this.parseSchedule(subject.schedule);
    
    for (const slot of subjectSlots) {
      for (let hour = slot.startTime; hour < slot.endTime; hour += 2) {
        const slotKey = `${this.getDayAbbreviation(slot.day)}.${hour.toString().padStart(2, '0')}-${(hour + 2).toString().padStart(2, '0')}`;
        if (unavailableSlots.includes(slotKey)) {
          return true;
        }
      }
    }
    
    return false;
  }

  private getDayAbbreviation(day: string): string {
    const dayMap: { [key: string]: string } = {
      'Segunda': 'Seg',
      'Terça': 'Ter',
      'Quarta': 'Qua',
      'Quinta': 'Qui',
      'Sexta': 'Sex'
    };
    return dayMap[day] || day;
  }

  private parseSchedule(scheduleStr: string): TimeSlot[] {
    const dayMap: { [key: string]: string } = {
      'Seg': 'Segunda',
      'Ter': 'Terça',
      'Qua': 'Quarta',
      'Qui': 'Quinta',
      'Sex': 'Sexta'
    };

    const timeSlots: TimeSlot[] = [];
    const periods = scheduleStr.split(', ');

    for (const period of periods) {
      const parts = period.split('.');
      if (parts.length < 2) continue;

      const dayAbbrev = parts[0];
      const day = dayMap[dayAbbrev] || dayAbbrev;
      const timeParts = parts[1].split('-');
      
      if (timeParts.length === 2) {
        const startTime = parseInt(timeParts[0]);
        const endTime = parseInt(timeParts[1]);
        timeSlots.push({ day, startTime, endTime });
      }
    }

    return timeSlots;
  }

  private calculatePriority(subject: Subject): number {
    let priority = 0;
    
    // Prioridade baseada em vagas disponíveis
    const availableSpots = subject.capacity - subject.filledSpots;
    priority += this.configuration.weightVacancies * (availableSpots > 0 ? availableSpots : -10);
    
    // Prioridade por ter amigo
    if (subject.hasFriend) {
      priority += this.configuration.weightFriend;
    }
    
    // Prioridade baseada na dificuldade do professor (inversa)
    priority += this.configuration.weightDifficulty * (5 - subject.difficulty);
    
    return priority;
  }

  private groupSubjectsByCode(subjects: Subject[]): { [key: string]: Subject[] } {
    const groups: { [key: string]: Subject[] } = {};
    
    for (const subject of subjects) {
      if (!groups[subject.code]) {
        groups[subject.code] = [];
      }
      groups[subject.code].push(subject);
    }
    
    return groups;
  }

  private maximizeSubjects(subjectGroups: { [key: string]: Subject[] }): Subject[] {
    const selected: Subject[] = [];
    const usedTimeSlots = new Set<string>();

    // Ordenar grupos por prioridade máxima
    const sortedCodes = Object.keys(subjectGroups).sort((a, b) => {
      const maxPriorityA = Math.max(...subjectGroups[a].map(s => s.priority || 0));
      const maxPriorityB = Math.max(...subjectGroups[b].map(s => s.priority || 0));
      return maxPriorityB - maxPriorityA;
    });

    for (const code of sortedCodes) {
      const subjects = subjectGroups[code];
      
      // Ordenar turmas por prioridade
      subjects.sort((a, b) => (b.priority || 0) - (a.priority || 0));
      
      for (const subject of subjects) {
        if (!this.hasTimeConflict(subject, usedTimeSlots)) {
          selected.push(subject);
          this.addTimeSlots(subject, usedTimeSlots);
          break; // Apenas uma turma por matéria
        }
      }
    }

    return selected;
  }

  private optimizeHalfPeriod(subjectGroups: { [key: string]: Subject[] }): Subject[] {
    const selected: Subject[] = [];
    const dayPeriods: { [key: string]: 'morning' | 'afternoon' | null } = {};

    // Para cada dia, determinar se será manhã ou tarde
    const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
    
    for (const day of days) {
      dayPeriods[day] = null;
    }

    const usedTimeSlots = new Set<string>();

    // Ordenar grupos por prioridade
    const sortedCodes = Object.keys(subjectGroups).sort((a, b) => {
      const maxPriorityA = Math.max(...subjectGroups[a].map(s => s.priority || 0));
      const maxPriorityB = Math.max(...subjectGroups[b].map(s => s.priority || 0));
      return maxPriorityB - maxPriorityA;
    });

    for (const code of sortedCodes) {
      const subjects = subjectGroups[code];
      subjects.sort((a, b) => (b.priority || 0) - (a.priority || 0));
      
      for (const subject of subjects) {
        if (this.canScheduleHalfPeriod(subject, dayPeriods, usedTimeSlots)) {
          selected.push(subject);
          this.updateDayPeriods(subject, dayPeriods);
          this.addTimeSlots(subject, usedTimeSlots);
          break;
        }
      }
    }

    return selected;
  }

  private hasTimeConflict(subject: Subject, usedTimeSlots: Set<string>): boolean {
    const timeSlots = this.parseSchedule(subject.schedule);
    
    for (const slot of timeSlots) {
      for (let hour = slot.startTime; hour < slot.endTime; hour += 2) {
        const slotKey = `${this.getDayAbbreviation(slot.day)}.${hour.toString().padStart(2, '0')}-${(hour + 2).toString().padStart(2, '0')}`;
        if (usedTimeSlots.has(slotKey)) {
          return true;
        }
      }
    }
    
    return false;
  }

  private addTimeSlots(subject: Subject, usedTimeSlots: Set<string>): void {
    const timeSlots = this.parseSchedule(subject.schedule);
    
    for (const slot of timeSlots) {
      for (let hour = slot.startTime; hour < slot.endTime; hour += 2) {
        const slotKey = `${this.getDayAbbreviation(slot.day)}.${hour.toString().padStart(2, '0')}-${(hour + 2).toString().padStart(2, '0')}`;
        usedTimeSlots.add(slotKey);
      }
    }
  }

  private canScheduleHalfPeriod(
    subject: Subject, 
    dayPeriods: { [key: string]: 'morning' | 'afternoon' | null },
    usedTimeSlots: Set<string>
  ): boolean {
    if (this.hasTimeConflict(subject, usedTimeSlots)) {
      return false;
    }

    const timeSlots = this.parseSchedule(subject.schedule);
    
    for (const slot of timeSlots) {
      const period = slot.startTime < 14 ? 'morning' : 'afternoon';
      const currentPeriod = dayPeriods[slot.day];
      
      if (currentPeriod && currentPeriod !== period) {
        return false; // Conflito de período
      }
    }
    
    return true;
  }

  private updateDayPeriods(subject: Subject, dayPeriods: { [key: string]: 'morning' | 'afternoon' | null }): void {
    const timeSlots = this.parseSchedule(subject.schedule);
    
    for (const slot of timeSlots) {
      const period = slot.startTime < 14 ? 'morning' : 'afternoon';
      dayPeriods[slot.day] = period;
    }
  }

  private detectConflicts(subjects: Subject[]): string[] {
    const conflicts: string[] = [];
    const usedTimeSlots = new Map<string, string>();

    for (const subject of subjects) {
      const timeSlots = this.parseSchedule(subject.schedule);
      
      for (const slot of timeSlots) {
        for (let hour = slot.startTime; hour < slot.endTime; hour += 2) {
          const slotKey = `${this.getDayAbbreviation(slot.day)}.${hour.toString().padStart(2, '0')}-${(hour + 2).toString().padStart(2, '0')}`;
          
          if (usedTimeSlots.has(slotKey)) {
            const conflictingSubject = usedTimeSlots.get(slotKey);
            conflicts.push(`Conflito entre ${subject.name} e ${conflictingSubject} no horário ${slotKey}`);
          } else {
            usedTimeSlots.set(slotKey, subject.name);
          }
        }
      }
    }

    return conflicts;
  }
}
