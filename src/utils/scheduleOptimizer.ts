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
    
    // Usar estratégia baseada no peso dos amigos
    const bestCombination = this.shouldUseFriendsFirstStrategy() 
      ? this.findOptimalCombinationWithFriendsFirst(subjectGroups)
      : this.findOptimalCombination(subjectGroups);

    const conflicts = this.detectConflicts(bestCombination);
    
    return {
      subjects: bestCombination,
      totalSubjects: bestCombination.length,
      conflicts
    };
  }

  private shouldUseFriendsFirstStrategy(): boolean {
    // Ativar estratégia de amigos primeiro quando o peso for >= 5
    return this.configuration.weightFriend >= 5;
  }

  private findOptimalCombinationWithFriendsFirst(subjectGroups: { [key: string]: Subject[] }): Subject[] {
    const unavailableSlots = this.configuration.unavailableSlots || [];
    console.log('Usando estratégia de amigos primeiro - Peso:', this.configuration.weightFriend);

    // Filtrar matérias que conflitam com horários indisponíveis
    const filteredGroups: { [key: string]: Subject[] } = {};
    for (const [code, subjects] of Object.entries(subjectGroups)) {
      filteredGroups[code] = subjects.filter(subject => 
        !this.hasConflictWithUnavailableSlots(subject, unavailableSlots)
      );
    }

    // Separar matérias com amigos e sem amigos
    const friendGroups: { [key: string]: Subject[] } = {};
    const nonFriendGroups: { [key: string]: Subject[] } = {};

    for (const [code, subjects] of Object.entries(filteredGroups)) {
      const friendSubjects = subjects.filter(s => s.hasFriend);
      const nonFriendSubjects = subjects.filter(s => !s.hasFriend);
      
      if (friendSubjects.length > 0) {
        friendGroups[code] = friendSubjects;
      }
      if (nonFriendSubjects.length > 0) {
        nonFriendGroups[code] = nonFriendSubjects;
      }
    }

    console.log(`Matérias com amigos: ${Object.keys(friendGroups).length}`);
    console.log(`Matérias sem amigos: ${Object.keys(nonFriendGroups).length}`);

    // FASE 1: Otimizar matérias com amigos
    const friendsCombination = this.findBestCombinationForGroups(friendGroups, 'amigos');
    const usedSlots = new Set<string>();
    
    for (const subject of friendsCombination) {
      this.addTimeSlots(subject, usedSlots);
    }

    console.log(`Fase 1 concluída: ${friendsCombination.length} matérias com amigos selecionadas`);

    // FASE 2: Preencher horários restantes com outras matérias
    // Calcular intensidade da estratégia baseada no peso (0-1)
    const strategyIntensity = Math.min(this.configuration.weightFriend / 10, 1);
    
    let finalCombination = [...friendsCombination];
    
    if (strategyIntensity < 1) {
      // Se não for peso máximo, permitir substituições se melhorarem significativamente o resultado
      const alternativeCombination = this.findBestAlternativeWithMixedStrategy(
        filteredGroups, 
        strategyIntensity
      );
      
      if (alternativeCombination.length > finalCombination.length * (1 + (1 - strategyIntensity) * 0.5)) {
        console.log('Usando combinação alternativa por ter significativamente mais matérias');
        finalCombination = alternativeCombination;
      } else {
        // Complementar com matérias sem amigos nos horários livres
        const remainingGroups = this.filterGroupsByAvailableSlots(nonFriendGroups, usedSlots);
        const additionalSubjects = this.findBestCombinationForGroups(remainingGroups, 'complemento');
        finalCombination = [...friendsCombination, ...additionalSubjects];
      }
    } else {
      // Peso máximo: apenas complementar com matérias sem amigos
      const remainingGroups = this.filterGroupsByAvailableSlots(nonFriendGroups, usedSlots);
      const additionalSubjects = this.findBestCombinationForGroups(remainingGroups, 'complemento');
      finalCombination = [...friendsCombination, ...additionalSubjects];
    }

    console.log(`Combinação final: ${finalCombination.length} matérias (${finalCombination.filter(s => s.hasFriend).length} com amigos)`);
    
    return finalCombination;
  }

  private findBestAlternativeWithMixedStrategy(subjectGroups: { [key: string]: Subject[] }, strategyIntensity: number): Subject[] {
    // Usar algoritmo original com boost para matérias com amigos
    const originalWeightFriend = this.configuration.weightFriend;
    this.configuration.weightFriend = originalWeightFriend * (1 + strategyIntensity);
    
    const result = this.findOptimalCombination(subjectGroups);
    
    // Restaurar peso original
    this.configuration.weightFriend = originalWeightFriend;
    
    return result;
  }

  private filterGroupsByAvailableSlots(groups: { [key: string]: Subject[] }, usedSlots: Set<string>): { [key: string]: Subject[] } {
    const filteredGroups: { [key: string]: Subject[] } = {};
    
    for (const [code, subjects] of Object.entries(groups)) {
      const availableSubjects = subjects.filter(subject => !this.hasTimeConflict(subject, usedSlots));
      if (availableSubjects.length > 0) {
        filteredGroups[code] = availableSubjects;
      }
    }
    
    return filteredGroups;
  }

  private findBestCombinationForGroups(subjectGroups: { [key: string]: Subject[] }, phase: string): Subject[] {
    const subjectCodes = Object.keys(subjectGroups);
    console.log(`Otimizando ${phase}: ${subjectCodes.length} grupos de matérias`);

    if (subjectCodes.length === 0) return [];

    let bestCombination: Subject[] = [];
    let bestScore = -Infinity;

    const backtrack = (codeIndex: number, currentCombination: Subject[], usedSlots: Set<string>) => {
      if (codeIndex === subjectCodes.length) {
        const score = this.calculateCombinationScore(currentCombination);
        
        if (score > bestScore) {
          bestScore = score;
          bestCombination = [...currentCombination];
        }
        return;
      }

      const currentCode = subjectCodes[codeIndex];
      const availableSubjects = subjectGroups[currentCode];

      // Não selecionar nenhuma turma desta matéria
      backtrack(codeIndex + 1, currentCombination, usedSlots);

      // Tentar cada turma disponível
      for (const subject of availableSubjects) {
        if (!this.hasTimeConflict(subject, usedSlots)) {
          const newUsedSlots = new Set(usedSlots);
          this.addTimeSlots(subject, newUsedSlots);
          
          backtrack(codeIndex + 1, [...currentCombination, subject], newUsedSlots);
        }
      }
    };

    backtrack(0, [], new Set<string>());
    
    console.log(`${phase}: ${bestCombination.length} matérias selecionadas (score: ${bestScore.toFixed(2)})`);
    return bestCombination;
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

      // Score baseado na dificuldade individual (CORRIGIDO: maior dificuldade = melhor quando peso é alto)
      subjectScore += this.configuration.weightDifficulty * subject.difficulty;

      totalScore += subjectScore;
    }

    // Bonus adicional para média de dificuldade alta quando o peso é significativo
    if (this.configuration.weightDifficulty > 0 && combination.length > 0) {
      const averageDifficulty = combination.reduce((sum, s) => sum + s.difficulty, 0) / combination.length;
      // CORRIGIDO: Bonus baseado na média geral de dificuldade da combinação (maior = melhor)
      const difficultyBonus = this.configuration.weightDifficulty * averageDifficulty * combination.length * 0.1;
      totalScore += difficultyBonus;
      
      // Log para debug
      console.log(`Combinação: ${combination.length} matérias, Média dificuldade: ${averageDifficulty.toFixed(2)}, Bonus: ${difficultyBonus.toFixed(2)}`);
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
