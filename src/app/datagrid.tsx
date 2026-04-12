"use client";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import {
  DataGrid,
  type GridColDef,
  type GridRowModesModel,
  type GridRowsProp,
  Toolbar,
  ToolbarButton,
} from "@mui/x-data-grid";
import { randomId } from "@mui/x-data-grid-generator";
import Link from "next/link";
import * as React from "react";

declare module "@mui/x-data-grid" {
  interface ToolbarPropsOverrides {
    setRows: (newRows: (oldRows: GridRowsProp) => GridRowsProp) => void;
    setRowModesModel: (
      newModel: (oldModel: GridRowModesModel) => GridRowModesModel,
    ) => void;
  }
}

function EditToolbar() {
  return (
    <Toolbar>
      <Tooltip title="Add record">
        <ToolbarButton disabled={true}>
          <AddIcon fontSize="small" />
        </ToolbarButton>
      </Tooltip>
    </Toolbar>
  );
}

import DeleteIcon from "@mui/icons-material/Delete";

export default function FullFeaturedCrudGrid({
  row,
  onDelete,
}: {
  row: GridRowsProp;
  onDelete?: (id: string) => void | Promise<void>;
}) {
  const [rows] = React.useState(row);
  const [rowModesModel] = React.useState<GridRowModesModel>({});

  const columns: GridColDef[] = [
    { field: "name", headerName: "Name", width: 180, editable: false },
    {
      field: "createdAt",
      headerName: "Created At",
      width: 180,
      editable: false,
    },
    {
      field: "updatedAt",
      headerName: "Updated At",
      width: 180,
      editable: false,
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 100,
      cellClassName: "actions",
      getActions: ({ id }) => {
        const actions = [
          <Link
            href={`/dashboard/edit/${id}`}
            key={randomId()}
            style={{ textDecoration: "none" }}
          >
            <EditIcon />
          </Link>,
        ];
        if (onDelete) {
          actions.push(
            <button
              key={randomId()}
              onClick={(e) => {
                e.stopPropagation();
                // id may be number or string
                onDelete(String(id));
              }}
              type="button"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
              title="Delete"
            >
              <DeleteIcon />
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
        height: 500,
        width: "100%",
        "& .actions": {
          color: "text.secondary",
        },
        "& .textPrimary": {
          color: "text.primary",
        },
      }}
    >
      <DataGrid
        rows={rows}
        columns={columns}
        editMode="row"
        rowModesModel={rowModesModel}
        slots={{ toolbar: EditToolbar }}
        showToolbar
      />
    </Box>
  );
}
