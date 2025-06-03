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
    
    // Fase 1: Seleção Prioritária (Critérios com Peso > 0)
    const activeCriteria = this.getActiveCriteria();
    console.log('Critérios ativos (peso > 0):', activeCriteria);

    if (activeCriteria.length > 0) {
      const prioritizedSubjects = this.selectByActiveCriteria(electiveGroups, usedTimeSlots, activeCriteria);
      selected.push(...prioritizedSubjects);
      
      // Atualizar horários ocupados
      prioritizedSubjects.forEach(subject => {
        this.addTimeSlots(subject, usedTimeSlots);
      });
      
      console.log(`Fase 1 completada: ${prioritizedSubjects.length} matérias selecionadas por critérios ativos`);
    }

    // Fase 2: Preenchimento dos Horários Restantes
    const remainingSubjects = this.fillRemainingSlots(electiveGroups, usedTimeSlots, selected);
    selected.push(...remainingSubjects);
    
    console.log(`Fase 2 completada: ${remainingSubjects.length} matérias adicionais selecionadas`);

    return selected;
  }

  private getActiveCriteria(): string[] {
    const criteria: string[] = [];

    if (this.configuration.weightFriend > 0) {
      criteria.push('friend');
    }
    if (this.configuration.weightVacancies > 0) {
      criteria.push('vacancies');
    }
    if (this.configuration.weightDifficulty > 0) {
      criteria.push('difficulty');
    }

    return criteria;
  }

  private selectByActiveCriteria(
    electiveGroups: { [key: string]: Subject[] }, 
    usedTimeSlots: Set<string>,
    activeCriteria: string[]
  ): Subject[] {
    const selected: Subject[] = [];
    
    // Avaliar todas as matérias disponíveis
    const availableSubjects: { subject: Subject; code: string; criteriaMet: number; score: number }[] = [];
    
    for (const [code, subjects] of Object.entries(electiveGroups)) {
      for (const subject of subjects) {
        if (!this.hasTimeConflict(subject, usedTimeSlots)) {
          const evaluation = this.evaluateSubjectCriteria(subject, activeCriteria);
          if (evaluation.criteriaMet > 0) { // Só considera se atende pelo menos um critério
            availableSubjects.push({
              subject,
              code,
              criteriaMet: evaluation.criteriaMet,
              score: evaluation.score
            });
          }
        }
      }
    }
    
    // Ordenar por: 1) Número de critérios atendidos, 2) Score total
    availableSubjects.sort((a, b) => {
      if (b.criteriaMet !== a.criteriaMet) {
        return b.criteriaMet - a.criteriaMet;
      }
      return b.score - a.score;
    });
    
    console.log(`Matérias candidatas na Fase 1: ${availableSubjects.length}`);
    
    // Seleção gulosa: pegar a melhor matéria disponível de cada código
    const selectedCodes = new Set<string>();
    
    for (const candidate of availableSubjects) {
      if (!selectedCodes.has(candidate.code) && !this.hasTimeConflict(candidate.subject, usedTimeSlots)) {
        selected.push(candidate.subject);
        selectedCodes.add(candidate.code);
        this.addTimeSlots(candidate.subject, usedTimeSlots);
        
        console.log(`Selecionada (Fase 1): ${candidate.subject.name} - Critérios: ${candidate.criteriaMet}/${activeCriteria.length}, Score: ${candidate.score.toFixed(2)}`);
      }
    }

    return selected;
  }

  private evaluateSubjectCriteria(subject: Subject, activeCriteria: string[]): { criteriaMet: number; score: number } {
    let criteriaMet = 0;
    let score = 0;
    
    for (const criterion of activeCriteria) {
      let criterionMet = false;
      let criterionScore = 0;
      
      switch (criterion) {
        case 'friend':
          if (subject.hasFriend) {
            criteriaMet++;
            criterionMet = true;
            criterionScore = this.configuration.weightFriend;
          }
          break;
          
        case 'vacancies':
          const availableSpots = subject.capacity - subject.filledSpots;
          if (availableSpots > 0) {
            criteriaMet++;
            criterionMet = true;
            // Score proporcional às vagas disponíveis e peso do critério
            criterionScore = this.configuration.weightVacancies * availableSpots;
          }
          break;
          
        case 'difficulty':
          // Para dificuldade, menor nota = mais difícil = melhor se queremos dificuldade
          if (subject.difficulty <= 3) { // Consideramos 1-3 como "difícil"
            criteriaMet++;
            criterionMet = true;
            // Score maior para professores mais difíceis
            criterionScore = this.configuration.weightDifficulty * (4 - subject.difficulty);
          }
          break;
      }
      
      if (criterionMet) {
        score += criterionScore;
      }
    }
    
    return { criteriaMet, score };
  }

  private fillRemainingSlots(
    electiveGroups: { [key: string]: Subject[] }, 
    usedTimeSlots: Set<string>,
    alreadySelected: Subject[]
  ): Subject[] {
    const selected: Subject[] = [];
    const selectedCodes = new Set(alreadySelected.map(s => s.code));

    // Criar lista de todas as matérias restantes disponíveis
    const availableSubjects: { subject: Subject; code: string }[] = [];
    
    for (const [code, subjects] of Object.entries(electiveGroups)) {
      if (!selectedCodes.has(code)) {
        for (const subject of subjects) {
          if (!this.hasTimeConflict(subject, usedTimeSlots)) {
            availableSubjects.push({ subject, code });
          }
        }
      }
    }
    
    // Ordenar apenas por prioridade geral (calculada anteriormente)
    availableSubjects.sort((a, b) => (b.subject.priority || 0) - (a.subject.priority || 0));
    
    console.log(`Matérias candidatas na Fase 2: ${availableSubjects.length}`);
    
    // Seleção gulosa simples: primeira matéria disponível de cada código
    const processedCodes = new Set<string>();
    
    for (const candidate of availableSubjects) {
      if (!processedCodes.has(candidate.code) && !this.hasTimeConflict(candidate.subject, usedTimeSlots)) {
        selected.push(candidate.subject);
        processedCodes.add(candidate.code);
        this.addTimeSlots(candidate.subject, usedTimeSlots);
        
        console.log(`Selecionada (Fase 2): ${candidate.subject.name} - Prioridade: ${(candidate.subject.priority || 0).toFixed(2)}`);
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
