
import { Subject } from '@/types/schedule';

export const exportSubjectsToCSV = (subjects: Subject[]): string => {
  if (subjects.length === 0) return '';
  
  const headers = [
    'code',
    'name', 
    'required',
    'class',
    'capacity',
    'filledSpots',
    'professor',
    'difficulty',
    'hasFriend',
    'schedule',
    'hours'
  ];
  
  const csvContent = [
    headers.join(','),
    ...subjects.map(subject => [
      subject.code,
      `"${subject.name}"`, // Aspas para nomes com vírgulas
      subject.required,
      subject.class,
      subject.capacity,
      subject.filledSpots,
      `"${subject.professor}"`, // Aspas para nomes com vírgulas
      subject.difficulty,
      subject.hasFriend,
      `"${subject.schedule}"`, // Aspas para horários com vírgulas
      subject.hours
    ].join(','))
  ].join('\n');
  
  return csvContent;
};

export const downloadCSV = (content: string, filename: string = 'materias.csv') => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const parseCSVToSubjects = (csvContent: string): Subject[] => {
  const lines = csvContent.trim().split('\n');
  
  if (lines.length < 2) return [];
  
  // Pular o cabeçalho
  const dataLines = lines.slice(1);
  
  const subjects: Subject[] = [];
  
  for (const line of dataLines) {
    try {
      // Parse CSV considerando aspas
      const values = parseCSVLine(line);
      
      if (values.length >= 11) {
        const subject: Subject = {
          id: Date.now().toString() + Math.random().toString(),
          code: values[0].trim(),
          name: values[1].trim(),
          required: values[2].toLowerCase() === 'true',
          class: values[3].trim(),
          capacity: parseInt(values[4]) || 40,
          filledSpots: parseInt(values[5]) || 0,
          professor: values[6].trim(),
          difficulty: parseInt(values[7]) || 3,
          hasFriend: values[8].toLowerCase() === 'true',
          schedule: values[9].trim(),
          hours: parseInt(values[10]) || 2
        };
        
        // Validar se tem pelo menos código, nome e horário
        if (subject.code && subject.name && subject.schedule) {
          subjects.push(subject);
        }
      }
    } catch (error) {
      console.warn('Erro ao processar linha CSV:', line, error);
    }
  }
  
  return subjects;
};

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
};
