"use client";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import {
  DataGrid,
  type GridColDef,
  type GridRowsProp,
  Toolbar,
  ToolbarButton,
} from "@mui/x-data-grid";
import Link from "next/link";

// ツールバーコンポーネント
function EditToolbar() {
  return (
    <Toolbar>
      <Tooltip title="Add record (Disabled)">
        <ToolbarButton disabled={true}>
          <AddIcon fontSize="small" />
        </ToolbarButton>
      </Tooltip>
    </Toolbar>
  );
}

interface FullFeaturedCrudGridProps {
  row: GridRowsProp; // 親から渡されるデータ
  onDelete?: (id: string) => void | Promise<void>;
  loading?: boolean; // FilesLoaderから渡せるように追加
}

export default function FullFeaturedCrudGrid({
  row,
  onDelete,
  loading,
}: FullFeaturedCrudGridProps) {
  // ポイント: useState(row) を使わず、props.row を直接 DataGrid に渡す
  // これにより、親の fetchFiles 後のデータが即座に反映されるようになります。

  const columns: GridColDef[] = [
    { field: "name", headerName: "Name", flex: 1, minWidth: 180 },
    {
      field: "createdAt",
      headerName: "Created At",
      width: 180,
    },
    {
      field: "updatedAt",
      headerName: "Updated At",
      width: 180,
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 100,
      getActions: ({ id }) => {
        const actions = [
          <Link
            href={`/dashboard/edit/${id}`}
            key="edit"
            style={{
              textDecoration: "none",
              color: "inherit",
              display: "flex",
            }}
          >
            <EditIcon fontSize="small" />
          </Link>,
        ];

        if (onDelete) {
          actions.push(
            <button
              key="delete"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(String(id));
              }}
              type="button"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "inherit",
                display: "flex",
                padding: 0,
              }}
              title="Delete"
            >
              <DeleteIcon fontSize="small" />
            </button>,
          );
        }
        return actions;
      },
    },
  ];

  return (
    <Box
      sx={{
        height: 600,
        width: "100%",
        "& .actions": { color: "text.secondary" },
      }}
    >
      <DataGrid
        rows={row} // 直接 props の値を渡す
        columns={columns}
        loading={loading} // 読み込み中のぐるぐるを表示可能に
        slots={{ toolbar: EditToolbar }}
        disableRowSelectionOnClick
        autoHeight={false}
        // 以下、以前のエラーを防ぐための設定
        pageSizeOptions={[10, 25, 50]}
        initialState={{
          pagination: { paginationModel: { pageSize: 10 } },
        }}
      />
    </Box>
  );
}
