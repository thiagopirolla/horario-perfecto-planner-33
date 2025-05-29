import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, FormInput, TableIcon } from 'lucide-react';
import { Subject } from '@/types/schedule';
import SubjectTable from './SubjectTable';

interface SubjectFormProps {
  subjects: Subject[];
  onSubjectsChange: (subjects: Subject[]) => void;
}

const SubjectForm: React.FC<SubjectFormProps> = ({ subjects, onSubjectsChange }) => {
  const [newSubject, setNewSubject] = useState<Omit<Subject, 'id'>>({
    code: '',
    name: '',
    required: false,
    class: '',
    capacity: 40,
    filledSpots: 0,
    professor: '',
    difficulty: 3,
    hasFriend: false,
    schedule: '',
    hours: 2
  });

  const addSubject = () => {
    if (newSubject.code && newSubject.name && newSubject.schedule) {
      const subject: Subject = {
        ...newSubject,
        id: Date.now().toString()
      };
      onSubjectsChange([...subjects, subject]);
      setNewSubject({
        code: '',
        name: '',
        required: false,
        class: '',
        capacity: 40,
        filledSpots: 0,
        professor: '',
        difficulty: 3,
        hasFriend: false,
        schedule: '',
        hours: 2
      });
    }
  };

  const removeSubject = (id: string) => {
    onSubjectsChange(subjects.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="form" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="form" className="flex items-center gap-2">
            <FormInput className="w-4 h-4" />
            Formulário Individual
          </TabsTrigger>
          <TabsTrigger value="table" className="flex items-center gap-2">
            <TableIcon className="w-4 h-4" />
            Tabela em Lote
          </TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="space-y-6">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Adicionar Nova Matéria
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Código da Matéria</Label>
                  <Input
                    id="code"
                    value={newSubject.code}
                    onChange={(e) => setNewSubject({...newSubject, code: e.target.value})}
                    placeholder="Ex: MAT001"
                  />
                </div>
                <div>
                  <Label htmlFor="name">Nome da Matéria</Label>
                  <Input
                    id="name"
                    value={newSubject.name}
                    onChange={(e) => setNewSubject({...newSubject, name: e.target.value})}
                    placeholder="Ex: Cálculo I"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="class">Turma</Label>
                  <Input
                    id="class"
                    value={newSubject.class}
                    onChange={(e) => setNewSubject({...newSubject, class: e.target.value})}
                    placeholder="Ex: A"
                  />
                </div>
                <div>
                  <Label htmlFor="professor">Professor</Label>
                  <Input
                    id="professor"
                    value={newSubject.professor}
                    onChange={(e) => setNewSubject({...newSubject, professor: e.target.value})}
                    placeholder="Nome do professor"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="schedule">Horário (formato: Dia.HH-HH)</Label>
                <Input
                  id="schedule"
                  value={newSubject.schedule}
                  onChange={(e) => setNewSubject({...newSubject, schedule: e.target.value})}
                  placeholder="Ex: Seg.08-10, Qua.14-16"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Use: Seg, Ter, Qua, Qui, Sex para os dias da semana
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="capacity">Capacidade</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={newSubject.capacity}
                    onChange={(e) => setNewSubject({...newSubject, capacity: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="filledSpots">Vagas Preenchidas</Label>
                  <Input
                    id="filledSpots"
                    type="number"
                    value={newSubject.filledSpots}
                    onChange={(e) => setNewSubject({...newSubject, filledSpots: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div>
                <Label>Dificuldade do Professor: {newSubject.difficulty}</Label>
                <Slider
                  value={[newSubject.difficulty]}
                  onValueChange={(value) => setNewSubject({...newSubject, difficulty: value[0]})}
                  min={1}
                  max={5}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="required"
                    checked={newSubject.required}
                    onCheckedChange={(checked) => setNewSubject({...newSubject, required: checked})}
                  />
                  <Label htmlFor="required">Matéria Obrigatória</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="hasFriend"
                    checked={newSubject.hasFriend}
                    onCheckedChange={(checked) => setNewSubject({...newSubject, hasFriend: checked})}
                  />
                  <Label htmlFor="hasFriend">Tem Amigo na Turma</Label>
                </div>
              </div>

              <Button onClick={addSubject} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Matéria
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table">
          <SubjectTable 
            subjects={subjects}
            onSubjectsChange={onSubjectsChange}
          />
        </TabsContent>
      </Tabs>

      {subjects.length > 0 && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Matérias Cadastradas ({subjects.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subjects.map((subject) => (
                <div
                  key={subject.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">{subject.name} ({subject.code})</div>
                    <div className="text-sm text-muted-foreground">
                      Turma {subject.class} • {subject.schedule} • Prof. {subject.professor}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Vagas: {subject.capacity - subject.filledSpots}/{subject.capacity} • 
                      Dificuldade: {subject.difficulty}/5 •
                      {subject.hasFriend && ' Com amigo •'}
                      {subject.required && ' Obrigatória'}
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeSubject(subject.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SubjectForm;
