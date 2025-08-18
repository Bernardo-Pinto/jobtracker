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

## Customization

- Update `constants/constants.ts` for custom status, steps, or month names.
- Modify `components/data-grid.tsx` for UI changes.

---

## Technologies Used

- **Frontend**: Next.js 15, React 19, Material-UI (MUI), TypeScript
- **Backend**: Next.js API Routes, better-sqlite3
- **Database**: SQLite
- **Styling**: CSS Modules, Material-UI components
- **Deployment**: Docker support included

## Project Structure

```
jobtracker/
├── app/
│   ├── api/application/          # API routes for job applications
│   │   ├── route.ts             # GET (all), POST (create)
│   │   └── [id]/route.ts        # GET, PUT, DELETE (single application)
│   ├── (pages)/applications/    # Application pages
│   └── globals.css              # Global styles
├── components/
│   ├── data-grid.tsx           # Main data grid component with bulk delete
│   └── add-application-modal.tsx # Modal for adding new applications
├── lib/
│   ├── db.ts                   # Database connection and queries
│   └── utils.ts                # Utility functions (date formatting)
├── types/
│   └── index.ts                # TypeScript type definitions
├── constants/
│   └── constants.ts            # Application constants (status, steps, etc.)
├── demo-data/
│   └── applications-data.ts    # Sample data for development
├── scripts/
│   └── initDb.ts              # Database initialization script
├── database.db               # SQLite database file
├── Dockerfile               # Docker configuration
└── README.md
```
---

## Using Docker

1. **Build the Docker image**
   ```bash
   docker build -t jobtracker .
   ```

2. **Run the container**
   ```bash
   docker run -p 3000:3000 jobtracker
   ```

## Issue Tracker
https://trello.com/b/5rxISNNw/jobseeker
