# JobTracker

A Next.js application for tracking job applications with a SQLite database.

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Initialize the Database

You can initialize the database using the provided TypeScript script:

```bash
npx tsx scripts/initDb.ts
```

This will create the `applications` table in `database.db` if it doesn't exist.

> **Note:**  
> Make sure you have `tsx` installed as a dev dependency:
> ```bash
> npm install --save-dev tsx
> ```

### 3. Running the App

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

---

## API Routes

- **GET `/api/application`**  
  Returns all applications.

- **POST `/api/application`**  
  Adds a new application.

- **PUT `/api/application/[id]`**  
  Updates an application by ID.

- **DELETE `/api/application/[id]`**  
  Deletes an application by ID.

---

## Project Structure & Useful Info

- **TypeScript types:**  
  `types/index.ts`
- **Database logic:**  
  `lib/db.ts`
- **Date formatting utilities:**  
  `lib/utils.ts`  
  - `formatDate(date: Date): string` formats a date as `"dd-Month-yyyy"`.
  - `parseDate(dateString: string): Date` parses a `"dd-Month-yyyy"` string into a `Date` object.
- **Demo data:**  
  `demo-data/applications-data.ts`
- **Main UI:**  
  `components/data-grid.tsx`
- **Constants:**  
  `constants/constants.ts` (status, steps, month names, etc.)

---

## Customization

- Update `constants/constants.ts` for custom status, steps, or month names.
- Modify `components/data-grid.tsx` for UI changes.

---

## Issue Tracker
https://trello.com/b/5rxISNNw/jobseeker
