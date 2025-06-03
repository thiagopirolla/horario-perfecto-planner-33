import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus, Trash2, FormInput, TableIcon, Edit, Copy } from 'lucide-react';
import { Subject } from '@/types/schedule';
import { toast } from '@/hooks/use-toast';
import SubjectTable from './SubjectTable';
import TimeSlotSelector from './TimeSlotSelector';
import MultipleClassForm from './MultipleClassForm';

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
    hours: 2,
    grade: undefined // Nova propriedade para nota
  });

  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const validateRequiredFields = (subject: Omit<Subject, 'id'>) => {
    const missingFields = [];
    
    if (!subject.code.trim()) missingFields.push('Código da Matéria');
    if (!subject.name.trim()) missingFields.push('Nome da Matéria');
    if (!subject.schedule.trim()) missingFields.push('Horário');
    
    return missingFields;
  };

  const addSubject = () => {
    const missingFields = validateRequiredFields(newSubject);
    
    if (missingFields.length > 0) {
      toast({
        title: "Campos obrigatórios não preenchidos",
        description: `Por favor, preencha: ${missingFields.join(', ')}`,
        variant: "destructive"
      });
      return;
    }

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
      hours: 2,
      grade: undefined // Reset nota
    });
    
    toast({
      title: "Matéria adicionada com sucesso!",
      description: `${subject.name} foi cadastrada.`
    });
  };

  const removeSubject = (id: string) => {
    onSubjectsChange(subjects.filter(s => s.id !== id));
  };

  const startEditing = (subject: Subject) => {
    setEditingSubject(subject);
  };

  const saveEdit = () => {
    if (!editingSubject) return;
    
    const missingFields = validateRequiredFields(editingSubject);
    
    if (missingFields.length > 0) {
      toast({
        title: "Campos obrigatórios não preenchidos",
        description: `Por favor, preencha: ${missingFields.join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    onSubjectsChange(subjects.map(s => s.id === editingSubject.id ? editingSubject : s));
    setEditingSubject(null);
    
    toast({
      title: "Matéria atualizada com sucesso!",
      description: `${editingSubject.name} foi atualizada.`
    });
  };

  const cancelEdit = () => {
    setEditingSubject(null);
  };

  // Função para agrupar matérias por código e nome
  const groupSubjectsByCodeAndName = (subjects: Subject[]) => {
    const groups: { [key: string]: Subject[] } = {};
    
    subjects.forEach(subject => {
      const key = `${subject.code}-${subject.name}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(subject);
    });
    
    return groups;
  };

  const groupedSubjects = groupSubjectsByCodeAndName(subjects);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="form" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="form" className="flex items-center gap-2">
            <FormInput className="w-4 h-4" />
            Individual
          </TabsTrigger>
          <TabsTrigger value="multiple" className="flex items-center gap-2">
            <Copy className="w-4 h-4" />
            Múltiplas Turmas
          </TabsTrigger>
          <TabsTrigger value="table" className="flex items-center gap-2">
            <TableIcon className="w-4 h-4" />
            Tabela
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
                  <Label htmlFor="code">Código da Matéria *</Label>
                  <Input
                    id="code"
                    value={newSubject.code}
                    onChange={(e) => setNewSubject({...newSubject, code: e.target.value})}
                    placeholder="Ex: MAT001"
                  />
                </div>
                <div>
                  <Label htmlFor="name">Nome da Matéria *</Label>
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
                  <Label htmlFor="grade">Nota Esperada</Label>
                  <Input
                    id="grade"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={newSubject.grade || ''}
                    onChange={(e) => setNewSubject({...newSubject, grade: e.target.value ? parseFloat(e.target.value) : undefined})}
                    placeholder="Ex: 8.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="professor">Professor</Label>
                  <Input
                    id="professor"
                    value={newSubject.professor}
                    onChange={(e) => setNewSubject({...newSubject, professor: e.target.value})}
                    placeholder="Nome do professor"
                  />
                </div>
                <div>
                  <Label htmlFor="hours">Carga Horária</Label>
                  <Input
                    id="hours"
                    type="number"
                    value={newSubject.hours}
                    onChange={(e) => setNewSubject({...newSubject, hours: parseInt(e.target.value) || 2})}
                    placeholder="Ex: 2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="schedule">Horário *</Label>
                <TimeSlotSelector
                  value={newSubject.schedule}
                  onChange={(schedule) => setNewSubject({...newSubject, schedule})}
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

        <TabsContent value="multiple">
          <MultipleClassForm 
            subjects={subjects}
            onSubjectsChange={onSubjectsChange}
          />
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
            <Accordion type="multiple" className="w-full">
              {Object.entries(groupedSubjects).map(([key, subjectGroup]) => {
                const firstSubject = subjectGroup[0];
                return (
                  <AccordionItem key={key} value={key}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex flex-col items-start text-left">
                        <div className="font-medium">
                          {firstSubject.name} ({firstSubject.code})
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {subjectGroup.length} turma(s) cadastrada(s)
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-2">
                        {subjectGroup.map((subject) => (
                          <div
                            key={subject.id}
                            className="flex items-center justify-between p-3 bg-muted rounded-lg"
                          >
                            {editingSubject?.id === subject.id ? (
                              <div className="flex-1 space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label htmlFor="edit-code">Código *</Label>
                                    <Input
                                      id="edit-code"
                                      value={editingSubject.code}
                                      onChange={(e) => setEditingSubject({...editingSubject, code: e.target.value})}
                                      placeholder="Código"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-name">Nome *</Label>
                                    <Input
                                      id="edit-name"
                                      value={editingSubject.name}
                                      onChange={(e) => setEditingSubject({...editingSubject, name: e.target.value})}
                                      placeholder="Nome"
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label htmlFor="edit-class">Turma</Label>
                                    <Input
                                      id="edit-class"
                                      value={editingSubject.class}
                                      onChange={(e) => setEditingSubject({...editingSubject, class: e.target.value})}
                                      placeholder="Turma"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-professor">Professor</Label>
                                    <Input
                                      id="edit-professor"
                                      value={editingSubject.professor}
                                      onChange={(e) => setEditingSubject({...editingSubject, professor: e.target.value})}
                                      placeholder="Professor"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Label htmlFor="edit-schedule">Horário *</Label>
                                  <TimeSlotSelector
                                    value={editingSubject.schedule}
                                    onChange={(schedule) => setEditingSubject({...editingSubject, schedule})}
                                    placeholder="Horário"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label htmlFor="edit-capacity">Capacidade</Label>
                                    <Input
                                      id="edit-capacity"
                                      type="number"
                                      value={editingSubject.capacity}
                                      onChange={(e) => setEditingSubject({...editingSubject, capacity: parseInt(e.target.value) || 0})}
                                      placeholder="Capacidade"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-filled">Preenchidas</Label>
                                    <Input
                                      id="edit-filled"
                                      type="number"
                                      value={editingSubject.filledSpots}
                                      onChange={(e) => setEditingSubject({...editingSubject, filledSpots: parseInt(e.target.value) || 0})}
                                      placeholder="Preenchidas"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Label>Dificuldade: {editingSubject.difficulty}</Label>
                                  <Slider
                                    value={[editingSubject.difficulty]}
                                    onValueChange={(value) => setEditingSubject({...editingSubject, difficulty: value[0]})}
                                    min={1}
                                    max={5}
                                    step={1}
                                    className="mt-1"
                                  />
                                </div>
                                <div className="flex gap-4">
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      checked={editingSubject.required}
                                      onCheckedChange={(checked) => setEditingSubject({...editingSubject, required: checked})}
                                    />
                                    <Label>Obrigatória</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      checked={editingSubject.hasFriend}
                                      onCheckedChange={(checked) => setEditingSubject({...editingSubject, hasFriend: checked})}
                                    />
                                    <Label>Tem Amigo</Label>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={saveEdit}>Salvar</Button>
                                  <Button size="sm" variant="outline" onClick={cancelEdit}>Cancelar</Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex-1">
                                  <div className="font-medium">Turma {subject.class}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {subject.schedule} • Prof. {subject.professor}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Vagas: {subject.capacity - subject.filledSpots}/{subject.capacity} • 
                                    Dificuldade: {subject.difficulty}/5 •
                                    {subject.hasFriend && ' Com amigo •'}
                                    {subject.required && ' Obrigatória'}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => startEditing(subject)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeSubject(subject.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SubjectForm;
