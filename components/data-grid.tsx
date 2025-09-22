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
import { DataGrid, GridColDef, GridRenderCellParams, GridRenderEditCellParams, useGridApiRef } from '@mui/x-data-grid';
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
import FieldValuesDialog from './field-values-dialog';
import { Application, FieldValue } from '../types';

import { formatDate } from '../lib/utils';


let columns: GridColDef[] = []


  

// Custom toolbar with centered controls
function CustomToolbar({ 
  funcUpdatedApplication, 
  onBulkDelete, 
  selectedCount,
  onConfigClosed,
}: { 
  funcUpdatedApplication: React.Dispatch<React.SetStateAction<boolean>>;
  onBulkDelete: () => void;
  selectedCount: number;
  onConfigClosed: () => void;
}) {

    const [modalOpen, setModalOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);

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
        <Button size="small" onClick={() => setConfigOpen(true)} sx={{ ml: 1 }}>Configure fields</Button>
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
  <FieldValuesDialog open={configOpen} onClose={() => { setConfigOpen(false); onConfigClosed(); funcUpdatedApplication((p)=>!p); }} />
         </>
    );
}

export default function CustomDataGrid({ applicationsData, funcUpdatedApplication }: { applicationsData: Application[]; funcUpdatedApplication: React.Dispatch<React.SetStateAction<boolean>> }){

  //const [rows, setRows] = React.useState<Application[]>(data.applicationsData);
  const apiRef = useGridApiRef();
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [selectionModel, setSelectionModel] = React.useState<number[]>([]);
  const [snackbar, setSnackbar] = React.useState<Pick<
  AlertProps,
  'children' | 'severity'
> | null>(null);
  const [docsMap, setDocsMap] = React.useState<Record<number, { id: number; filename: string }[]>>({});
  const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);
  // Notes dialog state
  const [notesDialogOpen, setNotesDialogOpen] = React.useState(false);
  const [notesEditMode, setNotesEditMode] = React.useState(false);
  const [notesDraft, setNotesDraft] = React.useState('');
  const [notesRow, setNotesRow] = React.useState<Application | null>(null);
  // Trigger autosize on actual window resizes
  const [resizeTick, setResizeTick] = React.useState(0);

  const [statusOptions, setStatusOptions] = React.useState<Array<{ value: number; label: string }>>([]);
  const [lastStepOptions, setLastStepOptions] = React.useState<Array<{ value: number; label: string }>>([]);
  const [modalitiesOptions, setModalitiesOptions] = React.useState<Array<{ value: number; label: string }>>([]);
  const [statusColors, setStatusColors] = React.useState<Record<number, string>>({});
  const [labelById, setLabelById] = React.useState<{ status: Record<number, string>; last_step: Record<number, string>; modality: Record<number, string>}>({ status: {}, last_step: {}, modality: {} });
  const [valuesLoaded, setValuesLoaded] = React.useState(false);
  const [valuesTick, setValuesTick] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      try {
  // Use shared FieldValue; we'll only read id/label/color
        const [stRaw, lsRaw, moRaw] = await Promise.all([
          fetch('/api/values?type=status').then((r) => r.json()),
          fetch('/api/values?type=last_step').then((r) => r.json()),
          fetch('/api/values?type=modality').then((r) => r.json()),
        ]);
        if (cancelled) return;
  const st = stRaw as FieldValue[];
  const ls = lsRaw as FieldValue[];
  const mo = moRaw as FieldValue[];
  // Only expose active values in editors/selects
  setStatusOptions(st.filter(x => x.is_active === 1).map((x) => ({ value: x.id, label: x.label })));
        const colorMap: Record<number, string> = {};
        for (const v of st) {
          if (v.color) colorMap[v.id] = v.color.startsWith('#') ? v.color : `#${v.color}`;
        }
        setStatusColors(colorMap);
  setLastStepOptions(ls.filter(x => x.is_active === 1).map((x) => ({ value: x.id, label: x.label })));
  setModalitiesOptions(mo.filter(x => x.is_active === 1).map((x) => ({ value: x.id, label: x.label })));
  setLabelById({
          status: Object.fromEntries(st.map(v => [v.id, v.label])),
          last_step: Object.fromEntries(ls.map(v => [v.id, v.label])),
          modality: Object.fromEntries(mo.map(v => [v.id, v.label])),
        });
  setValuesLoaded(true);
      } catch {
        // ignore
      }
    };
    fetchAll();
    return () => { cancelled = true; };
  }, [valuesTick]);

  function setColumns(){

    columns = [
        { field: 'id', headerName: 'ID', width: 70, align: 'center', headerAlign: 'center' },
        { 
          field: 'company', 
          headerName: 'Company', 
          minWidth: 80,
          align: 'center',
          headerAlign: 'center',
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
          minWidth: 100,
          align: 'center',
          headerAlign: 'center',
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
            align: 'center',
            headerAlign: 'center',
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
        { field: 'applied_on', headerName: 'Applied On', width: 120, editable: true, align: 'center', headerAlign: 'center',
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
          align: 'center',
          headerAlign: 'center',
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
  { field: 'salary_min', headerName: 'Salary Min', width: 90, editable: true, align: 'center', headerAlign: 'center' },
  { field: 'salary_max', headerName: 'Salary Max', width: 90, editable: true, align: 'center', headerAlign: 'center' },
  { field: 'modality', headerName: 'Modality', editable: true, type: 'singleSelect', valueOptions: modalitiesOptions, align: 'center', headerAlign: 'center', minWidth: 200,
    valueFormatter: (p: { value: unknown }) => labelById.modality[Number(p.value)] ?? '',
    renderCell: (params) => {
      const id = Number(params.value);
      const label = labelById.modality[id] ?? '';
      return (
        <Tooltip title={label} placement="top">
          <span style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{label}</span>
        </Tooltip>
      );
    }
  },
        {
            field: 'status',
            headerName: 'Status',
            // width will be autosized; keep initial small to avoid excess
            width: 60,
            type: 'singleSelect',
            valueOptions: statusOptions, 
            editable: true,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => {
              const id = Number(params.value);
              const label = labelById.status[id] ?? '';
              const color = statusColors[id] || '#9e9e9e';
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
            width: 90,
            type: 'singleSelect',
            valueOptions: lastStepOptions, 
            editable: true,
            align: 'center',
            headerAlign: 'center',
            valueFormatter: (p: { value: unknown }) => labelById.last_step[Number(p.value)] ?? '',
            renderCell: (params) => {
              const id = Number(params.value);
              const label = labelById.last_step[id] ?? '';
              return (
                <Tooltip title={label} placement="top">
                  <span style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{label}</span>
                </Tooltip>
              );
            }
        },
        { field: 'last_updated', headerName: 'Last Updated On', width: 120, editable: false, align: 'center', headerAlign: 'center',
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
                { field: 'docs', headerName: 'Docs', width: 56, sortable: false, filterable: false, align: 'center', headerAlign: 'center',
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
  { field: 'actions', headerName: 'Actions', width: 56, sortable: false, filterable: false, align: 'center', headerAlign: 'center',
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
                  <Tooltip title="Upload document" placement="top">
                    <IconButton component="span" size="small" aria-label="Upload document">
                      <UploadFileIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
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

  const performBulkDelete = async () => {
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
    } catch {
      setSnackbar({ children: 'Failed to delete some applications', severity: 'error' });
    } finally {
      setConfirmDeleteOpen(false);
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

  // Autosize columns to fit content and headers
  React.useEffect(() => {
    const api = apiRef.current;
    if (!api) return;
    // Create canvas for measuring text
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
  const root = containerRef.current || document.body;
  const style = window.getComputedStyle(root);
  const fontSize = style.fontSize || '14px';
  const fontFamily = style.fontFamily || 'Roboto, Arial, sans-serif';
  const bodyFont = `${fontSize} ${fontFamily}`;
  const headerFont = `500 ${fontSize} ${fontFamily}`; // headers are typically semi-bold
  ctx.font = bodyFont;

  const padding = 16; // tighter left+right padding
    const fmtSalary = (min: number | null, max: number | null) => {
      const fmt = (n: number | null) => {
        if (n == null) return '';
        if (Math.abs(n) < 1000) return String(n);
        const k = n / 1000;
        const text = Number.isInteger(k) ? String(k) : (Math.abs(n) % 1000 === 0 ? String(k) : k.toFixed(1));
        return `${text}k`;
      };
      return `${fmt(min)}${min != null || max != null ? '–' : ''}${fmt(max)}`;
    };

    const getHeader = (col: GridColDef) => String(col.headerName ?? col.field ?? '');
    const measure = (s: string) => {
      ctx.font = bodyFont;
      return Math.ceil(ctx.measureText(s).width);
    };
    const measureHeader = (s: string) => {
      ctx.font = headerFont;
      return Math.ceil(ctx.measureText(s).width);
    };

    for (const col of columns) {
      // Keep hidden/minor fields as-is
      if (col.field === 'salary_min' || col.field === 'salary_max') continue;
  let width = measureHeader(getHeader(col)) + padding;

      if (col.field === 'link' || col.field === 'notes' || col.field === 'actions') {
        width = Math.max(width, 48);
      } else if (col.field === 'status') {
        width = Math.max(width, 40); // dot + padding
      } else if (col.field === 'docs') {
        let maxIcons = 0;
        for (const r of applicationsData) {
          const count = (docsMap[r.id] || []).length;
          if (count > maxIcons) maxIcons = count;
        }
        const iconsWidth = maxIcons > 0 ? maxIcons * 22 + 8 : 22; // icon size ~20 + tighter gap
        width = Math.max(width, iconsWidth);
      } else if (col.field === 'salary') {
        let maxCell = 0;
        for (const r of applicationsData) {
          const s = fmtSalary(r.salary_min ?? null, r.salary_max ?? null);
          maxCell = Math.max(maxCell, measure(s));
        }
        width = Math.max(width, maxCell + padding);
      } else if (col.field === 'applied_on' || col.field === 'last_updated') {
        let maxCell = 0;
        for (const r of applicationsData) {
          const raw = col.field === 'applied_on' ? r.applied_on : r.last_updated;
          const d = new Date(raw);
          const s = isNaN(d.getTime()) ? 'Invalid Date' : formatDate(d);
          maxCell = Math.max(maxCell, measure(s));
        }
        width = Math.max(width, maxCell + padding);
    } else {
        // generic text columns
        let maxCell = 0;
        for (const r of applicationsData) {
          const rec = r as unknown as Record<string, unknown>;
      let v = rec[col.field as keyof Application];
      // map ids to labels for measurement
      if (col.field === 'status' && typeof v === 'number') v = labelById.status[v] ?? '';
      if (col.field === 'last_step' && typeof v === 'number') v = labelById.last_step[v] ?? '';
      if (col.field === 'modality' && typeof v === 'number') v = labelById.modality[v] ?? '';
      const s = typeof v === 'string' ? v : v == null ? '' : String(v);
          maxCell = Math.max(maxCell, measure(s));
        }
        width = Math.max(width, maxCell + padding);
      }
      // Clamp to reasonable bounds
  const min = 40;
  const max = col.field === 'modality' ? 340 : 480;
      const finalWidth = Math.min(Math.max(width, min), max);
      try {
        api.setColumnWidth(col.field, finalWidth);
      } catch {
        // ignore
      }
    }
  }, [applicationsData, docsMap, apiRef, resizeTick, notesDialogOpen, labelById]);

  React.useEffect(() => {
    const onResize = () => setResizeTick((t) => t + 1);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
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
    <Paper sx={{ height: '80%', width: '100%' }} ref={containerRef}>
            {!valuesLoaded ? (
              <div style={{ padding: 16 }}>Loading fields…</div>
            ) : (
            <DataGrid
            apiRef={apiRef}
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
                onBulkDelete={() => setConfirmDeleteOpen(true)}
                selectedCount={selectionModel.length}
                onConfigClosed={() => setValuesTick((t) => t + 1)}
                />
              }}
              slotProps={{
                panel: {
                    placement: 'top-end', // Change the placement
                    disablePortal: true, // Keep the filter panel within the DOM
                },
            }}
            />
            )}
            <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)} maxWidth="xs" fullWidth>
              <DialogTitle>Delete {selectionModel.length} selected?</DialogTitle>
              <DialogContent dividers>
                This action cannot be undone.
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
                <Button color="error" variant="contained" onClick={performBulkDelete} disabled={selectionModel.length === 0}>Delete</Button>
              </DialogActions>
            </Dialog>
            <Dialog open={notesDialogOpen} onClose={closeNotesDialog} fullWidth maxWidth="sm" disableScrollLock>
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



