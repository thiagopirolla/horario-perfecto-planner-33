
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Plus, Trash2, Copy, Save } from 'lucide-react';
import { Subject } from '@/types/schedule';
import TimeSlotSelector from './TimeSlotSelector';

interface MultipleClassFormProps {
  subjects: Subject[];
  onSubjectsChange: (subjects: Subject[]) => void;
}

interface ClassData {
  id: string;
  class: string;
  professor: string;
  schedule: string;
  capacity: number;
  filledSpots: number;
  difficulty: number;
  hasFriend: boolean;
}

const MultipleClassForm: React.FC<MultipleClassFormProps> = ({ subjects, onSubjectsChange }) => {
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [required, setRequired] = useState(false);
  const [hours, setHours] = useState(2);
  
  const [classes, setClasses] = useState<ClassData[]>([
    {
      id: '1',
      class: '',
      professor: '',
      schedule: '',
      capacity: 40,
      filledSpots: 0,
      difficulty: 3,
      hasFriend: false
    }
  ]);

  const addClassRow = () => {
    const newClass: ClassData = {
      id: Date.now().toString(),
      class: '',
      professor: '',
      schedule: '',
      capacity: 40,
      filledSpots: 0,
      difficulty: 3,
      hasFriend: false
    };
    setClasses([...classes, newClass]);
  };

  const removeClassRow = (id: string) => {
    if (classes.length > 1) {
      setClasses(classes.filter(c => c.id !== id));
    }
  };

  const updateClass = (id: string, field: keyof ClassData, value: any) => {
    setClasses(classes.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const saveAllClasses = () => {
    if (!subjectCode || !subjectName) {
      return;
    }

    const validClasses = classes.filter(c => 
      c.class.trim() && c.professor.trim() && c.schedule.trim()
    );

    if (validClasses.length === 0) {
      return;
    }

    const newSubjects: Subject[] = validClasses.map(classData => ({
      id: Date.now().toString() + Math.random().toString(),
      code: subjectCode,
      name: subjectName,
      required: required,
      class: classData.class,
      capacity: classData.capacity,
      filledSpots: classData.filledSpots,
      professor: classData.professor,
      difficulty: classData.difficulty,
      hasFriend: classData.hasFriend,
      schedule: classData.schedule,
      hours: hours
    }));

    onSubjectsChange([...subjects, ...newSubjects]);

    // Reset form
    setSubjectCode('');
    setSubjectName('');
    setRequired(false);
    setHours(2);
    setClasses([
      {
        id: Date.now().toString(),
        class: '',
        professor: '',
        schedule: '',
        capacity: 40,
        filledSpots: 0,
        difficulty: 3,
        hasFriend: false
      }
    ]);
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Copy className="w-5 h-5" />
          Cadastrar Múltiplas Turmas da Mesma Matéria
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Preencha os dados gerais da matéria uma vez e adicione quantas turmas quiser
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Dados gerais da matéria */}
        <div className="border rounded-lg p-4 bg-slate-50">
          <h3 className="font-medium mb-4">Dados Gerais da Matéria</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="subject-code">Código da Matéria</Label>
              <Input
                id="subject-code"
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value)}
                placeholder="Ex: MAT001"
              />
            </div>
            <div>
              <Label htmlFor="subject-name">Nome da Matéria</Label>
              <Input
                id="subject-name"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="Ex: Cálculo I"
              />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="subject-required"
                checked={required}
                onCheckedChange={setRequired}
              />
              <Label htmlFor="subject-required">Matéria Obrigatória</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="subject-hours">Horas:</Label>
              <Input
                id="subject-hours"
                type="number"
                value={hours}
                onChange={(e) => setHours(parseInt(e.target.value) || 2)}
                className="w-20"
              />
            </div>
          </div>
        </div>

        {/* Turmas */}
        <div>
          <h3 className="font-medium mb-4">Turmas</h3>
          <div className="space-y-4">
            {classes.map((classData) => (
              <div key={classData.id} className="border rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <Label htmlFor={`class-${classData.id}`}>Turma</Label>
                    <Input
                      id={`class-${classData.id}`}
                      value={classData.class}
                      onChange={(e) => updateClass(classData.id, 'class', e.target.value)}
                      placeholder="A, B, C..."
                    />
                  </div>
                  <div>
                    <Label htmlFor={`professor-${classData.id}`}>Professor</Label>
                    <Input
                      id={`professor-${classData.id}`}
                      value={classData.professor}
                      onChange={(e) => updateClass(classData.id, 'professor', e.target.value)}
                      placeholder="Nome do professor"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`schedule-${classData.id}`}>Horário</Label>
                    <TimeSlotSelector
                      value={classData.schedule}
                      onChange={(schedule) => updateClass(classData.id, 'schedule', schedule)}
                      placeholder="Ex: Seg.08-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor={`capacity-${classData.id}`}>Capacidade</Label>
                    <Input
                      id={`capacity-${classData.id}`}
                      type="number"
                      value={classData.capacity}
                      onChange={(e) => updateClass(classData.id, 'capacity', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`filled-${classData.id}`}>Vagas Preenchidas</Label>
                    <Input
                      id={`filled-${classData.id}`}
                      type="number"
                      value={classData.filledSpots}
                      onChange={(e) => updateClass(classData.id, 'filledSpots', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <Label>Dificuldade do Professor: {classData.difficulty}</Label>
                  <Slider
                    value={[classData.difficulty]}
                    onValueChange={(value) => updateClass(classData.id, 'difficulty', value[0])}
                    min={1}
                    max={5}
                    step={1}
                    className="mt-2"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={classData.hasFriend}
                      onCheckedChange={(checked) => updateClass(classData.id, 'hasFriend', checked)}
                    />
                    <Label>Tem Amigo na Turma</Label>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeClassRow(classData.id)}
                    disabled={classes.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={addClassRow} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Turma
            </Button>
            <Button onClick={saveAllClasses}>
              <Save className="w-4 h-4 mr-2" />
              Salvar Todas as Turmas
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MultipleClassForm;
