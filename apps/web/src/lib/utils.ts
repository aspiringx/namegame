import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge'
import { DatePrecision } from '@namegame/db/types'
import { isValid, parse } from 'date-fns'
import { format, fromZonedTime } from 'date-fns-tz'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseDateAndDeterminePrecision(
  dateString: string,
  timeZone: string = 'UTC',
): {
  date: Date
  precision: DatePrecision
} | null {
  if (!dateString) {
    return null
  }

  const normalizedDateString = dateString
    .trim()
    .replace(/\s+at\s+/i, ' ')
    .replace(/,/, '')

  const dateParsingConfig = [
    // With Time (most specific)
    { format: 'M/d/yy h:mm a', precision: DatePrecision.TIME },
    { format: 'M/d/yy HH:mm', precision: DatePrecision.TIME },
    { format: 'MMM d yy h:mm a', precision: DatePrecision.TIME },
    { format: 'M/d/yyyy h:mm a', precision: DatePrecision.TIME },
    { format: 'M/d/yyyy HH:mm', precision: DatePrecision.TIME },
    { format: 'MMMM d yyyy h:mm a', precision: DatePrecision.TIME },
    { format: 'MMM d yyyy h:mm a', precision: DatePrecision.TIME },

    // Date only
    { format: 'M/d/yy', precision: DatePrecision.DAY },
    { format: 'd/M/yy', precision: DatePrecision.DAY },
    { format: 'MMM d yy', precision: DatePrecision.DAY },
    { format: 'M/d/yyyy', precision: DatePrecision.DAY },
    { format: 'd/M/yyyy', precision: DatePrecision.DAY },
    { format: 'MMMM d yyyy', precision: DatePrecision.DAY },
    { format: 'MMM d yyyy', precision: DatePrecision.DAY },
    { format: 'yyyy-MM-dd', precision: DatePrecision.DAY },

    // Month and Year
    { format: 'MMM yy', precision: DatePrecision.MONTH },
    { format: 'MMMM yyyy', precision: DatePrecision.MONTH },
    { format: 'MMM yyyy', precision: DatePrecision.MONTH },
    { format: 'yyyy-MM', precision: DatePrecision.MONTH },

    // Year only
    { format: 'yy', precision: DatePrecision.YEAR },
    { format: 'yyyy', precision: DatePrecision.YEAR },
  ]

  for (const { format: fmt, precision } of dateParsingConfig) {
    const parsedDate = parse(normalizedDateString, fmt, new Date())

    if (isValid(parsedDate)) {
      // When a date string without a timezone is parsed, date-fns creates a Date object
      // assuming the server's local timezone (e.g., UTC). This causes an off-by-one error.
      // To fix this, we use `fromZonedTime` to correctly interpret the parsed date
      // as a local time in the user's timezone and get the UTC equivalent.

      // Post-process two-digit years to ensure correct century.
      if (fmt.includes('yy') && !fmt.includes('yyyy')) {
        const year = parsedDate.getFullYear()
        const currentYear = new Date().getFullYear()
        // If date-fns parses '74' as 2074, correct it to the 20th century.
        if (year > currentYear) {
          parsedDate.setFullYear(year - 100)
        }
      }

      // Treat the parsed date as wall-clock time in the user's timezone
      // and get the corresponding UTC time for storage.
      const utcDate = fromZonedTime(parsedDate, timeZone)

      return { date: utcDate, precision }
    }
  }

  return null
}

export function formatDateForInput(
  date: Date,
  precision: DatePrecision,
): string {
  if (!date) return ''

  const timeZone = 'UTC'

  switch (precision) {
    case DatePrecision.YEAR:
      return format(date, 'yyyy', { timeZone })
    case DatePrecision.MONTH:
      return format(date, 'MMMM yyyy', { timeZone })
    case DatePrecision.DAY:
    case DatePrecision.TIME:
    default:
      return format(date, 'MMMM d, yyyy', { timeZone })
  }
}

export function truncate(str: string, n: number): string {
  if (!str) {
    return ''
  }
  return str.length > n ? str.slice(0, n) + '...' : str
}
