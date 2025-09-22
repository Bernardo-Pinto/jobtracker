export interface Application {
    id: number;
    company: string;
    title: string;
    link: string;
    applied_on: string;
    salary_min: number | null;
    salary_max: number | null;
    modality: number | null; // field_values id or null
    status: number; // field_values id
    last_step: number; // field_values id
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

// Shared value types for configurable picklists
export type ValueType = 'status' | 'last_step' | 'modality';

export interface FieldValue {
    id: number;
    type: ValueType;
    key: string;
    label: string;
    color: string | null;
    sort_order: number;
    priority_group: 'needs_action' | 'waiting' | 'other' | null;
    is_active: 0 | 1;
    usageCount?: number;
}