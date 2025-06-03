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
    
    // Aplicar otimização respeitando obrigatórias primeiro e depois critérios de peso
    const optimizedSubjects = this.optimizeWithWeightedCriteria(subjectGroups);

    const conflicts = this.detectConflicts(optimizedSubjects);
    
    return {
      subjects: optimizedSubjects,
      totalSubjects: optimizedSubjects.length,
      conflicts
    };
  }

  private optimizeWithWeightedCriteria(subjectGroups: { [key: string]: Subject[] }): Subject[] {
    const unavailableSlots = this.configuration.unavailableSlots || [];
    console.log('Horários indisponíveis:', unavailableSlots);

    // Separar matérias obrigatórias e eletivas
    const requiredGroups: { [key: string]: Subject[] } = {};
    const electiveGroups: { [key: string]: Subject[] } = {};

    for (const [code, subjects] of Object.entries(subjectGroups)) {
      const filteredSubjects = subjects.filter(subject => 
        !this.hasConflictWithUnavailableSlots(subject, unavailableSlots)
      );

      const hasRequiredClass = subjects.some(subject => subject.required);
      
      if (hasRequiredClass) {
        requiredGroups[code] = filteredSubjects;
      } else {
        electiveGroups[code] = filteredSubjects;
      }
    }

    console.log('Matérias obrigatórias:', Object.keys(requiredGroups).length);
    console.log('Matérias eletivas:', Object.keys(electiveGroups).length);

    // Primeiro, garantir todas as matérias obrigatórias
    const selectedSubjects = this.selectRequiredSubjects(requiredGroups);
    console.log('Matérias obrigatórias selecionadas:', selectedSubjects.length);

    // Calcular horários já utilizados
    const usedTimeSlots = new Set<string>();
    selectedSubjects.forEach(subject => {
      this.addTimeSlots(subject, usedTimeSlots);
    });

    // Aplicar seleção baseada em pesos para eletivas
    const additionalElectives = this.selectElectivesByWeights(electiveGroups, usedTimeSlots);
    console.log('Matérias eletivas adicionais:', additionalElectives.length);

    return [...selectedSubjects, ...additionalElectives];
  }

  private selectElectivesByWeights(electiveGroups: { [key: string]: Subject[] }, usedTimeSlots: Set<string>): Subject[] {
    const selected: Subject[] = [];
    
    // Identificar critérios com pesos altos (>= 7.0)
    const highWeightCriteria = this.getHighWeightCriteria();
    console.log('Critérios com peso alto:', highWeightCriteria);

    if (highWeightCriteria.length > 0) {
      // Primeira passada: tentar maximizar critérios com pesos altos
      const prioritizedSubjects = this.selectByHighWeightCriteria(electiveGroups, usedTimeSlots, highWeightCriteria);
      selected.push(...prioritizedSubjects);
      
      // Atualizar horários ocupados
      prioritizedSubjects.forEach(subject => {
        this.addTimeSlots(subject, usedTimeSlots);
      });
    }

    // Segunda passada: preencher horários restantes com qualquer matéria disponível
    const remainingSubjects = this.selectRemainingSubjects(electiveGroups, usedTimeSlots, selected);
    selected.push(...remainingSubjects);

    return selected;
  }

  private getHighWeightCriteria(): string[] {
    const criteria: string[] = [];
    const threshold = 7.0;

    if (this.configuration.weightFriend >= threshold) {
      criteria.push('friend');
    }
    if (this.configuration.weightVacancies >= threshold) {
      criteria.push('vacancies');
    }
    if (this.configuration.weightDifficulty >= threshold) {
      criteria.push('difficulty');
    }

    return criteria;
  }

  private selectByHighWeightCriteria(
    electiveGroups: { [key: string]: Subject[] }, 
    usedTimeSlots: Set<string>,
    criteria: string[]
  ): Subject[] {
    const selected: Subject[] = [];
    
    // Criar lista de códigos ordenados por quão bem atendem aos critérios de peso alto
    const sortedCodes = Object.keys(electiveGroups).sort((a, b) => {
      const scoreA = this.calculateHighWeightScore(electiveGroups[a], criteria);
      const scoreB = this.calculateHighWeightScore(electiveGroups[b], criteria);
      return scoreB - scoreA;
    });

    for (const code of sortedCodes) {
      if (selected.some(s => s.code === code)) continue; // Já selecionada

      const subjects = electiveGroups[code];
      
      // Ordenar turmas da matéria por prioridade geral
      subjects.sort((a, b) => (b.priority || 0) - (a.priority || 0));
      
      for (const subject of subjects) {
        if (!this.hasTimeConflict(subject, usedTimeSlots)) {
          // Verificar se a turma atende aos critérios de peso alto
          if (this.meetsHighWeightCriteria(subject, criteria)) {
            selected.push(subject);
            this.addTimeSlots(subject, usedTimeSlots);
            console.log(`Selecionada por critério de peso alto: ${subject.name} (${subject.class})`);
            break;
          }
        }
      }
    }

    return selected;
  }

  private calculateHighWeightScore(subjects: Subject[], criteria: string[]): number {
    let bestScore = 0;
    
    for (const subject of subjects) {
      let score = 0;
      
      if (criteria.includes('friend') && subject.hasFriend) {
        score += this.configuration.weightFriend;
      }
      
      if (criteria.includes('vacancies')) {
        const availableSpots = subject.capacity - subject.filledSpots;
        if (availableSpots > 0) {
          score += this.configuration.weightVacancies * availableSpots;
        }
      }
      
      if (criteria.includes('difficulty')) {
        // Dificuldade alta = nota baixa do professor (mais difícil)
        score += this.configuration.weightDifficulty * (6 - subject.difficulty);
      }
      
      bestScore = Math.max(bestScore, score);
    }
    
    return bestScore;
  }

  private meetsHighWeightCriteria(subject: Subject, criteria: string[]): boolean {
    for (const criterion of criteria) {
      switch (criterion) {
        case 'friend':
          if (!subject.hasFriend) return false;
          break;
        case 'vacancies':
          const availableSpots = subject.capacity - subject.filledSpots;
          if (availableSpots <= 0) return false;
          break;
        case 'difficulty':
          // Para peso alto de dificuldade, queremos professores difíceis (nota baixa)
          if (subject.difficulty >= 4) return false; // Notas 4 e 5 são consideradas "fáceis"
          break;
      }
    }
    return true;
  }

  private selectRemainingSubjects(
    electiveGroups: { [key: string]: Subject[] }, 
    usedTimeSlots: Set<string>,
    alreadySelected: Subject[]
  ): Subject[] {
    const selected: Subject[] = [];
    const selectedCodes = new Set(alreadySelected.map(s => s.code));

    // Ordenar códigos por prioridade geral das melhores turmas
    const sortedCodes = Object.keys(electiveGroups)
      .filter(code => !selectedCodes.has(code))
      .sort((a, b) => {
        const maxPriorityA = Math.max(...electiveGroups[a].map(s => s.priority || 0));
        const maxPriorityB = Math.max(...electiveGroups[b].map(s => s.priority || 0));
        return maxPriorityB - maxPriorityA;
      });

    for (const code of sortedCodes) {
      const subjects = electiveGroups[code];
      
      // Ordenar turmas por prioridade
      subjects.sort((a, b) => (b.priority || 0) - (a.priority || 0));
      
      for (const subject of subjects) {
        if (!this.hasTimeConflict(subject, usedTimeSlots)) {
          selected.push(subject);
          this.addTimeSlots(subject, usedTimeSlots);
          console.log(`Preenchimento restante: ${subject.name} (${subject.class})`);
          break;
        }
      }
    }

    return selected;
  }

  private selectRequiredSubjects(requiredGroups: { [key: string]: Subject[] }): Subject[] {
    const requiredCodes = Object.keys(requiredGroups);
    
    // Tentar todas as combinações possíveis de turmas obrigatórias
    let bestCombination: Subject[] = [];
    let maxSubjects = 0;

    const generateRequiredCombinations = (codeIndex: number, currentCombination: Subject[]): void => {
      if (codeIndex === requiredCodes.length) {
        // Verificar se a combinação atual é válida (sem conflitos)
        if (this.isValidCombination(currentCombination)) {
          if (currentCombination.length > maxSubjects) {
            maxSubjects = currentCombination.length;
            bestCombination = [...currentCombination];
            console.log('Nova melhor combinação de obrigatórias:', maxSubjects, 'matérias');
          }
        }
        return;
      }

      const currentCode = requiredCodes[codeIndex];
      const subjects = requiredGroups[currentCode];

      // Ordenar turmas por prioridade
      subjects.sort((a, b) => (b.priority || 0) - (a.priority || 0));

      // Tentar com cada turma desta matéria obrigatória
      for (const subject of subjects) {
        generateRequiredCombinations(codeIndex + 1, [...currentCombination, subject]);
      }

      // Se não conseguir encaixar nenhuma turma desta matéria obrigatória,
      // continuar sem ela (isso pode acontecer se houver conflitos irreconciliáveis)
      generateRequiredCombinations(codeIndex + 1, currentCombination);
    };

    generateRequiredCombinations(0, []);
    
    console.log('Combinação final de obrigatórias:', bestCombination.length, 'de', requiredCodes.length, 'matérias');
    return bestCombination;
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

  private isValidCombination(subjects: Subject[]): boolean {
    const usedTimeSlots = new Set<string>();

    for (const subject of subjects) {
      const timeSlots = this.parseSchedule(subject.schedule);
      
      for (const slot of timeSlots) {
        for (let hour = slot.startTime; hour < slot.endTime; hour += 2) {
          const slotKey = `${this.getDayAbbreviation(slot.day)}.${hour.toString().padStart(2, '0')}-${(hour + 2).toString().padStart(2, '0')}`;
          
          if (usedTimeSlots.has(slotKey)) {
            return false; // Conflito encontrado
          }
          usedTimeSlots.add(slotKey);
        }
      }
    }

    return true; // Nenhum conflito
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
