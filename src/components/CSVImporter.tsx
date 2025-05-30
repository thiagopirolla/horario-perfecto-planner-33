
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { Subject } from '@/types/schedule';
import { parseCSVToSubjects } from '@/utils/csvUtils';
import { toast } from '@/hooks/use-toast';

interface CSVImporterProps {
  onSubjectsImport: (subjects: Subject[]) => void;
}

const CSVImporter: React.FC<CSVImporterProps> = ({ onSubjectsImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione um arquivo CSV.",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvContent = e.target?.result as string;
        const importedSubjects = parseCSVToSubjects(csvContent);
        
        if (importedSubjects.length === 0) {
          toast({
            title: "CSV vazio ou inválido",
            description: "Nenhuma matéria válida foi encontrada no arquivo.",
            variant: "destructive"
          });
          return;
        }

        onSubjectsImport(importedSubjects);
        
        toast({
          title: "CSV importado com sucesso!",
          description: `${importedSubjects.length} matérias importadas.`,
        });
      } catch (error) {
        console.error('Erro ao importar CSV:', error);
        toast({
          title: "Erro na importação",
          description: "Ocorreu um erro ao processar o arquivo CSV.",
          variant: "destructive"
        });
      }
    };

    reader.readAsText(file);
    
    // Limpar o input para permitir reimportar o mesmo arquivo
    event.target.value = '';
  };

  return (
    <>
      <Button onClick={handleImport} variant="outline">
        <Upload className="w-4 h-4 mr-2" />
        Importar CSV
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </>
  );
};

export default CSVImporter;
