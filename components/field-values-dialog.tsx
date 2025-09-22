"use client";
import * as React from 'react';
import { useEffect, useState } from 'react';
import type { ValueType, FieldValue } from '../types';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Tabs, Tab, Box, Button, IconButton, TextField, Tooltip, Switch, Typography, MenuItem, Select, InputLabel, FormControl
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

// Using shared ValueType and FieldValue from types

export default function FieldValuesDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<ValueType>('status');
  const [items, setItems] = useState<Record<ValueType, FieldValue[]>>({ status: [], last_step: [], modality: [] });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addDraft, setAddDraft] = useState<{ label: string; color?: string; priority_group?: 'needs_action'|'waiting'|'other' }>({ label: '' });
  const current = items[tab];

  const load = async (t: ValueType) => {
    setLoading(true);
    try {
      const r = await fetch(`/api/values?type=${t}`);
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      setItems((prev) => ({ ...prev, [t]: data }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      load('status');
      load('last_step');
      load('modality');
    }
  }, [open]);

  const resetAdd = () => setAddDraft({ label: '', color: '#2979FF', priority_group: 'needs_action' });

  const addItem = async () => {
    if (!addDraft.label.trim()) return;
    setSaving(true);
    try {
      const body: { 
        type: ValueType; 
        label: string; 
        sort_order: number; 
        is_active: 1; 
        color?: string; 
        priority_group?: 'needs_action'|'waiting'|'other' } 
        = { 
            type: tab, 
            label: addDraft.label, 
            sort_order: (current[current.length - 1]?.sort_order ?? 0) + 10, 
            is_active: 1 
        };
            
      if (tab === 'status') {
        body.color = addDraft.color || '#9e9e9e';
        body.priority_group = addDraft.priority_group || 'other';
      }
      const r = await fetch('/api/values', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error(await r.text());
      await load(tab);
      resetAdd();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to add';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const updateItem = async (id: number, patch: Partial<FieldValue>) => {
    setSaving(true);
    try {
      const r = await fetch('/api/values', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...patch }) });
      if (!r.ok) throw new Error(await r.text());
      await load(tab);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to update';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (v: FieldValue) => {
    setSaving(true);
    try {
      const body: { id: number; mergeIntoId?: number } = { id: v.id };
      if ((v.usageCount ?? 0) > 0) {
        // choose first other active item as default merge target
        const candidates = current.filter((x) => x.id !== v.id && x.is_active === 1);
        if (candidates.length === 0) {
          setError('Cannot delete: no alternative to merge into');
          setSaving(false);
          return;
        }
        body.mergeIntoId = candidates[0].id;
      }
      const r = await fetch(`/api/values?id=${v.id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error(await r.text());
      await load(tab);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to delete';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const move = async (v: FieldValue, dir: -1 | 1) => {
    const idx = current.findIndex((x) => x.id === v.id);
    const other = current[idx + dir];
    if (!other) return;
    // swap sort_order
    await updateItem(v.id, { sort_order: other.sort_order });
    await updateItem(other.id, { sort_order: v.sort_order });
  };

  const isStatus = tab === 'status';

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Configure fields</DialogTitle>
      <DialogContent dividers>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab value="status" label="Status" />
          <Tab value="last_step" label="Last Step" />
          <Tab value="modality" label="Modality" />
        </Tabs>

        {/* Add new */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <TextField size="small" label="New label" value={addDraft.label} onChange={(e) => setAddDraft((p) => ({ ...p, label: e.target.value }))} />
          {isStatus && (
            <>
              <TextField size="small" label="Color (#RRGGBB)" value={addDraft.color ?? ''} onChange={(e) => setAddDraft((p) => ({ ...p, color: e.target.value }))} sx={{ width: 180 }} />
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Priority group</InputLabel>
                <Select label="Priority group" value={addDraft.priority_group ?? 'needs_action'} onChange={(e) => setAddDraft((p) => ({ ...p, priority_group: e.target.value as 'needs_action'|'waiting'|'other' }))}>
                  <MenuItem value="needs_action">Needs action</MenuItem>
                  <MenuItem value="waiting">Waiting</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </>
          )}
          <Button startIcon={<AddIcon />} variant="contained" onClick={addItem} disabled={saving || loading}>Add</Button>
        </Box>

        {/* List */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {current.map((v) => (
            <Box key={v.id} sx={{ display: 'grid', gridTemplateColumns: isStatus ? '180px 160px 140px 1fr auto auto auto' : '180px 1fr auto auto auto', gap: 1, alignItems: 'center' }}>
              {/* label */}
              <TextField size="small" value={v.label} onChange={(e) => updateItem(v.id, { label: e.target.value })} />
              {/* color (status) */}
              {isStatus && (
                <TextField size="small" label="Color" value={v.color ?? ''} onChange={(e) => updateItem(v.id, { color: e.target.value })} />
              )}
              {/* priority group (status) */}
              {isStatus && (
                <FormControl size="small">
                  <InputLabel>Group</InputLabel>
                  <Select label="Group" value={v.priority_group ?? 'other'} onChange={(e) => updateItem(v.id, { priority_group: e.target.value as 'needs_action'|'waiting'|'other' })}>
                    <MenuItem value="needs_action">Needs action</MenuItem>
                    <MenuItem value="waiting">Waiting</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              )}
              {/* active */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">Active</Typography>
                <Switch checked={v.is_active === 1} onChange={(e) => updateItem(v.id, { is_active: e.target.checked ? 1 : 0 })} />
              </Box>
              {/* usage */}
              <Typography variant="body2" color="text.secondary">{v.usageCount ?? 0} in use</Typography>
              {/* reorder */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" onClick={() => move(v, -1)} disabled={saving}>Up</Button>
                <Button size="small" onClick={() => move(v, 1)} disabled={saving}>Down</Button>
              </Box>
              {/* delete */}
              <Tooltip title={((v.usageCount ?? 0) > 0) ? 'Will merge into another active value' : 'Delete'}>
                <span>
                  <IconButton color="error" onClick={() => deleteItem(v)} disabled={saving}>
                    <DeleteIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          ))}
          {!loading && current.length === 0 && (
            <Typography variant="body2" color="text.secondary">No values.</Typography>
          )}
        </Box>

        {!!error && (
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>{error}</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
