"use client";

import {
  Alert,
  Box,
  InputLabel,
  LinearProgress,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import * as React from "react";
import FullFeaturedCrudGrid from "@/app/datagrid";
import type { FileRow } from "@/types/file";
import { useMode } from "./ModeProvider";

export default function FilesLoader() {
  const { mode } = useMode();
  const [rows, setRows] = React.useState<FileRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // 一覧取得関数
  const fetchFiles = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/files?mode=${encodeURIComponent(mode)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRows(data || []);
    } catch (_e) {
      setErrorMsg("ファイルの同期に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [mode]);

  // 初期ロードとモード変更時の発火
  React.useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // アップロード処理
  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const formData = new FormData();
    Array.from(files).forEach((f) => {
      formData.append("files", f);
    });

    setUploading(true);
    setProgress(0);

    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `/api/files?mode=${encodeURIComponent(mode)}`);

        // 進捗イベント
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            setProgress(Math.round((ev.loaded / ev.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error("Upload failed"));
        };
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(formData);
      });

      // 成功時
      await fetchFiles();
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (_e) {
      setErrorMsg("アップロード中にエラーが発生しました");
    } finally {
      setUploading(false);
      // 少し間を置いてからプログレスをリセットすると自然です
      setTimeout(() => setProgress(0), 1000);
    }
  };

  // 削除処理
  const handleDelete = async (id: string) => {
    if (!confirm(`「${id}」を削除してもよろしいですか？`)) return;

    try {
      const res = await fetch(
        `/api/files?mode=${encodeURIComponent(mode)}&filename=${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error();
      await fetchFiles();
    } catch (_e) {
      setErrorMsg("削除に失敗しました");
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Paper
        variant="outlined"
        sx={{ p: 2, mb: 2, backgroundColor: "#f9f9f9" }}
      >
        <Stack spacing={2}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <InputLabel
              htmlFor="file-upload"
              sx={{ fontWeight: "bold", color: "text.primary" }}
            >
              ファイルアップロード:
            </InputLabel>
            <input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              multiple // 複数選択対応
              disabled={uploading}
              className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100 cursor-pointer"
              onChange={(e) => handleUpload(e.target.files)}
            />
          </Box>

          {uploading && (
            <Box sx={{ width: "100%" }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 0.5,
                }}
              >
                <Typography variant="caption" color="primary" fontWeight="bold">
                  アップロード中...
                </Typography>
                <Typography variant="caption" color="primary">
                  {progress}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}
        </Stack>
      </Paper>

      {/* データグリッド表示部分 */}
      <Box sx={{ height: 600, width: "100%" }}>
        <FullFeaturedCrudGrid
          row={rows}
          onDelete={handleDelete}
          loading={loading}
        />
      </Box>

      {/* エラー通知用スナックバー */}
      <Snackbar
        open={!!errorMsg}
        autoHideDuration={4000}
        onClose={() => setErrorMsg(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity="error"
          variant="filled"
          onClose={() => setErrorMsg(null)}
        >
          {errorMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
