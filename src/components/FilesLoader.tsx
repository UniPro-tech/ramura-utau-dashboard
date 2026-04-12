"use client";
import { InputLabel, LinearProgress, Stack, Typography } from "@mui/material";
import * as React from "react";
import FullFeaturedCrudGrid from "../app/datagrid";
import { useMode } from "./ModeProvider";

type FileRow = {
  id: string;
  name: string;
  size: number;
  createdAt: string;
  updatedAt: string;
};

export default function FilesLoader() {
  const { mode } = useMode();
  const [rows, setRows] = React.useState<FileRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const fetchFiles = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/files?mode=${encodeURIComponent(mode)}`);
      const data: FileRow[] = await res.json();
      setRows(data || []);
    } catch (e) {
      console.error("fetch files failed", e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  React.useEffect(() => {
    let mounted = true;
    if (mounted) fetchFiles();
    return () => {
      mounted = false;
    };
  }, [fetchFiles]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const formData = new FormData();
    for (const f of Array.from(files)) {
      formData.append("files", f, f.name);
    }

    setUploading(true);
    setProgress(0);

    // Use XMLHttpRequest to get upload progress events
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `/api/files?mode=${encodeURIComponent(mode)}`);

      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) {
          const pct = Math.round((ev.loaded / ev.total) * 100);
          setProgress(pct);
        }
      };

      xhr.onload = async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            await fetchFiles();
            if (fileInputRef.current) fileInputRef.current.value = "";
            resolve();
          } catch (e) {
            console.error("fetch after upload failed", e);
            resolve();
          }
        } else {
          console.error("upload failed", xhr.statusText);
          reject(new Error("upload failed"));
        }
      };

      xhr.onerror = () => {
        console.error("upload network error");
        reject(new Error("network error"));
      };

      xhr.send(formData);
    })
      .catch((e) => console.error("upload error", e))
      .finally(() => {
        setUploading(false);
        setProgress(0);
      });
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`${id} を削除してもよろしいですか？`)) return;
    try {
      const res = await fetch(
        `/api/file?mode=${encodeURIComponent(
          mode,
        )}&filename=${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("delete failed");
      await fetchFiles();
    } catch (e) {
      console.error("delete error", e);
    }
  };

  if (loading) return <div>Loading files...</div>;

  return (
    <div>
      <Stack spacing={1} style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <InputLabel htmlFor="file-upload" style={{ marginRight: 8 }}>
            Upload files:
          </InputLabel>
          <input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            className="underline border p-3"
            onChange={(e) => handleUpload(e.target.files)}
          />
        </div>

        {uploading && (
          <div>
            <LinearProgress variant="determinate" value={progress} />
            <Typography variant="caption">{progress}%</Typography>
          </div>
        )}
      </Stack>

      <FullFeaturedCrudGrid row={rows} onDelete={handleDelete} />
    </div>
  );
}
