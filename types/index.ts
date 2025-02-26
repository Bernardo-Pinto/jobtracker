export interface Application {
    id: number;
    company: string;
    title: string;
    link: string;
    applied_on: Date;
    salary_min: number | null;
    salary_max: number | null;
    status: string;
    last_step: string;
    last_updated: Date;
    notes: string;
}