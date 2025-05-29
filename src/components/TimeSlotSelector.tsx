
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, X } from 'lucide-react';

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

  const isSlotSelected = (day: string, start: string, end: string) => {
    return selectedSlots.some(slot => 
      slot.day === day && slot.startTime === start && slot.endTime === end
    );
  };

  const QuickSlotButton = ({ day, start, end, label }: { day: string; start: string; end: string; label: string }) => {
    const selected = isSlotSelected(day, start, end);
    
    return (
      <Button
        variant={selected ? "default" : "outline"}
        size="sm"
        onClick={() => {
          if (selected) {
            const index = selectedSlots.findIndex(slot => 
              slot.day === day && slot.startTime === start && slot.endTime === end
            );
            if (index !== -1) {
              removeTimeSlot(index);
            }
          } else {
            addTimeSlot(day, start, end);
          }
        }}
        className={`text-xs ${selected ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
      >
        {label}
      </Button>
    );
  };

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
            <h3 className="text-sm font-medium mb-3">Selecione os Horários:</h3>
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
