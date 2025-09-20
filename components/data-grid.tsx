'use client';

import * as React from 'react';
import {useState } from 'react';

import { Button } from "@mui/material"
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import { DataGrid, GridColDef, GridRenderCellParams, GridRenderEditCellParams } from '@mui/x-data-grid';
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
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import NotesIcon from '@mui/icons-material/Notes';
import AddApplicationModal from './add-application-modal'; // Import the modal
import { lastStepOptions, statusOptions, modalitiesOptions } from '../constants/constants';
import { Application } from '../types';

import { formatDate } from '../lib/utils';


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
  // Notes dialog state
  const [notesDialogOpen, setNotesDialogOpen] = React.useState(false);
  const [notesEditMode, setNotesEditMode] = React.useState(false);
  const [notesDraft, setNotesDraft] = React.useState('');
  const [notesRow, setNotesRow] = React.useState<Application | null>(null);

  function setColumns(){
    
    
    const statusColors: Record<string, string> = {
        Waiting: '#FFD600',         // Yellow
        Rejected: '#FF1744',        // Red
        'Needs action': '#2979FF',  // Blue (or use '#00E676' for Green)
    };

    columns = [
        { field: 'id', headerName: 'ID', width: 70 },
        { 
          field: 'company', 
          headerName: 'Company', 
          flex: 1, 
          minWidth: 120,
          editable: true,
          renderCell: (params) => (
            <Tooltip title={params.value || ''} placement="top">
              <span style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                {params.value}
              </span>
            </Tooltip>
          ),
        },
        { 
          field: 'title', 
          headerName: 'Title', 
          flex: 1.5, 
          minWidth: 160,
          editable: true,
          renderCell: (params) => (
            <Tooltip title={params.value || ''} placement="top">
              <span style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                {params.value}
              </span>
            </Tooltip>
          ),
        },
        {
            field: 'link',
            headerName: 'Link',
            width: 56,
            editable: true,
            renderCell: (params) => {
              const raw = (params.row as { link?: string }).link || '';
              const trimmed = raw.trim();
              if (!trimmed) {
                return (
                  <Tooltip title="No link" placement="top">
                    <span>
                      <LinkOffIcon fontSize="small" color="disabled" />
                    </span>
                  </Tooltip>
                );
              }
              const hasScheme = /^(https?:)?\/\//i.test(trimmed);
              const normalized = hasScheme ? trimmed : `https://${trimmed}`;
              const onClick = (e: React.MouseEvent) => {
                e.stopPropagation();
                window.open(normalized, '_blank', 'noopener,noreferrer');
              };
              return (
                <Tooltip title={normalized} placement="top">
                  <IconButton aria-label="Open link" size="small" onClick={onClick}>
                    <OpenInNewIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              );
            },
        },
        { field: 'applied_on', headerName: 'Applied On', width: 120, editable: true,
            renderCell: (params) => {
              const date = new Date(params.value);
              if (isNaN(date.getTime())) {
                return 'Invalid Date';
              }
              return formatDate(date);
          }, },
        {
          field: 'salary',
          headerName: 'Salary',
          width: 120,
          sortable: true,
          filterable: true,
          type: 'number',
          valueGetter: (params) => {
            type RowShape = { salary_min?: number | null; salary_max?: number | null };
            const p = params as unknown as { row?: RowShape } | undefined;
            const r = p?.row;
            const min = (r && (typeof r.salary_min === 'number' || r.salary_min === null)) ? r.salary_min : null;
            const max = (r && (typeof r.salary_max === 'number' || r.salary_max === null)) ? r.salary_max : null;
            return min ?? max ?? null;
          },
          renderCell: (params: GridRenderCellParams) => {
            const row = params.row as { salary_min: number | null; salary_max: number | null };
            const min = row.salary_min as number | null;
            const max = row.salary_max as number | null;
            const fmt = (n: number | null) => {
              if (n == null) return '';
              if (Math.abs(n) < 1000) return String(n);
              const k = n / 1000;
              const text = Number.isInteger(k) ? String(k) : (Math.abs(n) % 1000 === 0 ? String(k) : k.toFixed(1));
              return `${text}k`;
            };
            return <span>{fmt(min)}{min != null || max != null ? '–' : ''}{fmt(max)}</span>;
          },
          editable: true,
          renderEditCell: (params: GridRenderEditCellParams<GridRowModel>) => {
            const row = params.row as GridRowModel;
            const min = row.salary_min as number | null;
            const max = row.salary_max as number | null;
            const onChange = (which: 'min' | 'max') => (e: React.ChangeEvent<HTMLInputElement>) => {
              const val = e.target.value === '' ? null : Number(e.target.value);
              const field = which === 'min' ? 'salary_min' : 'salary_max';
              params.api.setEditCellValue({ id: params.id, field, value: val }, e);
            };
            return (
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <input type="number" style={{ width: 50 }} defaultValue={min ?? ''} onChange={onChange('min')} />
                <span>–</span>
                <input type="number" style={{ width: 50 }} defaultValue={max ?? ''} onChange={onChange('max')} />
              </div>
            );
          },
        },
  // Hidden underlying fields to support editing via the composite Salary column
  { field: 'salary_min', headerName: 'Salary Min', width: 90, editable: true },
  { field: 'salary_max', headerName: 'Salary Max', width: 90, editable: true },
        { field: 'modality', headerName: 'Modality', width: 140, editable: true, type: 'singleSelect', valueOptions: modalitiesOptions },
        {
            field: 'status',
            headerName: 'Status',
            width: 130,
            type: 'singleSelect',
            valueOptions: statusOptions, 
            editable: true,
            renderCell: (params) => {
              const label = String(params.value ?? '');
              const color = statusColors[label] || '#9e9e9e';
              return (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Tooltip title={label} placement="top">
                    <span
                      aria-label={label}
                      style={{
                        display: 'inline-block',
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        backgroundColor: color,
                      }}
                    />
                  </Tooltip>
                </div>
              );
            },
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
        { 
          field: 'notes', 
          headerName: 'Notes', 
          width: 56, 
          align: 'center',
          headerAlign: 'center',
          sortable: false,
          filterable: false,
          editable: false,
          renderCell: (params) => {
            const v = (params.value ?? '') as string;
            if (!v || !v.trim()) return null;
            const firstLine = v.split(/\r?\n/)[0].trim();
            const truncated = firstLine.length > 80 ? `${firstLine.slice(0, 77)}...` : firstLine;
            const onOpen = (e: React.MouseEvent) => {
              e.stopPropagation();
              setNotesRow(params.row as Application);
              setNotesDraft(v);
              setNotesEditMode(false);
              setNotesDialogOpen(true);
            };
            return (
              <Tooltip title={truncated} placement="top">
                <IconButton size="small" onClick={onOpen} aria-label="View notes">
                  <NotesIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            );
          },
        },
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
  
  setColumns()

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

  // Notes dialog handlers
  const closeNotesDialog = () => {
    setNotesDialogOpen(false);
    setNotesEditMode(false);
    setNotesDraft('');
    setNotesRow(null);
  };

  const saveNotes = async () => {
    if (!notesRow) return;
    const updated: Application = {
      ...notesRow,
      notes: notesDraft,
    };
    try {
      const res = await fetch(`/api/application/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || res.statusText || 'Failed to save notes');
      }
      setSnackbar({ children: 'Notes saved', severity: 'success' });
      funcUpdatedApplication((p) => !p);
      closeNotesDialog();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setSnackbar({ children: msg, severity: 'error' });
    }
  };

  const copyNotes = async () => {
    try {
      await navigator.clipboard.writeText(notesDraft);
      setSnackbar({ children: 'Copied to clipboard', severity: 'success' });
    } catch {
      setSnackbar({ children: 'Copy failed', severity: 'error' });
    }
  };
  
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
                        salary_min: false,
                        salary_max: false,
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
            <Dialog open={notesDialogOpen} onClose={closeNotesDialog} fullWidth maxWidth="sm">
              <DialogTitle>Notes{notesRow ? ` — ${notesRow.company} • ${notesRow.title}` : ''}</DialogTitle>
              <DialogContent dividers>
                {notesEditMode ? (
                  <TextField
                    autoFocus
                    multiline
                    minRows={8}
                    fullWidth
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                  />
                ) : (
                  <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{notesDraft}</div>
                )}
              </DialogContent>
              <DialogActions>
                {!notesEditMode && (
                  <Button onClick={copyNotes}>Copy</Button>
                )}
                {!notesEditMode && (
                  <Button onClick={() => setNotesEditMode(true)}>Edit</Button>
                )}
                {notesEditMode && (
                  <Button onClick={() => setNotesEditMode(false)}>Cancel</Button>
                )}
                {notesEditMode && (
                  <Button variant="contained" onClick={saveNotes}>Save</Button>
                )}
                {!notesEditMode && (
                  <Button onClick={closeNotesDialog}>Close</Button>
                )}
              </DialogActions>
            </Dialog>
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



