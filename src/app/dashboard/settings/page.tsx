"use client";

import { Button, MenuItem, Stack, TextField } from "@mui/material";
import { DataGrid, type GridColDef, type GridRowModel } from "@mui/x-data-grid";
import { useCallback, useEffect, useState } from "react";

type Row = { id: string; [k: string]: string };
type JsonItem = { [k: string]: unknown };

export default function SettingsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [mode, setMode] = useState<string>("gesshoku");
  const [filename, setFilename] = useState<string>("files.json");
  const [loading, setLoading] = useState(false);
  const [columns, setColumns] = useState<GridColDef[]>([]);
  const [selectionModel, setSelectionModel] = useState<(string | number)[]>([]);

  function extractIdsFromSelection(sel: unknown): (string | number)[] {
    if (!sel) return [];
    // array of ids
    if (Array.isArray(sel)) return sel.map((v: unknown) => String(v));
    const obj = sel as Record<string, unknown>;
    // If shape is { type, ids: ... } (newer MUI), prefer obj.ids
    const idsCandidate = obj?.ids as unknown;
    if (idsCandidate != null) {
      // array
      if (Array.isArray(idsCandidate))
        return (idsCandidate as unknown[]).map((v) => String(v));
      // if it has forEach
      try {
        const s = idsCandidate as unknown as {
          forEach?: (cb: (v: unknown) => void) => void;
          keys?: () => Iterable<unknown>;
        };
        if (typeof s.forEach === "function") {
          const out: (string | number)[] = [];
          s.forEach!((v: unknown) => out.push(String(v)));
          return out;
        }
        if (typeof s.keys === "function") {
          const out: (string | number)[] = [];
          for (const k of s.keys!()) out.push(String(k));
          return out;
        }
      } catch (err) {
        void err;
      }
    }
    // common shape: { ids: [...] }
    if (Array.isArray(obj?.ids))
      return (obj.ids as unknown[]).map((v) => String(v));
    // if it has forEach (Set/Map-like)
    try {
      type ForEachLike = { forEach?: (cb: (v: unknown) => void) => void };
      type KeysLike = { keys?: () => Iterable<unknown> };
      const s = sel as unknown as ForEachLike & KeysLike;
      if (typeof s.forEach === "function") {
        const out: (string | number)[] = [];
        s.forEach!((v) => out.push(String(v)));
        return out;
      }
      if (typeof s.keys === "function") {
        const out: (string | number)[] = [];
        for (const k of s.keys!()) out.push(String(k));
        return out;
      }
    } catch (err) {
      void err;
    }

    // last resort: if it's a plain object mapping id->true
    try {
      const out: (string | number)[] = [];
      for (const k in obj) {
        if (Object.hasOwn(obj, k) && obj[k]) {
          out.push(k);
        }
      }
      if (out.length) return out;
    } catch (err) {
      void err;
    }

    return [];
  }

  // initialize basic columns
  useEffect(() => {
    if (filename === "files.json") {
      setColumns([
        {
          field: "name",
          headerName: "ファイル名",
          width: 300,
          editable: true,
        },
        { field: "label", headerName: "ラベル", flex: 1, editable: true },
      ]);
    } else {
      setColumns([
        { field: "value", headerName: "値", flex: 1, editable: true },
      ]);
    }
  }, [filename]);

  const loadFileCallback = useCallback(async () => {
    await loadFile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadFile]);

  useEffect(() => {
    loadFileCallback();
  }, [loadFileCallback]);

  async function loadFile() {
    setLoading(true);
    try {
      const res = await fetch(`/files/${mode}/settings/${filename}`);
      if (!res.ok) throw new Error("failed to load");
      const data = await res.json();
      // Expecting { data: [ { name, label } ] } or { data: [] }
      const list: JsonItem[] = (data.data || []) as JsonItem[];

      // detect shape
      if (list.length === 0) {
        // keep current columns/rows (empty)
        setRows([]);
        return;
      }

      const first = list[0];
      // primitive array (strings/numbers)
      if (
        typeof first === "string" ||
        typeof first === "number" ||
        typeof first === "boolean"
      ) {
        const mapped: Row[] = list.map((it: JsonItem, i: number) => ({
          id: String(i),
          value: String(it as unknown as string | number | boolean),
        }));
        setColumns([
          { field: "value", headerName: "値", flex: 1, editable: true },
        ]);
        setRows(mapped);
        return;
      }

      // object items: build columns from keys
      if (typeof first === "object" && first !== null) {
        const keys = Object.keys(first as Record<string, unknown>);
        // special-case files.json prefer name/label ordering
        if (filename === "files.json") {
          const mapped: Row[] = list.map((it: JsonItem, i: number) => {
            const rec = it as Record<string, unknown>;
            return {
              id: String(i),
              name: String(rec?.name ?? `file-${i}`),
              label: rec?.label ? String(rec.label) : "",
            };
          });
          setColumns([
            { field: "name", headerName: "名前", width: 300, editable: true },
            { field: "label", headerName: "ラベル", flex: 1, editable: true },
          ]);
          // done
          setRows(mapped);
          return;
        }

        const cols = keys.map(
          (k, idx) =>
            ({
              field: k,
              headerName: k,
              flex: idx === 0 ? undefined : 1,
              width: idx === 0 ? 300 : undefined,
              editable: true,
            }) as GridColDef,
        );
        const mapped: Row[] = list.map((it: JsonItem, i: number) => {
          const row: Row = { id: String(i) } as Row;
          keys.forEach((k) => {
            const v = (it as Record<string, unknown>)[k];
            row[k] =
              v == null
                ? ""
                : typeof v === "string" ||
                    typeof v === "number" ||
                    typeof v === "boolean"
                  ? String(v)
                  : JSON.stringify(v);
          });
          return row;
        });
        setColumns(cols);
        setRows(mapped);
        return;
      }

      // fallback
      setRows([]);
    } catch (e) {
      console.error(e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setLoading(true);
    try {
      let payload: unknown[] = [];
      if (filename === "files.json") {
        // restore { name, label } entries
        payload = rows.map((r) => ({ name: r.name, label: r.label }));
      } else {
        // generic: attempt to parse JSON values, fallback to string
        payload = rows.map((r) => {
          const raw = r.value ?? r.key ?? "";
          try {
            return JSON.parse(raw);
          } catch {
            return raw;
          }
        });
      }

      const res = await fetch(`/api/settings/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, filename, data: payload }),
      });
      if (!res.ok) throw new Error("save failed");
      alert("保存しました");
      await loadFile();
    } catch (e) {
      console.error(e);
      alert("保存に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  function handleAdd() {
    // create a new row with empty values for current columns
    const newId = String(Date.now());
    const newRow: Row = { id: newId } as Row;

    if (filename === "files.json") {
      // provide sensible defaults for files.json
      newRow.name = `new-file-${rows.length + 1}`;
      newRow.label = "";
    } else if (columns.length === 0) {
      // ensure at least a value column
      setColumns([
        { field: "value", headerName: "値", flex: 1, editable: true },
      ]);
      newRow.value = "";
    } else {
      columns.forEach((c) => {
        if (c.field === "id") return;
        newRow[c.field] = "";
      });
    }

    setRows((prev) => [...prev, newRow]);
  }

  function handleDelete() {
    console.log("handleDelete selectionModel:", selectionModel);
    console.log("handleDelete rows before:", rows);
    if (!selectionModel || selectionModel.length === 0) return;
    const selSet = new Set(selectionModel.map((s) => String(s)));
    setRows((prev) => prev.filter((r) => !selSet.has(String(r.id))));
    setSelectionModel([]);
    console.log("handleDelete rows after:", rows);
  }

  return (
    <div style={{ height: 600, width: "100%", padding: 16 }}>
      <Stack direction="row" spacing={2} alignItems="center" marginBottom={2}>
        <TextField
          select
          label="mode"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          <MenuItem value="gesshoku">gesshoku</MenuItem>
          <MenuItem value="arane">arane</MenuItem>
        </TextField>

        <TextField
          select
          label="filename"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
        >
          <MenuItem value="files.json">files.json</MenuItem>
          <MenuItem value="video.json">video.json</MenuItem>
        </TextField>

        <Button variant="contained" onClick={loadFile} disabled={loading}>
          再読み込み
        </Button>

        <Button
          variant="outlined"
          color="primary"
          onClick={handleAdd}
          disabled={loading}
        >
          追加
        </Button>

        <Button
          variant="outlined"
          color="secondary"
          onClick={handleDelete}
          disabled={loading || selectionModel.length === 0}
        >
          削除
        </Button>

        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={loading}
        >
          保存
        </Button>
      </Stack>

      <DataGrid
        rows={rows}
        columns={columns}
        checkboxSelection
        onRowSelectionModelChange={(newSel) => {
          console.log("onRowSelectionModelChange received:", newSel);
          setSelectionModel(extractIdsFromSelection(newSel));
        }}
        editMode="row"
        processRowUpdate={(newRow: GridRowModel) => {
          const nr: Row = { id: String(newRow.id) } as Row;
          Object.keys(newRow).forEach((k) => {
            if (k === "id") return;
            const v = (newRow as unknown as Record<string, unknown>)[k];
            nr[k] = v == null ? "" : String(v);
          });
          setRows((prev) =>
            prev.map((r) => (r.id === nr.id ? { ...r, ...nr } : r)),
          );
          return nr as unknown as GridRowModel;
        }}
      />
    </div>
  );
}
