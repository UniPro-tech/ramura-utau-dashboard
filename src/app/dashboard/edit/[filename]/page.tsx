"use client";

import {
  Alert,
  Button,
  Input,
  List,
  ListItem,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import * as React from "react";
import { useMode } from "@/components/ModeProvider";
import type { FileRow } from "@/types/file";
import { uploadFile } from "./server";

export default function EditPage({
  params: paramsPromise,
}: {
  params: Promise<{ filename: string }>;
}) {
  const params = React.use(paramsPromise);
  const { filename } = params;
  const { mode } = useMode();

  const [meta, setMeta] = React.useState<FileRow | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    fetch(`/api/files?mode=${encodeURIComponent(mode)}`)
      .then((r) => r.json())
      .then((data: FileRow[]) => {
        if (!active) return;
        const target = data.find((f) => f.id === filename);
        setMeta(target || null);
        setLoading(false);
      })
      .catch(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [filename, mode]);

  const handleFormAction = async (formData: FormData) => {
    const result = await uploadFile(formData);
    if (result?.error) setError(result.error);
  };

  if (loading) return <Typography p={3}>読み込み中...</Typography>;

  return (
    <Stack spacing={3} sx={{ p: 3, maxWidth: 800 }}>
      <Typography variant="h4" fontWeight="bold">
        編集: {filename}
      </Typography>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <List dense>
          <ListItem>作成日: {meta?.createdAt || "-"}</ListItem>
          <ListItem>
            サイズ: {meta ? `${(meta.size / 1024).toFixed(2)} KB` : "-"}
          </ListItem>
        </List>
      </Paper>

      {error && <Alert severity="error">{error}</Alert>}

      <form action={handleFormAction}>
        <input type="hidden" name="filename" value={filename} />
        <input type="hidden" name="mode" value={mode} />
        <Stack direction="row" spacing={2}>
          <Input
            type="file"
            name="file"
            required
            inputProps={{ accept: `.${filename.split(".").pop()}` }}
          />
          <Button variant="contained" type="submit">
            上書き更新
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}
