"use client";

import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid, type GridColDef, type GridRowModel } from "@mui/x-data-grid";
import { useCallback, useEffect, useState } from "react";

// 動的な行データの型定義
type Row = { id: string; [key: string]: string };

export default function SettingsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [columns, setColumns] = useState<GridColDef[]>([]);
  const [mode, setMode] = useState<string>("gesshoku");
  const [filename, setFilename] = useState<string>("files.json");
  const [loading, setLoading] = useState(false);
  const [selectionModel, setSelectionModel] = useState([]);
  const [error, setError] = useState<string | null>(null);

  /**
   * ファイル読み込み
   */
  const loadFile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 保存先ディレクトリ構造に合わせてフェッチ
      const subPath = mode === "gesshoku" ? "gesshoku/files" : mode;
      const res = await fetch(`/files/${subPath}/settings/${filename}`);

      if (!res.ok) throw new Error("設定ファイルが見つかりません");

      const json = await res.json();
      const list = (json.data || []) as any[];

      if (list.length === 0) {
        setRows([]);
        return;
      }

      const firstItem = list[0];

      // 1. プリミティブ配列の場合 (例: ["value1", "value2"])
      if (typeof firstItem !== "object" || firstItem === null) {
        setColumns([
          { field: "value", headerName: "VALUE", flex: 1, editable: true },
        ]);
        setRows(list.map((v, i) => ({ id: String(i), value: String(v) })));
      }
      // 2. オブジェクト配列の場合 (例: [{name: "...", label: "..."}])
      else {
        const keys = Object.keys(firstItem);
        const cols: GridColDef[] = keys.map((k) => ({
          field: k,
          headerName: k.toUpperCase(),
          flex: 1,
          editable: true,
        }));

        setColumns(cols);
        setRows(
          list.map((item, i) => {
            const row: Row = { id: String(i) };
            keys.forEach((k) => {
              row[k] = item[k] == null ? "" : String(item[k]);
            });
            return row;
          }),
        );
      }
    } catch (e) {
      setError(
        "設定ファイルを読み込めませんでした。新規作成するか、モードを確認してください。",
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [mode, filename]);

  useEffect(() => {
    loadFile();
  }, [loadFile]);

  /**
   * 保存処理
   */
  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = rows.map(({ id, ...data }) => {
        const keys = Object.keys(data);
        // カラムが "value" 1つだけなら、配列に戻す際に文字列/数値として扱う
        if (keys.length === 1 && keys[0] === "value") return data.value;
        return data;
      });

      const res = await fetch(`/api/settings/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, filename, data: payload }),
      });

      if (!res.ok) throw new Error();
      alert("保存しました。");
    } catch (e) {
      alert("保存に失敗しました。API Routeの設定を確認してください。");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 行追加
   */
  const handleAdd = () => {
    const newId = String(Date.now());
    const newRow: Row = { id: newId };
    columns.forEach((c) => {
      newRow[c.field] = "";
    });
    setRows((prev) => [...prev, newRow]);
  };

  /**
   * 行削除
   */
  const handleDelete = () => {
    if (selectionModel.length === 0) return;
    const selSet = new Set(selectionModel.map((s) => String(s)));
    setRows((prev) => prev.filter((r) => !selSet.has(r.id)));
    setSelectionModel([]);
  };

  /**
   * セル編集の確定処理
   */
  const processRowUpdate = (newRow: GridRowModel) => {
    const updatedRow = newRow as Row;
    // forEachで値を返さないよう修正
    setRows((prev) =>
      prev.map((r) => (r.id === updatedRow.id ? updatedRow : r)),
    );
    return updatedRow;
  };

  return (
    <Stack spacing={2} sx={{ p: 3, height: "calc(100vh - 100px)" }}>
      <Typography variant="h5" fontWeight="bold">
        JSON 設定エディタ
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, backgroundColor: "#fcfcfc" }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            select
            size="small"
            label="モード"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="gesshoku">月蝕 (gesshoku)</MenuItem>
            <MenuItem value="arane">荒音 (arane)</MenuItem>
          </TextField>

          <TextField
            select
            size="small"
            label="ファイル"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="files.json">files.json</MenuItem>
            <MenuItem value="video.json">video.json</MenuItem>
          </TextField>

          <Button variant="text" onClick={loadFile} disabled={loading}>
            再読込
          </Button>

          <Box sx={{ flexGrow: 1 }} />

          <Button variant="outlined" size="small" onClick={handleAdd}>
            行追加
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="error"
            onClick={handleDelete}
            disabled={selectionModel.length === 0}
          >
            削除
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={handleSave}
            disabled={loading}
          >
            保存
          </Button>
        </Stack>
      </Paper>

      {error && <Alert severity="info">{error}</Alert>}

      <Box
        sx={{
          flexGrow: 1,
          backgroundColor: "white",
          borderRadius: 1,
          overflow: "hidden",
        }}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          checkboxSelection
          disableRowSelectionOnClick
          onRowSelectionModelChange={(newModel) =>
            setSelectionModel(newModel as never)
          }
          processRowUpdate={processRowUpdate}
          // セルをダブルクリックして編集を開始する設定
          editMode="row"
          sx={{ border: "none" }}
        />
      </Box>
    </Stack>
  );
}
