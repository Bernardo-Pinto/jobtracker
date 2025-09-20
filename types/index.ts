export interface Application {
    id: number;
    company: string;
    title: string;
    link: string;
    applied_on: string;
    salary_min: number | null;
    salary_max: number | null;
    modality: string | null;
    status: string;
    last_step: string;
    last_updated: string;
    notes: string;
}