'use client';

import * as React from 'react';
import {useState } from 'react';

import { Button } from "@mui/material"
import { DataGrid, GridColDef} from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import DescriptionIcon from '@mui/icons-material/Description';
import {
    GridToolbarContainer,
    GridToolbarColumnsButton,
    GridToolbarFilterButton,
    GridToolbarDensitySelector,
    GridToolbarExport,
    GridRowModel
} from '@mui/x-data-grid';
import Snackbar from '@mui/material/Snackbar';
import Alert, { AlertProps } from '@mui/material/Alert';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AddApplicationModal from './add-application-modal'; // Import the modal
import { lastStepOptions, statusOptions, modalitiesOptions } from '../constants/constants';
import { Application } from '../types';

import { formatDate } from '../lib/utils';


let companyOptions:string[] = []
let columns: GridColDef[] = []


  

// Custom toolbar with centered controls
function CustomToolbar({ 
  funcUpdatedApplication, 
  onBulkDelete, 
  selectedCount 
}: { 
  funcUpdatedApplication: React.Dispatch<React.SetStateAction<boolean>>;
  onBulkDelete: () => void;
  selectedCount: number;
}) {

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
            <Button
              color="error"
              disabled={selectedCount === 0}
              onClick={onBulkDelete}
              startIcon={<DeleteIcon />}
              sx={{ mr: 2 }}
            >
              Delete Selected ({selectedCount})
            </Button>
        </GridToolbarContainer>
         <AddApplicationModal 
         open={modalOpen} 
         onClose={handleCloseModal} 
         funcUpdatedApplication={funcUpdatedApplication}
         />
         </>
    );
}

export default function CustomDataGrid({ applicationsData, funcUpdatedApplication }: { applicationsData: Application[]; funcUpdatedApplication: React.Dispatch<React.SetStateAction<boolean>> }){

  //const [rows, setRows] = React.useState<Application[]>(data.applicationsData);
  const [selectionModel, setSelectionModel] = React.useState<number[]>([]);
  const [snackbar, setSnackbar] = React.useState<Pick<
  AlertProps,
  'children' | 'severity'
> | null>(null);
  const [docsMap, setDocsMap] = React.useState<Record<number, { id: number; filename: string }[]>>({});

  function setColumns(applicationsData: Application[]){

    companyOptions = [...new Set(applicationsData.map((app) => app.company).filter(Boolean))];
    
    const statusColors: Record<string, string> = {
        Waiting: '#FFD600',         // Yellow
        Rejected: '#FF1744',        // Red
        'Needs action': '#2979FF',  // Blue (or use '#00E676' for Green)
    };

    columns = [
        { field: 'id', headerName: 'ID', width: 70 },
        { field: 'company', headerName: 'Company', width: 130, type: 'singleSelect', valueOptions: companyOptions, editable: true },
        { field: 'title', headerName: 'Title', width: 200, editable: true},
        {
            field: 'link',
            headerName: 'Link',
            width: 110,
            editable: true,
            renderCell: (params) => (
                <Button 
                variant="text" 
                onClick={() => window.open(params.value, '_blank', 'noopener,noreferrer')}
                >View Job</Button>
            ),
        },
        { field: 'applied_on', headerName: 'Applied On', width: 120, editable: true,
            renderCell: (params) => {
              const date = new Date(params.value);
              if (isNaN(date.getTime())) {
                return 'Invalid Date';
              }
              return formatDate(date);
          }, },
        { field: 'salary_min', headerName: 'Salary Min', width: 100, editable: true },
        { field: 'salary_max', headerName: 'Salary Max', width: 100, editable: true },
        { field: 'modality', headerName: 'Modality', width: 140, editable: true, type: 'singleSelect', valueOptions: modalitiesOptions },
        { field: 'docs', headerName: 'Docs', width: 180, sortable: false, filterable: false,
          renderCell: (params) => {
            const appId = Number(params.id);
            const docs = docsMap[appId] || [];
            return (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {docs.map((d) => (
                  <Tooltip key={d.id} title={d.filename} placement="top">
                    <a href={`/api/docs/${d.id}`} target="_blank" rel="noopener noreferrer" aria-label={d.filename}>
                      <DescriptionIcon fontSize="small" />
                    </a>
                  </Tooltip>
                ))}
              </div>
            );
          }
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 130,
            type: 'singleSelect',
            valueOptions: statusOptions, 
            editable: true,
            renderCell: (params) => (
            <div
                style={{
                  backgroundColor: statusColors[params.value] || 'transparent',
                  color: '#000000ff',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 500,
                  borderRadius: 0, // Remove rounded corners for full fill
                }}
              >
                    {params.value}
                </div>
            ),
        },
        {
            field: 'last_step',
            headerName: 'Last Step',
            width: 150,
            type: 'singleSelect',
            valueOptions: lastStepOptions, 
            editable: true
        },
        { field: 'last_updated', headerName: 'Last Updated On', width: 120, editable: false,
            renderCell: (params) => {
                const date = new Date(params.value);
                if (isNaN(date.getTime())) {
                  return 'Invalid Date';
                }
                return formatDate(date);
            }
         },
        { field: 'notes', headerName: 'Notes', width: 300, editable: true },
        { field: 'actions', headerName: 'Actions', width: 140, sortable: false, filterable: false,
          renderCell: (params) => {
            const appId = Number(params.id);
            const fileInputId = `upload-${appId}`;
            const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const fd = new FormData();
              fd.append('file', file);
              const res = await fetch(`/api/application/${appId}/docs`, { method: 'POST', body: fd });
              if (res.ok) {
                // refresh docs for this row only
                const r = await fetch(`/api/application/docs?ids=${appId}`);
                if (r.ok) {
                  const data: Record<number, { id: number; filename: string }[]> = await r.json();
                  setDocsMap((prev) => ({ ...prev, ...data }));
                }
              } else{
                const error = res.status == 413 ? 'File too large' 
                : res.status === 415 ? 'Unsupported file type' 
                : res.statusText || 'Unknown error';
                setSnackbar({ children: error, severity: 'error' });
              }
              // clear input so same file can be re-selected
              (e.target as HTMLInputElement).value = '';
            };
            return (
              <div>
                <input id={fileInputId} type="file" style={{ display: 'none' }} onChange={onPick} />
                <label htmlFor={fileInputId}>
                  <Button component="span" size="small" startIcon={<UploadFileIcon />}>Upload</Button>
                </label>
              </div>
            );
          }
        },
      ];
  }
  
  setColumns(applicationsData)

  const handleCloseSnackbar = () => setSnackbar(null);

  // Load docs map when applications change
  React.useEffect(() => {
    const ids = applicationsData.map((a) => a.id);
    if (ids.length === 0) {
      setDocsMap({});
      return;
    }
    const controller = new AbortController();
    const load = async () => {
      try {
        const res = await fetch(`/api/application/docs?ids=${ids.join(',')}`, { signal: controller.signal });
        if (!res.ok) return;
        const data: Record<number, { id: number; filename: string }[]> = await res.json();
        setDocsMap(data);
      } catch {
        /* ignore */
      }
    };
    load();
    return () => controller.abort();
  }, [applicationsData]);

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectionModel.length} applications?`)) return;

    try {
      await Promise.all(
        selectionModel.map(async id => {
          const response = await fetch(`/api/application/${id}`, { method: 'DELETE' });
          if (!response.ok) throw new Error(`Failed to delete application ${id}`);
        })
    );

    setSnackbar({ 
    children: `Successfully deleted ${selectionModel.length} applications`, 
    severity: 'success' 
    });

    // Trigger parent to refetch data
    funcUpdatedApplication(prev => !prev);

    // Clear selection
    setSelectionModel([]);

    } catch{
        setSnackbar({ 
          children: 'Failed to delete some applications', 
          severity: 'error' 
        });
      }
    };


  const processRowUpdate = React.useCallback(
    async (newRow: GridRowModel) => {

       // Coerce to numbers/null
      const min = newRow.salary_min === '' || newRow.salary_min == null ? null : Number(newRow.salary_min);
      const max = newRow.salary_max === '' || newRow.salary_max == null ? null : Number(newRow.salary_max);

    // Simple validation
    if ((min !== null && (isNaN(min) || min < 0)) ||
        (max !== null && (isNaN(max) || max < 0)) ||
        (min !== null && max !== null && min > max)) {
      throw new Error('Salary must be non-negative and min cannot exceed max.');
    }

      try {
        // Make a real PUT request to your API
        const response = await fetch(`/api/application/${newRow.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...newRow, modality: newRow.modality ?? null }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update application');
        }

        setSnackbar({ children: 'Application successfully saved', severity: 'success' });
        funcUpdatedApplication(prev => !prev);

        return newRow;
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        setSnackbar({ children: message, severity: 'error' });
        throw error;
      }
    },
  [funcUpdatedApplication],
  );

  const handleProcessRowUpdateError = React.useCallback((error: Error) => {
    setSnackbar({ children: error.message, severity: 'error' });
  }, []);
  
