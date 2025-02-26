'use client';

import * as React from 'react';
import { useState } from 'react';

import { Button } from "@mui/material"
import { DataGrid, GridColDef} from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import {
    GridToolbarContainer,
    GridToolbarColumnsButton,
    GridToolbarFilterButton,
    GridToolbarDensitySelector,
    GridToolbarExport,
} from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import AddApplicationModal from './add-application-modal'; // Import the modal
import { lastStepOptions, statusOptions } from '../constants/constants';

import applications from '../demo-data/applications-data'

// Dynamically generate valueOptions for company
const companyOptions = [...new Set(applications.map((row) => row.Company).filter(Boolean))];

const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'Company', headerName: 'Company', width: 130, type: 'singleSelect', valueOptions: companyOptions },
    { field: 'Title', headerName: 'Title', width: 200},
    {
        field: 'Link',
        headerName: 'Link',
        width: 110,
        renderCell: (params) => (
            <Button 
            variant="text" 
            onClick={() => window.open(params.value, '_blank', 'noopener,noreferrer')}
            >View Job</Button>
        ),
    },
    { field: 'Applied On', headerName: 'Applied On', width: 120 },
    { field: 'Salary', headerName: 'Salary', width: 100 },
    {
        field: 'Status',
        headerName: 'Status',
        width: 130,
        type: 'singleSelect',
        valueOptions: statusOptions
    },
    {
        field: 'Last Step',
        headerName: 'Last Step',
        width: 150,
        type: 'singleSelect',
        valueOptions: lastStepOptions
    },
    { field: 'notes', headerName: 'Notes', width: 300 },
];

// Custom toolbar with centered controls
function CustomToolbar() {

    const [modalOpen, setModalOpen] = useState(false);

    const handleOpenModal = () => setModalOpen(true);
    const handleCloseModal = () => setModalOpen(false);

    return (
        <>
        <GridToolbarContainer            
            sx={{
                display: 'flex',
                justifyContent: 'center', // Center horizontally
                alignItems: 'center', // Center vertically
            }}
        >
            {/* Add your custom button */}
            <Button 
                variant="text" 
                size="small" 
                startIcon={<AddIcon />}
                onClick={handleOpenModal} // Open the modal on click
            > 
                Add Application
            </Button>

            {/* Include the default GridToolbar buttons */}
            <GridToolbarColumnsButton />
            <GridToolbarFilterButton />
            <GridToolbarDensitySelector />
            <GridToolbarExport />
        </GridToolbarContainer>
         <AddApplicationModal open={modalOpen} onClose={handleCloseModal} />
         </>
    );
}

export default function customDataGrid(){
return (
    <div style={{height: '100vh'}}>
        <Paper sx={{ height: '80%', width: '100%' }}>
            <DataGrid
            rows={applications}
            columns={columns}
            paginationModel={{ page: 0, pageSize: applications.length }} // Show all rows
            pageSizeOptions={[applications.length]} // Only allow one page size
            initialState={{ 
                columns:{
                    columnVisibilityModel:{
                        id: false,
                    }
                }
            }}
            //pageSizeOptions={[20, 100]}
            checkboxSelection
            sx={{ 
                border: 0,
                //'& .MuiDataGrid-footerContainer': { // Hide the footer (pagination)
                 //   display: 'none',
                //},
             }}
            editMode="row"
            slots={{
                toolbar: CustomToolbar
              }}
              slotProps={{
                panel: {
                    placement: 'top-end', // Change the placement
                    disablePortal: true, // Keep the filter panel within the DOM
                },
            }}
            />
        </Paper>
    </div>
)
}



