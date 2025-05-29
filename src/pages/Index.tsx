
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { CalendarDays, Settings, Play, BookOpen, Sparkles } from 'lucide-react';
import SubjectForm from '@/components/SubjectForm';
import ConfigurationPanel from '@/components/ConfigurationPanel';
import ScheduleTable from '@/components/ScheduleTable';
import { Subject, ScheduleConfiguration, OptimizedSchedule } from '@/types/schedule';
import { ScheduleOptimizer } from '@/utils/scheduleOptimizer';

const Index = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [configuration, setConfiguration] = useState<ScheduleConfiguration>({
    weightVacancies: 1.0,
    weightFriend: 5.0,
    weightDifficulty: 3.0,
    strategy: 'maximize',
    freeDays: ['Segunda', 'Sexta']
  });
  const [optimizedSchedule, setOptimizedSchedule] = useState<OptimizedSchedule | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const runOptimization = async () => {
    if (subjects.length === 0) {
      toast({
        title: "Nenhuma matéria cadastrada",
        description: "Adicione pelo menos uma matéria antes de otimizar.",
        variant: "destructive"
      });
      return;
    }

    setIsOptimizing(true);
    
    try {
      // Simular processamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const availableSlots = [
        'Seg.08-10', 'Seg.10-12', 'Seg.14-16', 'Seg.16-18', 'Seg.19-21', 'Seg.21-23',
        'Ter.08-10', 'Ter.10-12', 'Ter.14-16', 'Ter.16-18', 'Ter.19-21', 'Ter.21-23',
        'Qua.08-10', 'Qua.10-12', 'Qua.14-16', 'Qua.16-18', 'Qua.19-21', 'Qua.21-23',
        'Qui.08-10', 'Qui.10-12', 'Qui.14-16', 'Qui.16-18', 'Qui.19-21', 'Qui.21-23',
        'Sex.08-10', 'Sex.10-12', 'Sex.14-16', 'Sex.16-18', 'Sex.19-21', 'Sex.21-23'
      ];

      const optimizer = new ScheduleOptimizer(subjects, availableSlots, configuration);
      const result = optimizer.optimize();
      
      setOptimizedSchedule(result);
      
      toast({
        title: "Otimização concluída!",
        description: `${result.totalSubjects} matérias selecionadas com sucesso.`,
      });
      
    } catch (error) {
      console.error('Erro na otimização:', error);
      toast({
        title: "Erro na otimização",
        description: "Ocorreu um erro durante o processo de otimização.",
        variant: "destructive"
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="gradient-bg text-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-4">
              <CalendarDays className="w-12 h-12" />
              <h1 className="text-4xl md:text-5xl font-bold">OptSchedule</h1>
            </div>
            <p className="text-xl md:text-2xl mb-6 opacity-90">
              Otimização Inteligente de Horários Acadêmicos
            </p>
            <p className="text-lg opacity-80 max-w-2xl mx-auto">
              Use algoritmos de pesquisa operacional para encontrar a melhor combinação 
              de matérias e horários para seu semestre
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="subjects" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="subjects" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Matérias
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configuração
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              Resultado
            </TabsTrigger>
          </TabsList>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4" />
              <span>{subjects.length} matérias cadastradas</span>
            </div>
            <Button 
              onClick={runOptimization}
              disabled={isOptimizing || subjects.length === 0}
              size="lg"
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            >
              {isOptimizing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Otimizando...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Otimizar Horário
                </>
              )}
            </Button>
          </div>

          <TabsContent value="subjects" className="space-y-6">
            <SubjectForm 
              subjects={subjects}
              onSubjectsChange={setSubjects}
            />
          </TabsContent>

          <TabsContent value="config" className="space-y-6">
            <ConfigurationPanel
              configuration={configuration}
              onConfigurationChange={setConfiguration}
            />
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            <ScheduleTable schedule={optimizedSchedule} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
