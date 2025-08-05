import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Star, Heart } from 'lucide-react';
import { OptimizedSchedule } from '@/types/schedule';
interface ScheduleTableProps {
  schedule: OptimizedSchedule | null;
}
const ScheduleTable: React.FC<ScheduleTableProps> = ({
  schedule
}) => {
  const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
  const timeSlots = ['08-10', '10-12', '14-16', '16-18', '19-21', '21-23'];
  const parseScheduleForTable = () => {
    const tableData: {
      [key: string]: {
        [key: string]: any;
      };
    } = {};

    // Inicializar tabela vazia
    timeSlots.forEach(time => {
      tableData[time] = {};
      days.forEach(day => {
        tableData[time][day] = null;
      });
    });
    if (!schedule?.subjects) return tableData;

    // Preencher com as matérias otimizadas
    schedule.subjects.forEach(subject => {
      const timeSlots = parseSubjectSchedule(subject.schedule);
      timeSlots.forEach(slot => {
        for (let hour = slot.startTime; hour < slot.endTime; hour += 2) {
          const timeKey = `${hour.toString().padStart(2, '0')}-${(hour + 2).toString().padStart(2, '0')}`;
          if (tableData[timeKey] && tableData[timeKey][slot.day] === null) {
            tableData[timeKey][slot.day] = subject;
          }
        }
      });
    });
    return tableData;
  };
  const parseSubjectSchedule = (scheduleStr: string) => {
    const dayMap: {
      [key: string]: string;
    } = {
      'Seg': 'Segunda',
      'Ter': 'Terça',
      'Qua': 'Quarta',
      'Qui': 'Quinta',
      'Sex': 'Sexta'
    };
    const timeSlots: {
      day: string;
      startTime: number;
      endTime: number;
    }[] = [];
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
        timeSlots.push({
          day,
          startTime,
          endTime
        });
      }
    }
    return timeSlots;
  };
  const calculateAverageGrade = () => {
    if (!schedule?.subjects || schedule.subjects.length === 0) return 0;
    const totalGrade = schedule.subjects.reduce((sum, subject) => sum + subject.difficulty, 0);
    return (totalGrade / schedule.subjects.length).toFixed(1);
  };
  const countSubjectsWithFriend = () => {
    if (!schedule?.subjects) return 0;
    return schedule.subjects.filter(subject => subject.hasFriend).length;
  };
  const tableData = parseScheduleForTable();
  if (!schedule) {
    return <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Grade Horária Otimizada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-12">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Execute a otimização para visualizar sua grade horária</p>
          </div>
        </CardContent>
      </Card>;
  }
  return <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Matérias Selecionadas</p>
                <p className="text-2xl font-bold">{schedule.totalSubjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Média de facilidade</p>
                <p className="text-2xl font-bold">{calculateAverageGrade()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500" />
              <div>
                <p className="text-sm text-muted-foreground">Matérias com Amigo</p>
                <p className="text-2xl font-bold">{countSubjectsWithFriend()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Horários */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Grade Horária Otimizada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 bg-muted font-medium">Horário</th>
                  {days.map(day => <th key={day} className="border p-2 bg-muted font-medium min-w-[150px]">
                      {day}
                    </th>)}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map(time => <tr key={time}>
                    <td className="border p-2 font-medium bg-muted/50">
                      {time}
                    </td>
                    {days.map(day => {
                  const subject = tableData[time][day];
                  return <td key={`${time}-${day}`} className="border p-2 h-20">
                          {subject ? <div className="space-y-1">
                              <div className="font-medium text-sm">{subject.name}</div>
                              <div className="text-xs text-muted-foreground">
                                Turma {subject.class} • Prof. {subject.professor}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Facilidade: {subject.difficulty}/5
                              </div>
                              <div className="flex gap-1 flex-wrap">
                                {subject.required && <Badge variant="destructive" className="text-xs">
                                    Obr.
                                  </Badge>}
                                {subject.hasFriend && <Badge variant="secondary" className="text-xs">
                                    Amigo
                                  </Badge>}
                              </div>
                            </div> : <div className="text-center text-muted-foreground">-</div>}
                        </td>;
                })}
                  </tr>)}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Matérias Selecionadas */}
      <Card>
        <CardHeader>
          <CardTitle>Matérias Selecionadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {schedule.subjects.map(subject => <div key={subject.id} className="p-3 bg-muted rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium">{subject.name} ({subject.code})</div>
                    <div className="text-sm text-muted-foreground">
                      Turma {subject.class} • {subject.schedule} • Prof. {subject.professor}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Vagas: {subject.capacity - subject.filledSpots}/{subject.capacity} • 
                      Facilidade: {subject.difficulty}/5 •
                      Prioridade: {subject.priority?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {subject.required && <Badge variant="destructive">Obrigatória</Badge>}
                    {subject.hasFriend && <Badge variant="secondary">Com Amigo</Badge>}
                  </div>
                </div>
              </div>)}
          </div>
        </CardContent>
      </Card>
    </div>;
};
export default ScheduleTable;
