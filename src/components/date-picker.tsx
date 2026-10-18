"use client";

import { useRef, useState } from "react";
import { format, isValid, parseISO } from "date-fns";
import type { DateRange } from "react-day-picker";
import { CalendarDays, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";

function readDate(value?: string) {
  const date = value ? parseISO(value) : undefined;
  return date && isValid(date) ? date : undefined;
}
const isoDate = (date?: Date) => (date ? format(date, "yyyy-MM-dd") : "");
const labelDate = (date: Date) => format(date, "dd MMM yyyy");
const calendarBounds = {
  startMonth: new Date(1900, 0, 1),
  endMonth: new Date(2200, 11, 31),
};

type DateControlProps = {
  id: string;
  disabled?: boolean;
  required?: boolean;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};
export function DatePicker({
  id,
  name,
  defaultValue,
  disabled,
  required,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
}: DateControlProps & { name: string; defaultValue?: string }) {
  const [date, setDate] = useState<Date | undefined>(() =>
    readDate(defaultValue),
  );
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <div className="date-control">
      <input
        type="hidden"
        name={name}
        value={isoDate(date)}
        disabled={disabled}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              ref={triggerRef}
              id={id}
              type="button"
              variant="outline"
              disabled={disabled}
              className="date-picker-trigger"
              data-empty={!date}
              aria-required={required}
              aria-describedby={describedBy}
              aria-invalid={invalid}
            />
          }
        >
          <CalendarDays data-icon="inline-start" aria-hidden="true" />
          {date ? labelDate(date) : <span>Pick a date</span>}
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="calendar-popover"
          aria-label="Choose a date"
        >
          <Calendar
            mode="single"
            captionLayout="dropdown"
            {...calendarBounds}
            defaultMonth={date}
            selected={date}
            onSelect={(next) => {
              setDate(next);
              setOpen(false);
            }}
            autoFocus
          />
        </PopoverContent>
      </Popover>
      {!required && date && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="date-clear"
          disabled={disabled}
          aria-label="Clear date"
          onClick={() => {
            setDate(undefined);
            triggerRef.current?.focus();
          }}
        >
          <X />
        </Button>
      )}
    </div>
  );
}
export function DateRangePicker({
  id,
  startName,
  endName,
  defaultStart,
  defaultEnd,
  disabled,
  required,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
}: DateControlProps & {
  startName: string;
  endName: string;
  defaultStart?: string;
  defaultEnd?: string;
}) {
  const [range, setRange] = useState<DateRange | undefined>(() => ({
    from: readDate(defaultStart),
    to: readDate(defaultEnd),
  }));
  const [open, setOpen] = useState(false);
  const mobile = useIsMobile();
  return (
    <div className="date-control">
      <input
        type="hidden"
        name={startName}
        value={isoDate(range?.from)}
        disabled={disabled}
      />
      <input
        type="hidden"
        name={endName}
        value={isoDate(range?.to)}
        disabled={disabled}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              id={id}
              type="button"
              variant="outline"
              disabled={disabled}
              className="date-picker-trigger"
              data-empty={!range?.from}
              aria-required={required}
              aria-describedby={describedBy}
              aria-invalid={invalid}
            />
          }
        >
          <CalendarDays data-icon="inline-start" aria-hidden="true" />
          {range?.from ? (
            <span>
              {labelDate(range.from)}
              {range.to ? ` — ${labelDate(range.to)}` : " — End date"}
            </span>
          ) : (
            <span>Choose start and end dates</span>
          )}
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="calendar-popover"
          aria-label="Choose semester dates"
        >
          <Calendar
            mode="range"
            captionLayout="dropdown"
            {...calendarBounds}
            defaultMonth={range?.from}
            selected={range}
            onSelect={setRange}
            numberOfMonths={mobile ? 1 : 2}
            autoFocus
          />
          <div className="calendar-footer">
            <span>
              {range?.from && range?.to
                ? "Date range selected"
                : range?.from
                  ? "Choose an end date"
                  : "Choose a start date"}
            </span>
            <div className="calendar-footer-actions">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!range?.from && !range?.to}
                onClick={() => setRange(undefined)}
              >
                Clear
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!range?.from || !range?.to}
                onClick={() => setOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
