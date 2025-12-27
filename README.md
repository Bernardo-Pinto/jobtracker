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

### Persisting the SQLite database across updates

This app is configured to store the SQLite DB on a Docker volume so your data survives image upgrades and container restarts.

- Inside the container, the DB path is `/data/database.db` (set via `ENV DATABASE_PATH=/data/database.db`).
- The Dockerfile declares `VOLUME ["/data"]`, so mounting a volume at `/data` persists the database.

Run with a named volume (Windows PowerShell examples):

```powershell
# Build image
docker build -t jobtracker:latest .

# Create the named volume once
docker volume create jobtracker-data

#Tag with imageID and push
docker tag <iID> bernardortp2/jobtracker:latest
docker push bernardortp2/jobtracker:latest

# Run the app with the volume mounted at /data
docker run -d --name jobtracker -p 3000:3000 -v jobtracker-data:/data jobtracker:latest
```

Notes:
- On first run with an empty volume, the app auto-creates the schema.
- If you don’t pass a `-v` mount, Docker creates an anonymous volume for `/data` that won’t be reused by new containers.

---

## Schema migrations (data-safe upgrades)

This project uses simple, file-based SQL migrations that run automatically when the app opens the database.

- Migration files live in `migrations/` and must end with `.sql`.
- Files are applied in lexical order once, and each applied filename is recorded in the `_migrations` table.
- The DB path is controlled by `DATABASE_PATH` (defaults to `./database.db`; in Docker it’s `/data/database.db`).

Included files:
- `migrations/000_initial_schema.sql` — creates the `applications` table on fresh databases.
- `migrations/001_add_column_modality.sql` — adds `modality` column and backfills unknown values.

How migrations run:
- In code: `lib/db.ts` calls `runMigrations(db)` during `openDb()`. Any request that touches the DB will apply pending migrations.
- Locally (on demand): run `scripts/initDb.ts` to force-run migrations without starting the app.

```powershell
# Apply migrations locally (Windows PowerShell)
npx tsx scripts/initDb.ts
```

Adding a new schema change:
1) Create a new file, e.g. `migrations/002_add_example.sql`.
2) Put your SQL inside (e.g., `ALTER TABLE applications ADD COLUMN example TEXT;`).
3) Commit, build, and deploy your image. The migration will apply once against the existing DB on the volume.

Backup before big changes (recommended):
```powershell
# Create a compressed backup of the volume to the current folder
docker run --rm -v jobtracker-data:/data -v ${PWD}:/backup alpine sh -lc "cd /data && tar czf /backup/jobtracker-data_$(date +%Y%m%d%H%M%S).tgz ."
```

Restore (if needed):
```powershell
docker run --rm -v jobtracker-data:/data -v ${PWD}:/backup alpine sh -lc "cd /data && rm -f database.db && tar xzf /backup/<your-backup>.tgz"
```

## Issue Tracker
https://trello.com/b/5rxISNNw/jobseeker
