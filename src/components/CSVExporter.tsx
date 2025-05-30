
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Subject } from '@/types/schedule';
import { exportSubjectsToCSV, downloadCSV } from '@/utils/csvUtils';
import { toast } from '@/hooks/use-toast';

interface CSVExporterProps {
  subjects: Subject[];
}

const CSVExporter: React.FC<CSVExporterProps> = ({ subjects }) => {
  const handleExport = () => {
    if (subjects.length === 0) {
      toast({
        title: "Nenhuma matéria para exportar",
        description: "Adicione algumas matérias antes de exportar.",
        variant: "destructive"
      });
      return;
    }

    try {
      const csvContent = exportSubjectsToCSV(subjects);
      downloadCSV(csvContent, 'materias.csv');
      
      toast({
        title: "CSV exportado com sucesso!",
        description: `${subjects.length} matérias exportadas.`,
      });
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast({
        title: "Erro na exportação",
        description: "Ocorreu um erro ao exportar o CSV.",
        variant: "destructive"
      });
    }
  };

  return (
    <Button 
      onClick={handleExport}
      variant="outline"
      disabled={subjects.length === 0}
    >
      <Download className="w-4 h-4 mr-2" />
      Exportar CSV
    </Button>
  );
};

export default CSVExporter;
