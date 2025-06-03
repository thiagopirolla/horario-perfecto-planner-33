
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
      timeSlots: this.parseSchedule(subject.schedule)
    }));

    // Agrupar matérias por código
    const subjectGroups = this.groupSubjectsByCode(processedSubjects);
    
    // Encontrar a melhor combinação usando backtracking completo
    const bestCombination = this.findOptimalCombination(subjectGroups);

    const conflicts = this.detectConflicts(bestCombination);
    
    return {
      subjects: bestCombination,
      totalSubjects: bestCombination.length,
      conflicts
    };
  }

  private findOptimalCombination(subjectGroups: { [key: string]: Subject[] }): Subject[] {
    const unavailableSlots = this.configuration.unavailableSlots || [];
    console.log('Horários indisponíveis:', unavailableSlots);

    // Filtrar matérias que conflitam com horários indisponíveis
    const filteredGroups: { [key: string]: Subject[] } = {};
    for (const [code, subjects] of Object.entries(subjectGroups)) {
      filteredGroups[code] = subjects.filter(subject => 
        !this.hasConflictWithUnavailableSlots(subject, unavailableSlots)
      );
    }

    const subjectCodes = Object.keys(filteredGroups);
    console.log('Explorando combinações de', subjectCodes.length, 'matérias');

    let bestCombination: Subject[] = [];
    let bestScore = -Infinity;
    let combinationsEvaluated = 0;

    // Backtracking para encontrar a melhor combinação
    const backtrack = (codeIndex: number, currentCombination: Subject[], usedSlots: Set<string>) => {
      // Caso base: avaliamos todas as matérias
      if (codeIndex === subjectCodes.length) {
        combinationsEvaluated++;
        const score = this.calculateCombinationScore(currentCombination);
        
        if (score > bestScore) {
          bestScore = score;
          bestCombination = [...currentCombination];
          console.log(`Nova melhor combinação encontrada - Score: ${score.toFixed(2)}, Matérias: ${currentCombination.length}`);
        }
        return;
      }

      const currentCode = subjectCodes[codeIndex];
      const availableSubjects = filteredGroups[currentCode];

      // Opção 1: Não selecionar nenhuma turma desta matéria
      backtrack(codeIndex + 1, currentCombination, usedSlots);

      // Opção 2: Tentar cada turma disponível desta matéria
      for (const subject of availableSubjects) {
        if (!this.hasTimeConflict(subject, usedSlots)) {
          // Adicionar esta matéria à combinação
          const newUsedSlots = new Set(usedSlots);
          this.addTimeSlots(subject, newUsedSlots);
          
          backtrack(codeIndex + 1, [...currentCombination, subject], newUsedSlots);
        }
      }
    };

    backtrack(0, [], new Set<string>());
    
    console.log(`Combinações avaliadas: ${combinationsEvaluated}`);
    console.log(`Melhor score encontrado: ${bestScore.toFixed(2)}`);
    console.log(`Matérias na melhor combinação: ${bestCombination.length}`);

    return bestCombination;
  }

  private calculateCombinationScore(combination: Subject[]): number {
    let totalScore = 0;

    for (const subject of combination) {
      let subjectScore = 0;

      // Score base por ter uma matéria (incentiva mais matérias)
      subjectScore += 100;

      // Score extra para matérias obrigatórias
      if (subject.required) {
        subjectScore += 1000; // Muito alto para garantir prioridade
      }

      // Score baseado em vagas disponíveis
      const availableSpots = subject.capacity - subject.filledSpots;
      if (availableSpots > 0) {
        subjectScore += this.configuration.weightVacancies * availableSpots;
      } else {
        // Penalidade por não ter vagas
        subjectScore -= this.configuration.weightVacancies * 10;
      }

      // Score por ter amigo
      if (subject.hasFriend) {
        subjectScore += this.configuration.weightFriend;
      }

      // Score baseado na dificuldade (menor dificuldade = melhor)
      subjectScore += this.configuration.weightDifficulty * (5 - subject.difficulty);

      // Score baseado na nota da matéria (maior nota = melhor)
      if (subject.grade !== undefined && subject.grade !== null) {
        subjectScore += this.configuration.weightGrade * subject.grade;
      }

      totalScore += subjectScore;
    }

    // Bonus adicional para média de notas alta quando o peso é significativo
    if (this.configuration.weightGrade > 0 && combination.length > 0) {
      const subjectsWithGrades = combination.filter(s => s.grade !== undefined && s.grade !== null);
      if (subjectsWithGrades.length > 0) {
        const averageGrade = subjectsWithGrades.reduce((sum, s) => sum + (s.grade || 0), 0) / subjectsWithGrades.length;
        // Bonus baseado na média geral da combinação
        totalScore += this.configuration.weightGrade * averageGrade * combination.length * 0.1;
      }
    }

    return totalScore;
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
