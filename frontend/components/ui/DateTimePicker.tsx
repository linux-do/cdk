'use client';

import {useState, useEffect} from 'react';
import {format} from 'date-fns';
import {zhCN} from 'date-fns/locale';
import {CalendarIcon, Clock} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Calendar} from '@/components/ui/calendar';
import {Label} from '@/components/ui/label';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {cn} from '@/lib/utils';
import {Separator} from '@/components/ui/separator';

interface DateTimePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  label?: string;
  required?: boolean;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = '选择日期和时间',
  disabled = false,
  minDate,
  label,
  required = false,
}: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(value);
  const [isOpen, setIsOpen] = useState(false);
  const [timeValue, setTimeValue] = useState({
    hours: value ? value.getHours().toString().padStart(2, '0') : '00',
    minutes: value ? value.getMinutes().toString().padStart(2, '0') : '00',
    seconds: value ? value.getSeconds().toString().padStart(2, '0') : '00',
  });

  useEffect(() => {
    if (value) {
      setSelectedDate(value);
      setTimeValue({
        hours: value.getHours().toString().padStart(2, '0'),
        minutes: value.getMinutes().toString().padStart(2, '0'),
        seconds: value.getSeconds().toString().padStart(2, '0'),
      });
    }
  }, [value]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    const newDateTime = new Date(date);
    newDateTime.setHours(
      parseInt(timeValue.hours),
      parseInt(timeValue.minutes),
      parseInt(timeValue.seconds)
    );

    setSelectedDate(newDateTime);
    onChange?.(newDateTime);
  };

  const handleTimeChange = (type: 'hours' | 'minutes' | 'seconds', value: string) => {
    const newTimeValue = {...timeValue, [type]: value};
    setTimeValue(newTimeValue);

    if (selectedDate) {
      const newDateTime = new Date(selectedDate);
      newDateTime.setHours(
        parseInt(newTimeValue.hours),
        parseInt(newTimeValue.minutes),
        parseInt(newTimeValue.seconds)
      );
      setSelectedDate(newDateTime);
      onChange?.(newDateTime);
    }
  };

  const generateOptions = (max: number) => {
    return Array.from({length: max}, (_, i) => 
      i.toString().padStart(2, '0')
    );
  };

  const setCurrentTime = () => {
    const now = new Date();
    const newTimeValue = {
      hours: now.getHours().toString().padStart(2, '0'),
      minutes: now.getMinutes().toString().padStart(2, '0'),
      seconds: now.getSeconds().toString().padStart(2, '0'),
    };
    setTimeValue(newTimeValue);
    setSelectedDate(now);
    onChange?.(now);
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-sm font-medium">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !selectedDate && 'text-muted-foreground'
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? (
              format(selectedDate, 'yyyy年MM月dd日 HH:mm:ss', {locale: zhCN})
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => {
                if (minDate) {
                  const minDateOnly = new Date(minDate);
                  minDateOnly.setHours(0, 0, 0, 0);
                  const dateOnly = new Date(date);
                  dateOnly.setHours(0, 0, 0, 0);
                  return dateOnly < minDateOnly;
                }
                return false;
              }}
              className="rounded-none border-r"
              locale={zhCN}
            />
            
            <Separator className="my-2" />

            <div className="flex flex-col p-3 gap-3 ">

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  <span className="text-xs font-medium">选择时间</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={setCurrentTime}
                  className="text-xs text-muted-foreground"
                >
                  当前时间
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Select value={timeValue.hours} onValueChange={(value) => handleTimeChange('hours', value)}>
                    <SelectTrigger className="w-full h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {generateOptions(24).map((hour) => (
                        <SelectItem key={hour} value={hour}>
                          {hour}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1">
                  <Select value={timeValue.minutes} onValueChange={(value) => handleTimeChange('minutes', value)}>
                    <SelectTrigger className="w-full h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {generateOptions(60).map((minute) => (
                        <SelectItem key={minute} value={minute}>
                          {minute}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1">
                  <Select value={timeValue.seconds} onValueChange={(value) => handleTimeChange('seconds', value)}>
                    <SelectTrigger className="w-full h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {generateOptions(60).map((second) => (
                        <SelectItem key={second} value={second}>
                          {second}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
} 