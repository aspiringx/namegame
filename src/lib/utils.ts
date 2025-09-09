import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { DatePrecision } from '@/generated/prisma/client'
import { isValid, parse } from 'date-fns'
import { format, toZonedTime } from 'date-fns-tz'

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
      // When a date string without timezone info is parsed, it's treated as local time on the server.
      // To get the correct UTC time that represents the start of the day in the user's timezone,
      // we use toZonedTime to convert the parsed (local) date to the correct UTC equivalent.
      const zonedDate = toZonedTime(parsedDate, timeZone)

      // Post-process two-digit years to ensure correct century.
      if (fmt.includes('yy')) {
        const year = zonedDate.getFullYear()
        const currentYear = new Date().getFullYear()

        // If date-fns parses a 2-digit year as a year between 0 and 99, it's ambiguous.
        if (year >= 0 && year < 100) {
          const correctedDate = new Date(zonedDate.getTime())
          correctedDate.setFullYear(year + 1900)
          return { date: correctedDate, precision }
        }

        // If date-fns parses a 'yy' value, it may choose the closest year in the future.
        // For example, in 2024, '74' becomes 2074. We correct this to 1974.
        if (year > currentYear + 30) {
          const correctedDate = new Date(zonedDate.getTime())
          correctedDate.setFullYear(year - 100)
          return { date: correctedDate, precision }
        }
      }

      return { date: zonedDate, precision }
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
