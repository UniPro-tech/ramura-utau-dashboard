"use server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";

export async function uploadFile(formData: FormData) {
  const file = formData.get("file") as File;
  const filename = formData.get("filename") as string;
  const mode = (formData.get("mode") as string) || "arane";

  if (!file || file.size === 0 || !filename) {
    return { error: "ファイルが正しく選択されていません。" };
  }

  try {
    const subPath = mode === "gesshoku" ? "gesshoku/files" : mode;
    const dirPath = path.join(process.cwd(), "public/files", subPath);
    await fs.mkdir(dirPath, { recursive: true });

    const filePath = path.join(dirPath, path.basename(filename));
    const data = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(data));

    revalidatePath("/dashboard");
  } catch (_e) {
    return { error: "書き込みエラーが発生しました。" };
  }
}
