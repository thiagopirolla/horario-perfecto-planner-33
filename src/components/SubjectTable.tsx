import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Plus, Save, Trash2, TableIcon, Copy } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Subject } from '@/types/schedule';
import { toast } from '@/hooks/use-toast';
import TimeSlotSelector from './TimeSlotSelector';
interface SubjectTableProps {
  subjects: Subject[];
  onSubjectsChange: (subjects: Subject[]) => void;
}
interface TableRow {
  id: string;
  code: string;
  name: string;
  required: boolean;
  class: string;
  capacity: string;
  filledSpots: string;
  professor: string;
  difficulty: number;
  hasFriend: boolean;
  schedule: string;
  hours: number;
}
const SubjectTable: React.FC<SubjectTableProps> = ({
  subjects,
  onSubjectsChange
}) => {
  const [tableRows, setTableRows] = useState<TableRow[]>([{
    id: '1',
    code: '',
    name: '',
    required: false,
    class: '',
    capacity: '',
    filledSpots: '',
    professor: '',
    difficulty: 3,
    hasFriend: false,
    schedule: '',
    hours: 2
  }, {
    id: '2',
    code: '',
    name: '',
    required: false,
    class: '',
    capacity: '',
    filledSpots: '',
    professor: '',
    difficulty: 3,
    hasFriend: false,
    schedule: '',
    hours: 2
  }, {
    id: '3',
    code: '',
    name: '',
    required: false,
    class: '',
    capacity: '',
    filledSpots: '',
    professor: '',
    difficulty: 3,
    hasFriend: false,
    schedule: '',
    hours: 2
  }]);
  const addRow = () => {
    const newRow: TableRow = {
      id: Date.now().toString(),
      code: '',
      name: '',
      required: false,
      class: '',
      capacity: '',
      filledSpots: '',
      professor: '',
      difficulty: 3,
      hasFriend: false,
      schedule: '',
      hours: 2
    };
    setTableRows([...tableRows, newRow]);
  };
  const removeRow = (id: string) => {
    if (tableRows.length > 1) {
      setTableRows(tableRows.filter(row => row.id !== id));
    }
  };
  const duplicateRow = (id: string) => {
    const rowToDuplicate = tableRows.find(row => row.id === id);
    if (rowToDuplicate) {
      const newRow: TableRow = {
        ...rowToDuplicate,
        id: Date.now().toString() + Math.random().toString()
      };
      const rowIndex = tableRows.findIndex(row => row.id === id);
      const newRows = [...tableRows];
      newRows.splice(rowIndex + 1, 0, newRow);
      setTableRows(newRows);
    }
  };
  const updateRow = (id: string, field: keyof TableRow, value: any) => {
    setTableRows(tableRows.map(row => row.id === id ? {
      ...row,
      [field]: value
    } : row));
  };
  const saveAllSubjects = () => {
    const validRows = tableRows.filter(row => row.code.trim() && row.name.trim() && row.schedule.trim());
    if (validRows.length === 0) {
      toast({
        title: "Nenhuma matéria válida",
        description: "Por favor, preencha pelo menos Código, Nome e Horário para uma matéria.",
        variant: "destructive"
      });
      return;
    }
    const incompleteRows = tableRows.filter(row => {
      const hasAnyData = row.code.trim() || row.name.trim() || row.schedule.trim();
      const hasAllRequired = row.code.trim() && row.name.trim() && row.schedule.trim();
      return hasAnyData && !hasAllRequired;
    });
    if (incompleteRows.length > 0) {
      toast({
        title: "Linhas incompletas encontradas",
        description: "Algumas linhas têm dados parciais. Complete os campos obrigatórios (Código, Nome, Horário) ou remova essas linhas.",
        variant: "destructive"
      });
      return;
    }
    const newSubjects: Subject[] = validRows.map(row => ({
      id: Date.now().toString() + Math.random().toString(),
      code: row.code,
      name: row.name,
      required: row.required,
      class: row.class,
      capacity: parseInt(row.capacity) || 40,
      filledSpots: parseInt(row.filledSpots) || 0,
      professor: row.professor,
      difficulty: row.difficulty,
      hasFriend: row.hasFriend,
      schedule: row.schedule,
      hours: row.hours
    }));
    onSubjectsChange([...subjects, ...newSubjects]);
    toast({
      title: "Matérias cadastradas com sucesso!",
      description: `${validRows.length} matéria(s) foram adicionadas.`
    });

    // Limpar a tabela após salvar
    setTableRows([{
      id: Date.now().toString(),
      code: '',
      name: '',
      required: false,
      class: '',
      capacity: '',
      filledSpots: '',
      professor: '',
      difficulty: 3,
      hasFriend: false,
      schedule: '',
      hours: 2
    }]);
  };
  return <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TableIcon className="w-5 h-5" />
          Adicionar Matérias em Tabela
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código *</TableHead>
                <TableHead>Nome *</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Professor</TableHead>
                <TableHead>Horário *</TableHead>
                <TableHead>Cap.</TableHead>
                <TableHead>Preench.</TableHead>
                <TableHead>Dificuldade</TableHead>
                <TableHead>Obrigatória</TableHead>
                <TableHead>Tem Amigo</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableRows.map(row => <TableRow key={row.id}>
                  <TableCell>
                    <Input value={row.code} onChange={e => updateRow(row.id, 'code', e.target.value)} placeholder="MAT001" className="w-20" />
                  </TableCell>
                  <TableCell>
                    <Input value={row.name} onChange={e => updateRow(row.id, 'name', e.target.value)} placeholder="Nome da matéria" className="w-32" />
                  </TableCell>
                  <TableCell>
                    <Input value={row.class} onChange={e => updateRow(row.id, 'class', e.target.value)} placeholder="A" className="w-12" />
                  </TableCell>
                  <TableCell>
                    <Input value={row.professor} onChange={e => updateRow(row.id, 'professor', e.target.value)} placeholder="Professor" className="w-24" />
                  </TableCell>
                  <TableCell>
                    <div className="w-32">
                      <TimeSlotSelector value={row.schedule} onChange={schedule => updateRow(row.id, 'schedule', schedule)} placeholder="Horário" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input type="number" value={row.capacity} onChange={e => updateRow(row.id, 'capacity', e.target.value)} placeholder="40" className="w-16" />
                  </TableCell>
                  <TableCell>
                    <Input type="number" value={row.filledSpots} onChange={e => updateRow(row.id, 'filledSpots', e.target.value)} placeholder="0" className="w-16" />
                  </TableCell>
                  <TableCell>
                    <div className="w-20">
                      <Slider value={[row.difficulty]} onValueChange={value => updateRow(row.id, 'difficulty', value[0])} min={1} max={5} step={1} className="mt-2" />
                      <div className="text-xs text-center mt-1">{row.difficulty}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch checked={row.required} onCheckedChange={checked => updateRow(row.id, 'required', checked)} />
                  </TableCell>
                  <TableCell>
                    <Switch checked={row.hasFriend} onCheckedChange={checked => updateRow(row.id, 'hasFriend', checked)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => duplicateRow(row.id)} title="Duplicar linha">
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => removeRow(row.id)} disabled={tableRows.length === 1} title="Remover linha">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
        </div>

        <div className="flex gap-2 mt-4">
          <Button onClick={addRow} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Linha
          </Button>
          <Button onClick={saveAllSubjects}>
            <Save className="w-4 h-4 mr-2" />
            Salvar Todas as Matérias
          </Button>
        </div>

        <div className="text-sm text-muted-foreground mt-2">
          
          
          
        </div>
      </CardContent>
    </Card>;
};
export default SubjectTable;