return (
    <div style={{height: '100vh'}}>
        <Paper sx={{ height: '80%', width: '100%' }}>
            <DataGrid
            rows={applicationsData}
            columns={columns}
            processRowUpdate={processRowUpdate}
            onProcessRowUpdateError={handleProcessRowUpdateError}
            paginationModel={{ page: 0, pageSize: applicationsData.length }} // Show all rows
            pageSizeOptions={[applicationsData.length]} // Only allow one page size
            initialState={{ 
                columns:{
                    columnVisibilityModel:{
                        id: false,
                    }
                }
            }}
            //pageSizeOptions={[20, 100]}
            checkboxSelection
            onRowSelectionModelChange={(ids) => setSelectionModel(ids as number[])}
            rowSelectionModel={selectionModel} 
            sx={{ 
                border: 0,
                //'& .MuiDataGrid-footerContainer': { // Hide the footer (pagination)
                 //   display: 'none',
                //},
             }}
            editMode="row"
            slots={{
                toolbar: () => <CustomToolbar 
                funcUpdatedApplication={funcUpdatedApplication}
                onBulkDelete={handleBulkDelete}
                selectedCount={selectionModel.length}
                />
              }}
              slotProps={{
                panel: {
                    placement: 'top-end', // Change the placement
                    disablePortal: true, // Keep the filter panel within the DOM
                },
            }}
            />
            {!!snackbar && (
        <Snackbar
          open
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          onClose={handleCloseSnackbar}
          autoHideDuration={6000}
        >
          <Alert {...snackbar} onClose={handleCloseSnackbar} />
        </Snackbar>
      )}
        </Paper>
    </div>
)
}



