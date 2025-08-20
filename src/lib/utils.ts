import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { DatePrecision } from '@/generated/prisma/client'
import { parse, isValid, format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseDateAndDeterminePrecision(dateString: string): {
  date: Date
  precision: DatePrecision
} | null {
  if (!dateString) {
    return null
  }

  // Normalize the date string by replacing 'at' with a space
  const normalizedDateString = dateString.replace(/\s+at\s+/i, ' ')

  const dateParsingConfig = [
    // TIME formats - most specific first
    { format: "MMMM d, yyyy h:mm a", precision: DatePrecision.TIME },
    { format: 'MMMM d, yyyy HH:mm', precision: DatePrecision.TIME },
    { format: 'MMM d, yyyy h:mm a', precision: DatePrecision.TIME },
    { format: 'MMM d, yyyy HH:mm', precision: DatePrecision.TIME },
    { format: 'M/d/yyyy h:mm a', precision: DatePrecision.TIME },
    { format: 'M/d/yyyy HH:mm', precision: DatePrecision.TIME },
    { format: 'M/d/yy h:mm a', precision: DatePrecision.TIME },
    { format: 'M/d/yy HH:mm', precision: DatePrecision.TIME },
    { format: 'yyyy-MM-dd h:mm a', precision: DatePrecision.TIME },
    { format: 'yyyy-MM-dd HH:mm', precision: DatePrecision.TIME },

    // DAY formats
    { format: 'MMMM d, yyyy', precision: DatePrecision.DAY },
    { format: 'MMM d, yyyy', precision: DatePrecision.DAY },
    { format: 'M/d/yyyy', precision: DatePrecision.DAY },
    { format: 'M/d/yy', precision: DatePrecision.DAY },
    { format: 'yyyy-MM-dd', precision: DatePrecision.DAY },

    // MONTH formats
    { format: 'MMMM yyyy', precision: DatePrecision.MONTH },
    { format: 'MMM yyyy', precision: DatePrecision.MONTH },
    { format: 'yyyy-MM', precision: DatePrecision.MONTH },

    // YEAR formats
    { format: 'yyyy', precision: DatePrecision.YEAR },
    { format: 'yy', precision: DatePrecision.YEAR },
  ]

  for (const { format, precision } of dateParsingConfig) {
    const parsedDate = parse(normalizedDateString, format, new Date())

    if (isValid(parsedDate)) {
      // Post-process two-digit years to ensure correct century
      if (format.includes('yy') && !format.includes('yyyy')) {
        const year = parsedDate.getFullYear()
        const currentYear = new Date().getFullYear()
        // Heuristic: if parsed year is in the future, assume it's from the previous century
        if (year > currentYear) {
          parsedDate.setFullYear(year - 100)
        }
      }
      return { date: parsedDate, precision }
    }
  }

  return null
}

export function formatDateForInput(
  date: Date,
  precision: DatePrecision,
): string {
  if (!date) return ''

  // When a date is stored in the database, it's typically in UTC.
  // When we create a new Date object from it, it's still in UTC.
  // However, the `format` function from date-fns can sometimes be affected by the server's timezone,
  // potentially causing an off-by-one-day error. To prevent this, we adjust the date by the timezone offset.
  const adjustedDate = new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000)

  switch (precision) {
    case DatePrecision.YEAR:
      return format(adjustedDate, 'yyyy')
    case DatePrecision.MONTH:
      return format(adjustedDate, 'MMMM yyyy')
    case DatePrecision.DAY:
    case DatePrecision.TIME:
    default:
      return format(adjustedDate, 'MMMM d, yyyy')
  }
}
