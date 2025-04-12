"use client";

import * as React from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

interface DatePickerProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  className?: string;
}

export function DatePicker({ date, onDateChange, className }: DatePickerProps) {
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const datePickerRef = React.useRef<HTMLDivElement>(null);
  
  // Handle clicks outside of the date picker
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    onDateChange(selectedDate);
    setIsCalendarOpen(false);
  };

  const handleClearDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDateChange(undefined);
  };

  const toggleCalendar = () => {
    setIsCalendarOpen(!isCalendarOpen);
  };

  return (
    <div className="relative" ref={datePickerRef}>
      {/* Input field */}
      <div 
        className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 cursor-pointer group relative"
        onClick={toggleCalendar}
      >
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-gray-200 transition-colors">
          <CalendarIcon className="h-4 w-4" />
        </div>
        
        <div className="flex-1 flex items-center px-10 truncate text-sm">
          {date ? (
            <span className="text-gray-200">{format(date, "MMM dd, yyyy")}</span>
          ) : (
            <span className="text-gray-500">Select Date</span>
          )}
        </div>
        
        {date && (
          <button 
            onClick={handleClearDate}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
            type="button"
            aria-label="Clear date"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Calendar dropdown */}
      {isCalendarOpen && (
        <div className="absolute z-50 mt-1 bg-zinc-900 border border-zinc-700 rounded-md shadow-lg p-3">
          <style jsx global>{`
            .rdp {
              --rdp-cell-size: 32px;
              --rdp-accent-color: #3b82f6;
              --rdp-background-color: #3b82f6;
              --rdp-accent-color-dark: #2563eb;
              --rdp-background-color-dark: #1e3a8a;
              --rdp-outline: 2px solid var(--rdp-accent-color);
              --rdp-outline-selected: 2px solid var(--rdp-accent-color);
              margin: 0;
            }
            .rdp-months {
              justify-content: center;
            }
            .rdp-month {
              background-color: transparent;
            }
            .rdp-caption {
              color: #d4d4d8;
            }
            .rdp-head_cell {
              color: #a1a1aa;
              font-weight: 500;
              font-size: 0.875rem;
            }
            .rdp-day_today:not(.rdp-day_outside) {
              font-weight: bold;
              color: #3b82f6;
            }
            .rdp-day_selected, 
            .rdp-day_selected:hover {
              background-color: var(--rdp-accent-color);
              color: white;
            }
            .rdp-day:hover:not(.rdp-day_outside) {
              background-color: #3f3f46;
              color: #f4f4f5;
            }
            .rdp-day {
              color: #d4d4d8;
              border-radius: 4px;
            }
            .rdp-day_outside {
              color: #52525b;
              opacity: 0.6;
            }
            .rdp-button:focus, .rdp-button:active {
              outline: 2px solid #3b82f6;
              background-color: transparent;
            }
            .rdp-nav_button {
              color: #d4d4d8;
            }
            .rdp-nav_button:hover {
              background-color: #3f3f46;
            }
          `}</style>
          <DayPicker
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            showOutsideDays
            className="border-zinc-700"
            classNames={{
              day_selected: "bg-blue-600 text-white hover:bg-blue-600",
              day_today: "text-blue-500 font-bold",
            }}
            footer={
              <div className="flex justify-between mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearDate}
                  className="text-xs border-zinc-700 hover:bg-zinc-800"
                >
                  Clear
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDateSelect(new Date())}
                  className="text-xs border-zinc-700 hover:bg-zinc-800"
                >
                  Today
                </Button>
              </div>
            }
          />
        </div>
      )}
    </div>
  );
} 