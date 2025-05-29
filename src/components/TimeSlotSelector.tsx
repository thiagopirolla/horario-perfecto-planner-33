
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Plus, X } from 'lucide-react';

interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
}

interface TimeSlotSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({ value, onChange, placeholder = "Selecionar horário" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>(() => {
    if (!value) return [];
    
    // Parse existing value: "Seg.08-10, Qua.14-16"
    const slots = value.split(', ').map(slot => {
      const [day, time] = slot.split('.');
      const [start, end] = time.split('-');
      return {
        day,
        startTime: start,
        endTime: end
      };
    });
    return slots;
  });

  const days = [
    { short: 'Seg', full: 'Segunda' },
    { short: 'Ter', full: 'Terça' },
    { short: 'Qua', full: 'Quarta' },
    { short: 'Qui', full: 'Quinta' },
    { short: 'Sex', full: 'Sexta' }
  ];

  const timeSlots = [
    '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23'
  ];

  const addTimeSlot = (day: string, startTime: string, endTime: string) => {
    const newSlot = { day, startTime, endTime };
    const updatedSlots = [...selectedSlots, newSlot];
    setSelectedSlots(updatedSlots);
    updateValue(updatedSlots);
  };

  const removeTimeSlot = (index: number) => {
    const updatedSlots = selectedSlots.filter((_, i) => i !== index);
    setSelectedSlots(updatedSlots);
    updateValue(updatedSlots);
  };

  const updateValue = (slots: TimeSlot[]) => {
    const formatted = slots.map(slot => `${slot.day}.${slot.startTime}-${slot.endTime}`).join(', ');
    onChange(formatted);
  };

  const QuickSlotButton = ({ day, start, end, label }: { day: string; start: string; end: string; label: string }) => (
    <Button
      variant="outline"
      size="sm"
      onClick={() => addTimeSlot(day, start, end)}
      className="text-xs"
    >
      {label}
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1 h-8 w-8 p-0"
            onClick={() => setIsOpen(true)}
          >
            <Clock className="h-4 w-4" />
          </Button>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Seletor de Horários</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Horários Selecionados */}
          {selectedSlots.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Horários Selecionados:</h3>
              <div className="flex flex-wrap gap-2">
                {selectedSlots.map((slot, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {days.find(d => d.short === slot.day)?.full} {slot.startTime}:00-{slot.endTime}:00
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeTimeSlot(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Atalhos Rápidos */}
          <div>
            <h3 className="text-sm font-medium mb-3">Atalhos Rápidos:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {days.map(day => (
                <div key={day.short} className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground">{day.full}</h4>
                  <div className="grid grid-cols-2 gap-1">
                    <QuickSlotButton day={day.short} start="08" end="10" label="08-10" />
                    <QuickSlotButton day={day.short} start="10" end="12" label="10-12" />
                    <QuickSlotButton day={day.short} start="14" end="16" label="14-16" />
                    <QuickSlotButton day={day.short} start="16" end="18" label="16-18" />
                    <QuickSlotButton day={day.short} start="19" end="21" label="19-21" />
                    <QuickSlotButton day={day.short} start="21" end="23" label="21-23" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Seletor Manual */}
          <div>
            <h3 className="text-sm font-medium mb-3">Seleção Manual:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
              <div>
                <label className="text-xs font-medium">Dia:</label>
                <select 
                  id="manual-day" 
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  defaultValue=""
                >
                  <option value="">Selecione o dia</option>
                  {days.map(day => (
                    <option key={day.short} value={day.short}>{day.full}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium">Início:</label>
                <select 
                  id="manual-start" 
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  defaultValue=""
                >
                  <option value="">Hora início</option>
                  {timeSlots.map(time => (
                    <option key={time} value={time}>{time}:00</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium">Fim:</label>
                <select 
                  id="manual-end" 
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  defaultValue=""
                >
                  <option value="">Hora fim</option>
                  {timeSlots.map(time => (
                    <option key={time} value={time}>{time}:00</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-3">
                <Button
                  type="button"
                  onClick={() => {
                    const daySelect = document.getElementById('manual-day') as HTMLSelectElement;
                    const startSelect = document.getElementById('manual-start') as HTMLSelectElement;
                    const endSelect = document.getElementById('manual-end') as HTMLSelectElement;
                    
                    if (daySelect.value && startSelect.value && endSelect.value) {
                      addTimeSlot(daySelect.value, startSelect.value, endSelect.value);
                      daySelect.value = '';
                      startSelect.value = '';
                      endSelect.value = '';
                    }
                  }}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Horário
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setIsOpen(false)}>
              Confirmar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimeSlotSelector;
