
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings, Target, Calendar, Clock } from 'lucide-react';
import { ScheduleConfiguration } from '@/types/schedule';

interface ConfigurationPanelProps {
  configuration: ScheduleConfiguration;
  onConfigurationChange: (config: ScheduleConfiguration) => void;
}

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  configuration,
  onConfigurationChange
}) => {
  const updateConfig = (updates: Partial<ScheduleConfiguration>) => {
    onConfigurationChange({ ...configuration, ...updates });
  };

  const freeDayOptions = [
    { value: 'seg-ter', label: 'Segunda e Terça', days: ['Segunda', 'Terça'] },
    { value: 'qui-sex', label: 'Quinta e Sexta', days: ['Quinta', 'Sexta'] },
    { value: 'seg-sex', label: 'Segunda e Sexta', days: ['Segunda', 'Sexta'] }
  ];

  return (
    <div className="space-y-6">
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Estratégia de Otimização
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Estratégia Principal</Label>
              <Select
                value={configuration.strategy}
                onValueChange={(value: 'maximize' | 'free-days' | 'half-period') =>
                  updateConfig({ strategy: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maximize">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Maximizar Matérias
                    </div>
                  </SelectItem>
                  <SelectItem value="free-days">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Dias Livres
                    </div>
                  </SelectItem>
                  <SelectItem value="half-period">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Meio Período Livre
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {configuration.strategy === 'free-days' && (
              <div>
                <Label>Configuração de Dias Livres</Label>
                <Select
                  value={freeDayOptions.find(opt => 
                    opt.days.every(day => configuration.freeDays?.includes(day))
                  )?.value || 'seg-sex'}
                  onValueChange={(value) => {
                    const option = freeDayOptions.find(opt => opt.value === value);
                    if (option) {
                      updateConfig({ freeDays: option.days });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {freeDayOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
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
            <Label>Peso das Vagas Disponíveis: {configuration.weightVacancies.toFixed(3)}</Label>
            <Slider
              value={[configuration.weightVacancies]}
              onValueChange={(value) => updateConfig({ weightVacancies: value[0] })}
              min={-1}
              max={0.1}
              step={0.001}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Prioriza matérias com mais vagas disponíveis
            </p>
          </div>

          <div>
            <Label>Peso dos Amigos: {configuration.weightFriend.toFixed(1)}</Label>
            <Slider
              value={[configuration.weightFriend]}
              onValueChange={(value) => updateConfig({ weightFriend: value[0] })}
              min={0}
              max={1}
              step={0.1}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Prioriza matérias onde você tem amigos
            </p>
          </div>

          <div>
            <Label>Peso da Dificuldade: {configuration.weightDifficulty.toFixed(3)}</Label>
            <Slider
              value={[configuration.weightDifficulty]}
              onValueChange={(value) => updateConfig({ weightDifficulty: value[0] })}
              min={0}
              max={0.1}
              step={0.001}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Prioriza professores com menor dificuldade
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfigurationPanel;
