import { useState } from 'react'
import { format } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { DayPicker } from 'react-day-picker'
import * as Popover from '@radix-ui/react-popover'
import { CalendarDays } from 'lucide-react'

const calCss = `
  .dp-root {
    color: inherit;
    font-family: inherit;
    position: relative;
    width: 100%;
    padding: 0;
  }
  .dp-root * { box-sizing: border-box; }

  .dp-month_caption {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 36px;
    margin-bottom: 18px;
  }
  .dp-caption_label {
    color: #0f172a;
    font-size: 18px;
    font-weight: 700;
    line-height: 36px;
    text-align: center;
  }
  .dark .dp-caption_label {
    color: #f4f4f5;
  }
  .dp-nav {
    display: flex;
    justify-content: space-between;
    left: 0;
    pointer-events: none;
    position: absolute;
    right: 0;
    top: 0;
    z-index: 1;
  }
  .dp-button_previous,
  .dp-button_next {
    align-items: center;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    color: #64748b;
    cursor: pointer;
    display: flex;
    height: 36px;
    justify-content: center;
    line-height: 1;
    pointer-events: auto;
    transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
    width: 36px;
  }
  .dark .dp-button_previous,
  .dark .dp-button_next {
    background: #050506;
    border: 1px solid #18181b;
    color: #a1a1aa;
  }
  .dp-button_previous:hover,
  .dp-button_next:hover {
    background: #e2e8f0;
    border-color: #cbd5e1;
    color: #0f172a;
  }
  .dark .dp-button_previous:hover,
  .dark .dp-button_next:hover {
    background: #18181b;
    border-color: #27272a;
    color: #f4f4f5;
  }
  .dp-chevron {
    height: 18px;
    width: 18px;
  }

  .dp-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    margin-bottom: 10px;
  }
  .dp-weekday {
    color: #64748b;
    font-size: 16px;
    font-weight: 400;
    line-height: 28px;
    text-align: center;
  }
  .dark .dp-weekday {
    color: #a1a1aa;
  }

  .dp-weeks {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .dp-week {
    display: grid;
    gap: 10px;
    grid-template-columns: repeat(7, 1fr);
  }
  .dp-day {
    align-items: center;
    display: flex;
    justify-content: center;
  }
  .dp-day_button {
    align-items: center;
    background: transparent;
    border: 0;
    border-radius: 8px;
    color: #0f172a;
    cursor: pointer;
    display: flex;
    font-size: 18px;
    font-weight: 400;
    height: 35px;
    justify-content: center;
    line-height: 1;
    transition: background 0.15s ease, color 0.15s ease;
    width: 35px;
  }
  .dark .dp-day_button {
    color: #fafafa;
  }
  .dp-day_button:hover {
    background: #e2e8f0;
    color: #0f172a;
  }
  .dark .dp-day_button:hover {
    background: #18181b;
    color: #fafafa;
  }
  .dp-selected .dp-day_button {
    background: var(--app-primary, #0f172a) !important;
    color: #ffffff !important;
    font-weight: 500;
  }
  .dark .dp-selected .dp-day_button {
    background: var(--app-primary, #f4f4f5) !important;
    color: #18181b !important;
  }
  .dp-today:not(.dp-selected) .dp-day_button {
    background: #f1f5f9;
    color: #0f172a;
  }
  .dark .dp-today:not(.dp-selected) .dp-day_button {
    background: #18181b;
    color: #f4f4f5;
  }
  .dp-outside .dp-day_button {
    color: #cbd5e1;
  }
  .dark .dp-outside .dp-day_button {
    color: #71717a;
  }
  .dp-disabled .dp-day_button {
    cursor: not-allowed;
    opacity: 0.35;
  }
`

export function DatePicker({ date, onDateChange, placeholder = 'Select date', className = '' }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <style>{calCss}</style>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            className={`flex h-[50px] w-full items-center gap-3 rounded-lg border border-slate-200 dark:border-[#27272a] bg-white dark:bg-[#09090b] px-5 text-left text-base text-slate-900 dark:text-white transition hover:border-slate-300 dark:hover:border-[#3f3f46] hover:bg-slate-50 dark:hover:bg-[#18181b] sm:w-[350px] ${className}`}
          >
            <CalendarDays className="h-5 w-5 shrink-0 text-slate-900 dark:text-white" strokeWidth={2} />
            <span className={date ? 'text-slate-900 dark:text-white' : 'text-zinc-400'}>
              {date ? format(date, 'MMMM do, yyyy', { locale: enUS }) : placeholder}
            </span>
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={6}
            className="z-50 w-[350px] rounded-lg border border-slate-200 dark:border-[#27272a] bg-white dark:bg-[#030305] p-5 shadow-2xl"
          >
            <DayPicker
              mode="single"
              selected={date}
              onSelect={(selectedDate) => {
                onDateChange?.(selectedDate)
                if (selectedDate) setOpen(false)
              }}
              locale={enUS}
              showOutsideDays
              classNames={{
                root: 'dp-root',
                month_caption: 'dp-month_caption',
                caption_label: 'dp-caption_label',
                nav: 'dp-nav',
                button_previous: 'dp-button_previous',
                button_next: 'dp-button_next',
                weekdays: 'dp-weekdays',
                weekday: 'dp-weekday',
                weeks: 'dp-weeks',
                week: 'dp-week',
                day: 'dp-day',
                day_button: 'dp-day_button',
                selected: 'dp-selected',
                today: 'dp-today',
                outside: 'dp-outside',
                disabled: 'dp-disabled',
                chevron: 'dp-chevron',
              }}
              components={{
                Chevron: ({ orientation }) => (
                  <svg className="dp-chevron" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={orientation === 'left' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'}
                    />
                  </svg>
                ),
              }}
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </>
  )
}
