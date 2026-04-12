"use client";
import {
  Button,
  Input,
  List,
  ListItem,
  Stack,
  Typography,
} from "@mui/material";
import * as React from "react";
import { useMode } from "@/components/ModeProvider";
import { uploadFile } from "./server";

type FileMeta = {
  id: string;
  name: string;
  size: number;
  createdAt: string;
  updatedAt: string;
};

export default function Page({
  params,
}: {
  params: { filename: string } | Promise<{ filename: string }>;
}) {
  const [filename, setFilename] = React.useState<string | null>(null);
  const [meta, setMeta] = React.useState<FileMeta | null>(null);
  const { mode } = useMode();

  React.useEffect(() => {
    let mounted = true;
    Promise.resolve(params).then((p) => {
      const pp = p as { filename: string };
      const fn = pp.filename;
      if (mounted) setFilename(fn);
    });
    return () => {
      mounted = false;
    };
  }, [params]);

  React.useEffect(() => {
    if (!filename) return;
    let mounted = true;
    fetch(
      `/api/file?mode=${encodeURIComponent(mode)}&filename=${encodeURIComponent(
        filename,
      )}`,
    )
      .then((r) => r.json())
      .then((data) => mounted && setMeta(data))
      .catch((e) => console.error(e));
    return () => {
      mounted = false;
    };
  }, [filename, mode]);

  if (!filename) return <div>Loading...</div>;

  return (
    <Stack>
      <Typography variant="h4" gutterBottom>
        Editing: {filename}
      </Typography>
      <Typography variant="h5" gutterBottom>
        ファイル情報
      </Typography>
      <List>
        <ListItem>作成日時: {meta ? meta.createdAt : "-"}</ListItem>
        <ListItem>更新日時: {meta ? meta.updatedAt : "-"}</ListItem>
        <ListItem>サイズ: {meta ? `${meta.size} bytes` : "-"}</ListItem>
      </List>
      <Typography variant="h5">アクション</Typography>
      <form action={uploadFile}>
        <Stack direction={"row"}>
          <Input hidden type="text" name="filename" value={filename} readOnly />
          <Input hidden type="text" name="mode" value={mode} readOnly />
          <Input
            type="file"
            inputProps={{
              accept: `.${filename.split(".").pop()}`,
            }}
            name="file"
            placeholder="ファイルを選択"
          />
          <Button variant="contained" type="submit">
            ファイルを更新する
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}
