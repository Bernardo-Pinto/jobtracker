'use client';

import { useState } from 'react';
import { Modal, Box, TextField, Button, Typography} from '@mui/material';
import Grid from '@mui/material/Grid2';
import * as React from 'react';

import { Application } from '../types'; // Import the Application type
import MenuItem from '@mui/material/MenuItem';
import { lastStepOptions, statusOptions } from '../constants/constants';
import { formatDate, parseDate } from '../lib/utils';

const box_style = {
    position: 'absolute',
    top: '50%',
    height: '80vh',
    overflow:'auto',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '60vh',
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
};



export default function AddApplicationModal(
    { open, onClose, funcUpdatedApplication  }:
    { open: boolean; onClose: () => void; funcUpdatedApplication: React.Dispatch<React.SetStateAction<boolean>>;}
    ) {
    const [application, setApplication] = useState<Omit<Application, 'id'>>({
        company: '',
        title: '',
        link: '',
        applied_on: formatDate(new Date()), // Will be manually entered
        salary_min: null,
        salary_max: null,
        status: statusOptions[0],
        last_step: lastStepOptions[0],
        last_updated: formatDate(new Date()), // Will be manually entered
        notes: '',
    });

    const handleSubmit = async () => {
        // Validate required fields
        if (
            !application.company ||
            !application.title ||
            !application.status ||
            !application.last_step ||
            !application.applied_on ||
            !application.last_updated
        ) {
            alert('Please fill out all required fields.');
            return;
        }

        // Convert date strings to Date objects
        const newApplication: Application = {
            ...application,
            id: 0, // The database will auto-generate this
            applied_on: parseDate(application.applied_on).toISOString(),
            last_updated: parseDate(application.last_updated).toISOString(),
            salary_min: application.salary_min ?? 0,
            salary_max: application.salary_max ?? 0
        };
        console.log(newApplication)
        console.log('newApplication: ' + JSON.stringify(newApplication))

        // here, call the API with the new application, since we are on client side,
        //  and can't call server side functions from here
        try {
            const response = await fetch('/api/application', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newApplication),
            });

            if (!response.ok) {
                console.log(' error: ' + response.statusText)
                throw new Error('Failed to add application');
            }

            const result = await response.json();
            console.log(result.message); // "Application added successfully"
            funcUpdatedApplication(prev => !prev);
            onClose(); // Close the modal after successful submission
        } catch (error) {
            console.error('Error adding application:', error);
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

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={box_style}>
                <Typography variant="h6" component="h2" gutterBottom>
                    Add New Application
                </Typography>
                <Grid
                container
                direction="row"
                sx={{
                    justifyContent: "space-around",
                    alignItems: "center",
                }}
                spacing={1}
                >
                    <Grid size={"auto"}>
                        <TextField
                            label="Company"
                            fullWidth
                            margin="normal"
                            value={application.company}
                            onChange={(e) => handleChange('company', e.target.value)}
                        />
                    </Grid>
                    <Grid size={"auto"}>
                        <TextField
                            label="Title"
                            fullWidth
                            margin="normal"
                            value={application.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                        />
                    </Grid>
                    <Grid size={"auto"}>
                    <TextField
                        label="Link"
                        fullWidth
                        margin="normal"
                        value={application.link}
                        onChange={(e) => handleChange('link', e.target.value)}
                    />  
                    </Grid>
                    <Grid size={"auto"}>
                        <TextField
                            label="Salary Min"
                            fullWidth
                            margin="normal"
                            type="number"
                            value={application.salary_min === null ? "" : application.salary_min} // Show empty if null
                            onChange={(e) => handleChange('salary_min', Number(e.target.value))}
                        />
                    </Grid>
                    <Grid size={"auto"}>
                        <TextField
                            label="Salary Max"
                            fullWidth
                            margin="normal"
                            type="number"
                            value={application.salary_max === null ? "" : application.salary_min} // Show empty if null
                            onChange={(e) => handleChange('salary_max', Number(e.target.value))}
                        />
                    </Grid>
                    <Grid size={"auto"}>
                        <TextField
                            label="Last Updated (dd-mm-yyyy)"
                            fullWidth
                            margin="normal"
                            value={application.last_updated}
                            onChange={(e) => handleChange('last_updated', e.target.value)}
                        />
                    </Grid>

                    <Grid size={"auto"}>
                        <TextField
                            label="Status"
                            select
                            fullWidth
                            margin="normal"
                            value={application.status}
                            onChange={(e) => handleChange('status', e.target.value)}
                        >
                            {statusOptions.map((option) => (
                                <MenuItem key={option} value={option}>
                                    {option}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid size={"auto"}>
                        <TextField
                            label="Last Step"
                            fullWidth
                            margin="normal"
                            select
                            value={application.last_step}
                            onChange={(e) => handleChange('last_step', e.target.value)}
                        >
                            {lastStepOptions.map((option) => (
                                <MenuItem key={option} value={option}>
                                    {option}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid size={"auto"}>
                        <TextField
                            label="Applied On (dd-mm-yyyy)"
                            fullWidth
                            margin="normal"
                            value={application.applied_on}
                            onChange={(e) => handleChange('applied_on', e.target.value)}
                        />
                    </Grid>


                    <TextField
                        label="Notes"
                        fullWidth
                        margin="normal"
                        multiline
                        rows={4}
                        value={application.notes}
                        onChange={(e) => handleChange('notes', e.target.value)}
                    />
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button onClick={onClose} sx={{ mr: 1 }}>
                            Cancel
                        </Button>
                        <Button variant="contained" onClick={handleSubmit}>
                            Save
                        </Button>
                    </Box>
                </Grid>
            </Box>
        </Modal>
    );
}