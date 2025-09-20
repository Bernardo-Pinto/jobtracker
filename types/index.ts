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

export interface ApplicationDoc {
    id: number;
    application_id: number;
    filename: string;
    mime_type: string;
    stored_path: string;
    uploaded_at: string;
}