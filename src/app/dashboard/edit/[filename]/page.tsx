"use client";

import { LoadingButton } from "@mui/lab";
import {
  Box,
  CircularProgress,
  Input,
  List,
  ListItem,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useSnackbar } from "notistack";
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
  const [inProgress, setInProgress] = React.useState(false);

  const { enqueueSnackbar } = useSnackbar();
  const router = useRouter();

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
    const file = formData.get("file") as File;
    if (!file || file.size === 0) {
      enqueueSnackbar("ファイルを選択してください", { variant: "warning" });
      return;
    }

    setInProgress(true);
    try {
      const result = await uploadFile(formData);
      if (result?.error) {
        enqueueSnackbar(result.error, { variant: "error" });
      } else {
        enqueueSnackbar("アップロードが正常に完了しました！", {
          variant: "success",
        });
        router.push("/dashboard");
        router.refresh();
      }
    } catch (e) {
      console.error(e);
      enqueueSnackbar("通信エラーが発生しました", { variant: "error" });
    } finally {
      setInProgress(false);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="50vh"
      >
        <CircularProgress />
        <Typography ml={2}>読み込み中...</Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={3} sx={{ p: 3, maxWidth: 800, position: "relative" }}>
      {/* 送信中のオーバーレイ表示（オプション） */}
      {inProgress && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: "rgba(255, 255, 255, 0.4)",
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        />
      )}

      <Typography variant="h4" fontWeight="bold">
        編集: {filename}
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          現在のファイル情報
        </Typography>
        <List dense disablePadding>
          <ListItem sx={{ px: 0 }}>作成日: {meta?.createdAt || "-"}</ListItem>
          <ListItem sx={{ px: 0 }}>
            サイズ: {meta ? `${(meta.size / 1024).toFixed(2)} KB` : "-"}
          </ListItem>
        </List>
      </Paper>

      <form action={handleFormAction}>
        <input type="hidden" name="filename" value={filename} />
        <input type="hidden" name="mode" value={mode} />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems="center"
        >
          <Paper
            variant="outlined"
            sx={{
              p: 1,
              flexGrow: 1,
              width: "100%",
              borderColor: inProgress ? "grey.300" : "primary.main",
            }}
          >
            <Input
              type="file"
              name="file"
              fullWidth
              disableUnderline
              inputProps={{ accept: `.${filename.split(".").pop()}` }}
              disabled={inProgress}
            />
          </Paper>

          <LoadingButton
            variant="contained"
            type="submit"
            loading={inProgress}
            loadingPosition="start"
            startIcon={null}
            sx={{ minWidth: 140, height: 56 }}
          >
            上書き更新
          </LoadingButton>
        </Stack>
      </form>
    </Stack>
  );
}
