'use client';

import { useState } from 'react';
import { Modal, Box, TextField, Button, Typography, AlertProps, Snackbar, Alert } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DescriptionIcon from '@mui/icons-material/Description';
import Grid from '@mui/material/Grid2';
import * as React from 'react';

import { Application, FieldValue } from '../types';
import MenuItem from '@mui/material/MenuItem';
// Options now come from /api/values instead of constants
import { formatDate, parseDate } from '../lib/utils';

const box_style = {
    position: 'absolute',
    top: '50%',
    height: '80vh',
    overflow: 'auto',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '60vh',
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
};

export default function AddApplicationModal(
    { open, onClose, funcUpdatedApplication }:
    { open: boolean; onClose: () => void; funcUpdatedApplication: React.Dispatch<React.SetStateAction<boolean>>; }
) {
    const [snackbar, setSnackbar] = useState<Pick<AlertProps, 'children' | 'severity'> | null>(null);
    const [files, setFiles] = useState<File[]>([]);

    const [statusOptions, setStatusOptions] = useState<Array<{ value: number; label: string }>>([]);
    const [lastStepOptions, setLastStepOptions] = useState<Array<{ value: number; label: string }>>([]);
    const [modalitiesOptions, setModalitiesOptions] = useState<Array<{ value: number; label: string }>>([]);
    const [optionsLoaded, setOptionsLoaded] = useState(false);

    const [application, setApplication] = useState<Omit<Application, 'id'>>({
        company: '',
        title: '',
        link: '',
        applied_on: formatDate(new Date()),
        salary_min: null,
        salary_max: null,
    modality: null,
    status: 0,
    last_step: 0,
        last_updated: formatDate(new Date()),
        notes: '',
    });

    React.useEffect(() => {
        let cancelled = false;
        const loadOptions = async () => {
            try {
                // Using shared FieldValue; only id and label are read here
                const [stRaw, lsRaw, moRaw] = await Promise.all([
                    fetch('/api/values?type=status').then((r) => r.json()),
                    fetch('/api/values?type=last_step').then((r) => r.json()),
                    fetch('/api/values?type=modality').then((r) => r.json()),
                ]);
                if (cancelled) return;
                const st = stRaw as FieldValue[];
                const ls = lsRaw as FieldValue[];
                const mo = moRaw as FieldValue[];
                // Only show active values in selects
                const sOpts = st.filter(x => x.is_active === 1).map((x) => ({ value: x.id, label: x.label }));
                const lOpts = ls.filter(x => x.is_active === 1).map((x) => ({ value: x.id, label: x.label }));
                const mOpts = mo.filter(x => x.is_active === 1).map((x) => ({ value: x.id, label: x.label }));
                setStatusOptions(sOpts);
                setLastStepOptions(lOpts);
                setModalitiesOptions(mOpts);
                setOptionsLoaded(true);
                // Set defaults if empty
                setApplication((prev) => ({
                    ...prev,
                    status: prev.status || (sOpts[0]?.value ?? 0),
                    last_step: prev.last_step || (lOpts[0]?.value ?? 0),
                    modality: prev.modality ?? (mOpts[0]?.value ?? null),
                }));
            } catch {
                // ignore
            }
        };
        if (open && !optionsLoaded) {
            loadOptions();
        }
        return () => {
            cancelled = true;
        };
    }, [open, optionsLoaded]);

    const handleSubmit = async () => {
        if (
            !application.company ||
            !application.title ||
            !application.status ||
            !application.last_step ||
            !application.applied_on ||
            !application.last_updated
        ) {
            setSnackbar({ children: 'Please fill out all required fields.', severity: 'error' });
            return;
        }

        const { salary_min: min, salary_max: max } = application;
        if (min !== null && min < 0) {
            setSnackbar({ children: 'Salary must be non-negative.', severity: 'error' });
            return;
        }
        if (max !== null && max < 0) {
            setSnackbar({ children: 'Salary must be non-negative.', severity: 'error' });
            return;
        }
        if (min !== null && max !== null && max < min) {
            setSnackbar({ children: 'Maximum salary cannot be less than minimum salary.', severity: 'error' });
            return;
        }

        const newApplication: Application = {
            ...application,
            id: 0,
            applied_on: parseDate(application.applied_on).toISOString(),
            last_updated: parseDate(application.last_updated).toISOString(),
            salary_min: application.salary_min ?? 0,
            salary_max: application.salary_max ?? 0,
            modality: application.modality ?? null,
        };
        console.log(newApplication)
        console.log('newApplication: ' + JSON.stringify(newApplication))

        try {
            const response = await fetch('/api/application', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newApplication),
            });

            if (!response.ok) {
                console.log(' error: ' + response.statusText)
                throw new Error('Failed to add application');
            }

            const result = await response.json();
            const newId = result.id as number | undefined;
            console.log(result.message);

            // Upload any selected files sequentially
            if (newId && files.length > 0) {
                for (const f of files) {
                    const fd = new FormData();
                    fd.append('file', f);
                    const up = await fetch(`/api/application/${newId}/docs`, { method: 'POST', body: fd });
                    if (!up.ok) {
                        const error = up.status == 413 ? 'File too large' 
                          : up.status === 415 ? 'Unsupported file type' 
                          : await up.text();
                        setSnackbar({ children: `Upload failed: ${error}`, severity: 'error' });
                    }
                }
            }

            funcUpdatedApplication(prev => !prev);
            onClose(); // Close the modal after successful submission
            setFiles([]);
        } catch (error) {
            console.error('Error adding application:', error);
            setSnackbar({ children: 'Failed to add application.', severity: 'error' });
        }
    };

    const handleChange = (field: keyof typeof application, value: string | number) => {
        setApplication((prev) => ({
            ...prev,
            [field]: 
            field === 'salary_min' || field === 'salary_max' // Check if the field is a number field
                ? value === "" ? null : Number(value) // Convert empty string to null for number fields
                : value
        }));
    };

    const handleCloseSnackbar = () => setSnackbar(null);

    return (
        <div>
            <Modal open={open} onClose={onClose}>
                <Box sx={box_style}>
                    <Typography variant="h6" component="h2" gutterBottom>
                        Add New Application
                    </Typography>

                                <Grid container spacing={2} columns={12}>
                                    <Grid size={6}>
                            <TextField label="Company" fullWidth margin="normal" value={application.company} onChange={(e) => handleChange('company', e.target.value)} />
                        </Grid>
                                    <Grid size={6}>
                            <TextField label="Title" fullWidth margin="normal" value={application.title} onChange={(e) => handleChange('title', e.target.value)} />
                        </Grid>
                                    <Grid size={6}>
                            <TextField label="Link" fullWidth margin="normal" value={application.link} onChange={(e) => handleChange('link', e.target.value)} />
                        </Grid>
                                    <Grid size={6}>
                            <TextField label="Modality" select fullWidth margin="normal" value={application.modality ?? ''} onChange={(e) => handleChange('modality', Number(e.target.value))} disabled={!optionsLoaded}>
                                {modalitiesOptions.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                                    <Grid size={6}>
                            <TextField label="Salary Min" fullWidth margin="normal" type="number" value={application.salary_min === null ? '' : application.salary_min} onChange={(e) => handleChange('salary_min', e.target.value)} inputProps={{ min: 0 }} />
                        </Grid>
                                    <Grid size={6}>
                            <TextField label="Salary Max" fullWidth margin="normal" type="number" value={application.salary_max === null ? '' : application.salary_max} onChange={(e) => handleChange('salary_max', e.target.value)} inputProps={{ min: 0 }} />
                        </Grid>
                                    <Grid size={6}>
                            <TextField label="Last Updated (dd-mm-yyyy)" fullWidth margin="normal" value={application.last_updated} onChange={(e) => handleChange('last_updated', e.target.value)} />
                        </Grid>
                                    <Grid size={6}>
                            <TextField label="Applied On (dd-mm-yyyy)" fullWidth margin="normal" value={application.applied_on} onChange={(e) => handleChange('applied_on', e.target.value)} />
                        </Grid>
                                    <Grid size={6}>
                            <TextField label="Status" select fullWidth margin="normal" value={application.status} onChange={(e) => handleChange('status', Number(e.target.value))} disabled={!optionsLoaded}>
                                {statusOptions.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                                    <Grid size={6}>
                            <TextField label="Last Step" select fullWidth margin="normal" value={application.last_step} onChange={(e) => handleChange('last_step', Number(e.target.value))} disabled={!optionsLoaded}>
                                {lastStepOptions.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                                                                        <Grid size={12}>
                            <TextField label="Notes" fullWidth margin="normal" multiline rows={4} value={application.notes} onChange={(e) => handleChange('notes', e.target.value)} />
                        </Grid>

                                                {/* Documents picker */}
                                                <Grid size={12}>
                                                    <input
                                                        id="new-app-docs"
                                                        type="file"
                                                        multiple
                                                        style={{ display: 'none' }}
                                                        onChange={(e) => {
                                                            const list = Array.from(e.target.files ?? []);
                                                            setFiles(list);
                                                        }}
                                                    />
                                                    <label htmlFor="new-app-docs">
                                                        <Tooltip title="Attach documents (pdf, doc, docx, txt; max 200KB each)">
                                                            <IconButton component="span" size="small" aria-label="Attach documents">
                                                                <UploadFileIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                                                            {files.length === 0 ? 'No files selected' : `${files.length} file(s) selected`}
                                                        </Typography>
                                                    </label>
                                                    {files.length > 0 && (
                                                        <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                            {files.map((f, idx) => (
                                                                <Tooltip key={idx} title={f.name} placement="top">
                                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                                        <DescriptionIcon fontSize="small" />
                                                                        <Typography variant="caption" sx={{ maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                            {f.name}
                                                                        </Typography>
                                                                    </span>
                                                                </Tooltip>
                                                            ))}
                                                        </Box>
                                                    )}
                                                </Grid>

                                    <Grid size={12}>
                            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                <Button onClick={onClose} sx={{ mr: 1 }}>
                                    Cancel
                                </Button>
                                <Button variant="contained" onClick={handleSubmit} disabled={!optionsLoaded}>
                                    Save
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </Modal>
            {!!snackbar && (
                <Snackbar open anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} onClose={handleCloseSnackbar} autoHideDuration={6000}>
                    <Alert {...snackbar} onClose={handleCloseSnackbar} />
                </Snackbar>
            )}
        </div>
    );
}