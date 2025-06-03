import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Settings, XCircle } from 'lucide-react';
import { ScheduleConfiguration } from '@/types/schedule';
import TimeSlotSelector from './TimeSlotSelector';
interface ConfigurationPanelProps {
  configuration: ScheduleConfiguration;
  onConfigurationChange: (config: ScheduleConfiguration) => void;
}
const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  configuration,
  onConfigurationChange
}) => {
  const updateConfig = (updates: Partial<ScheduleConfiguration>) => {
    onConfigurationChange({
      ...configuration,
      ...updates
    });
  };
  return <div className="space-y-6">
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            Disponibilidade de Horários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Horários Indisponíveis</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Selecione os horários em que você <strong>não pode</strong> ter aulas. 
                O sistema irá otimizar sua grade respeitando essas restrições e maximizando 
                o número de matérias possíveis.
              </p>
              <TimeSlotSelector value={configuration.unavailableSlots?.join(', ') || ''} onChange={value => {
              const slots = value ? value.split(', ').filter(slot => slot.trim() !== '') : [];
              updateConfig({
                unavailableSlots: slots
              });
            }} placeholder="Clique nos horários que você NÃO pode ter aula" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Pesos dos Critérios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Peso das Vagas Disponíveis: {configuration.weightVacancies.toFixed(1)}</Label>
            <Slider value={[configuration.weightVacancies]} onValueChange={value => updateConfig({
            weightVacancies: value[0]
          })} min={0} max={10} step={0.1} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">Prioriza turmas com mais vagas disponíveis</p>
          </div>

          <div>
            <Label>Peso dos Amigos: {configuration.weightFriend.toFixed(1)}</Label>
            <Slider value={[configuration.weightFriend]} onValueChange={value => updateConfig({
            weightFriend: value[0]
          })} min={0} max={10} step={0.1} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">Prioriza turmas onde você tem amigos</p>
          </div>

          <div>
            <Label>Peso da Dificuldade: {configuration.weightDifficulty.toFixed(1)}</Label>
            <Slider value={[configuration.weightDifficulty]} onValueChange={value => updateConfig({
            weightDifficulty: value[0]
          })} min={0} max={10} step={0.1} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Prioriza professores com menor dificuldade e maximiza a média das notas de dificuldade
            </p>
          </div>
        </CardContent>
      </Card>
    </div>;
};
export default ConfigurationPanel;
