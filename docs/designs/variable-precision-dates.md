# Design Doc: Flexible & Variable-Precision Dates

This document outlines the design for storing dates with varying levels of precision, including years, months, days, timestamps, and seasons.

*For details on the user interface and input parsing, see the companion document: [UX for Variable-Precision Dates](./variable-precision-dates-ux.md).*

## 1. Requirements

The system must be able to store and query dates with the following levels of precision:

- **Year:** `YYYY` (e.g., 1990)
- **Month:** `YYYY/MM` (e.g., 1990/07)
- **Day:** `YYYY/MM/DD` (e.g., 1990/07/15)
- **Timestamp:** `YYYY/MM/DD HH:MM:SS` (e.g., 1990/07/15 10:30:00)
- **Season:** A specific season within a year (e.g., Summer 1969)

## 2. Chosen Approach: DateTime with Precision Column

We will use a single `DateTime` column to store a canonical, sortable date, accompanied by metadata columns that describe the original precision.

### 2.1. Data Model

| Column Name      | Data Type            | Description                                                                                                |
| ---------------- | -------------------- | ---------------------------------------------------------------------------------------------------------- |
| `event_date`     | `DateTime` / `Timestamp` | Stores the full date. Missing information is padded, and seasonal dates are stored as a representative midpoint. |
| `date_precision` | `Enum` / `String`    | The user-provided precision: `YEAR`, `MONTH`, `DAY`, `TIMESTAMP`, `SEASON`.                                |
| `season`         | `Enum` / `String`    | (Nullable) The season, if applicable: `SPRING`, `SUMMER`, `AUTUMN`, `WINTER`.                              |
| `hemisphere`     | `Enum` / `String`    | (Nullable) The hemisphere for seasonal dates: `NORTHERN`, `SOUTHERN`. Crucial for correct interpretation.    |

### 2.2. Handling Seasons

- **Definition:** We will use **meteorological seasons**, which are more intuitive and align with calendar months.
  - **Northern Hemisphere:** Spring (Mar-May), Summer (Jun-Aug), Autumn (Sep-Nov), Winter (Dec-Feb).
  - **Southern Hemisphere:** Spring (Sep-Nov), Summer (Dec-Feb), Autumn (Mar-May), Winter (Jun-Aug).
- **Canonical Date:** The `event_date` for a season will be its meteorological midpoint. For example, the midpoint of Northern Hemisphere summer (June 1 - Aug 31) is **August 1st**.

## 3. Examples

| User Input                  | Hemisphere | `event_date`            | `date_precision` | `season` | `hemisphere` |
| --------------------------- | ---------- | ----------------------- | ---------------- | -------- | ------------ |
| `1985`                      | N/A        | `1985-01-01 00:00:00`   | `YEAR`           | `null`   | `null`       |
| `1992/07`                   | N/A        | `1992-07-01 00:00:00`   | `MONTH`          | `null`   | `null`       |
| `Summer 1969`               | Northern   | `1969-08-01 00:00:00`   | `SEASON`         | `SUMMER` | `NORTHERN`   |
| `Summer 1969`               | Southern   | `1969-02-01 00:00:00`   | `SEASON`         | `SUMMER` | `SOUTHERN`   |

## 4. Implementation Notes

- The application layer is responsible for parsing user input and calculating the correct `event_date`.
- The display logic must use the `date_precision`, `season`, and `hemisphere` columns to format the date correctly for the user (e.g., showing "Summer 1969" instead of "August 1, 1969").
- The application layer should handle aliases for seasons. For example, user input of "Fall" should be mapped to the canonical `AUTUMN` enum value before being stored in the database.
