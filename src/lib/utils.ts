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
  // Special handling for two-digit years to avoid date-fns ambiguity
  if (/^\d{2}$/.test(dateString)) {
    const inputYear = parseInt(dateString, 10)
    const currentYear = new Date().getFullYear()
    const currentCentury = Math.floor(currentYear / 100) * 100
    const lastTwoDigitsOfCurrentYear = currentYear % 100

    const fullYear =
      inputYear > lastTwoDigitsOfCurrentYear
        ? currentCentury - 100 + inputYear // e.g., in 2025, '77' becomes 1977
        : currentCentury + inputYear // e.g., in 2025, '15' becomes 2015

    return {
      date: new Date(fullYear, 0, 1), // Create date for Jan 1st of the correct year
      precision: DatePrecision.YEAR,
    }
  }

  // Special handling for MM/dd/yy or M/d/yy formats
  const twoDigitYearMatch = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/)
  if (twoDigitYearMatch) {
    const [, month, day, yearStr] = twoDigitYearMatch
    let year = parseInt(yearStr, 10)
    const currentYear = new Date().getFullYear()
    const currentCentury = Math.floor(currentYear / 100) * 100
    const currentTwoDigitYear = currentYear % 100

    if (year > currentTwoDigitYear) {
      year = currentCentury - 100 + year
    } else {
      year = currentCentury + year
    }

    const parsedDate = new Date(
      year,
      parseInt(month, 10) - 1,
      parseInt(day, 10),
    )
    if (!isNaN(parsedDate.getTime())) {
      return { date: parsedDate, precision: DatePrecision.DAY }
    }
  }

  const dateParsingConfig = [
    // Order matters: more specific formats first

    // Time precision
    { format: "MMMM d, yyyy 'at' HH:mm", precision: DatePrecision.TIME },
    { format: "MMM d yyyy 'at' HH:mm", precision: DatePrecision.TIME },
    { format: "MMM d yyyy 'at' h:mm a", precision: DatePrecision.TIME },
    { format: 'M/d/yyyy HH:mm', precision: DatePrecision.TIME },
    { format: 'M/d/yyyy h:mm a', precision: DatePrecision.TIME },
    { format: 'yyyy-MM-dd HH:mm', precision: DatePrecision.TIME },

    // Day precision
    { format: 'M/d/yyyy', precision: DatePrecision.DAY },
    { format: 'MMM d yyyy', precision: DatePrecision.DAY },
    { format: 'MMMM d, yyyy', precision: DatePrecision.DAY },
    { format: 'yyyy-MM-dd', precision: DatePrecision.DAY },

    // Month precision
    { format: 'MMMM yyyy', precision: DatePrecision.MONTH },
    { format: 'MMM yyyy', precision: DatePrecision.MONTH },
    { format: 'yyyy-MM', precision: DatePrecision.MONTH },

    // Year precision
    { format: 'yyyy', precision: DatePrecision.YEAR },
  ]
  for (const { format, precision } of dateParsingConfig) {
    const parsedDate = parse(dateString, format, new Date())

    if (isValid(parsedDate)) {
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
