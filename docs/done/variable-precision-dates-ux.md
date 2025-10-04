# Design Doc: UX for Variable-Precision Dates

This document outlines the user experience (UX) and input strategy for the flexible date feature. It is a companion to `variable-precision-dates.md`.

## 1. Guiding Principles

- **Intuitive & Fast:** The input method should be as simple as possible, prioritizing speed for users who know what they want to enter.
- **Flexible:** It must accommodate a wide variety of formats naturally.
- **Avoid Ambiguity:** The system must intelligently handle regional differences in date formats (e.g., MM/DD/YY vs. DD/MM/YY).

## 2. Recommended UI Pattern: Smart Text Input

We will use a single text input field as the primary method for entering dates. This approach is flexible and avoids the friction of complex, multi-part date pickers.

### 2.1. Core Components

1.  **Text Input Field:** A standard text box with a clear placeholder like `"Enter a date or season..."`.
2.  **Helper Text:** A brief description below the input provides examples of valid formats: `e.g., "1990", "July 9, 1969", "Summer '69"`.
3.  **Progressive Disclosure (Optional):** A small calendar icon can be placed next to the field. Clicking it would reveal a traditional calendar widget for users who prefer a visual selection method for specific days.

## 3. Parsing and Interpretation Strategy

To handle the complexity of free-form text input, we will use a robust, third-party date parsing library.

### 3.1. Recommended Library: `date-fns`

`date-fns` is the ideal choice for this task due to its powerful and flexible parsing capabilities.

- **Flexible Format Recognition:** It can parse numerous string formats out-of-the-box, including:
  - `1969`
  - `7/9/69`
  - `July 9, 1969`
  - `Jul 9, 69`
  - `July 9, 69 at 7:25:03 PM`
- **Century Inference:** It correctly infers `69` as `1969` and `21` as `2021`.

### 3.2. Handling Localization (MM/DD vs. DD/MM)

This is a critical UX consideration. `date-fns` solves this elegantly through its `locale` support.

- **Process:** The application will detect the user's locale (from their browser or profile).
- **Parsing with Locale:** This locale will be passed to the `date-fns` parsing function. It will then correctly interpret ambiguous formats based on regional conventions.
  - `en-US` locale for `7/9/69` -> **July 9, 1969**
  - `es-CL` or `en-GB` locale for `7/9/69` -> **9 July 1969**

### 3.3. Handling Custom Inputs (Seasons)

A small pre-processing layer will be added to handle non-standard date terms.

1.  The input string is checked for seasonal keywords (`Summer`, `Winter`, etc.).
2.  If a keyword is found, it is extracted along with the hemisphere (inferred from locale).
3.  The remaining part of the string (e.g., "1969") is passed to `date-fns` for year parsing.
4.  The final data is assembled according to the rules in the main design document.
