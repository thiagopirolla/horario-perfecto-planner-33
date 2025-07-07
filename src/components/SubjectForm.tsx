
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Trash2, Edit, TableIcon } from 'lucide-react';
import { Subject } from '@/types/schedule';
import { toast } from '@/hooks/use-toast';
import SubjectTable from './SubjectTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import TimeSlotSelector from './TimeSlotSelector';

interface SubjectFormProps {
  subjects: Subject[];
  onSubjectsChange: (subjects: Subject[]) => void;
}

const SubjectForm: React.FC<SubjectFormProps> = ({ subjects, onSubjectsChange }) => {
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const removeSubject = (id: string) => {
    onSubjectsChange(subjects.filter(s => s.id !== id));
  };

  const startEditing = (subject: Subject) => {
    setEditingSubject(subject);
  };

  const saveEdit = () => {
    if (!editingSubject) return;
    
    const missingFields = [];
    
    if (!editingSubject.code.trim()) missingFields.push('Código da Matéria');
    if (!editingSubject.name.trim()) missingFields.push('Nome da Matéria');
    if (!editingSubject.schedule.trim()) missingFields.push('Horário');
    
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
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TableIcon className="w-5 h-5" />
            Adicionar Matérias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SubjectTable 
            subjects={subjects}
            onSubjectsChange={onSubjectsChange}
          />
        </CardContent>
      </Card>

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
                                  <Label>Facilidade: {editingSubject.difficulty}</Label>
                                  <Slider
                                    value={[editingSubject.difficulty]}
                                    onValueChange={(value) => setEditingSubject({...editingSubject, difficulty: value[0]})}
                                    min={1}
                                    max={5}
                                    step={1}
                                    className="mt-1 max-w-md"
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
                                    Facilidade: {subject.difficulty}/5 •
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
