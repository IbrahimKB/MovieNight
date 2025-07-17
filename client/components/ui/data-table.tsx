import { ReactNode } from "react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Trash2, Edit3, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (value: any, item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  title: string;
  data: T[];
  columns: Column<T>[];
  onAdd?: () => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  isLoading?: boolean;
  className?: string;
}

export function DataTable<T extends { id: string }>({
  title,
  data,
  columns,
  onAdd,
  onEdit,
  onDelete,
  isLoading = false,
  className,
}: DataTableProps<T>) {
  const getValue = (item: T, key: string) => {
    return key.split(".").reduce((obj, k) => obj?.[k], item as any);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {onAdd && (
          <Button onClick={onAdd} size="sm" className="h-9">
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No {title.toLowerCase()} found
          </div>
        ) : (
          <div className="relative overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {columns.map((column, index) => (
                      <th
                        key={index}
                        className={cn(
                          "text-left py-3 px-4 font-medium text-sm text-muted-foreground",
                          column.className,
                        )}
                      >
                        {column.label}
                      </th>
                    ))}
                    {(onEdit || onDelete) && (
                      <th className="text-right py-3 px-4 font-medium text-sm text-muted-foreground">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, rowIndex) => (
                    <tr
                      key={item.id}
                      className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                    >
                      {columns.map((column, colIndex) => {
                        const value = getValue(item, column.key as string);
                        return (
                          <td
                            key={colIndex}
                            className={cn(
                              "py-3 px-4 text-sm",
                              column.className,
                            )}
                          >
                            {column.render ? column.render(value, item) : value}
                          </td>
                        );
                      })}
                      {(onEdit || onDelete) && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {onEdit && (
                              <Button
                                onClick={() => onEdit(item)}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                            )}
                            {onDelete && (
                              <Button
                                onClick={() => onDelete(item)}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function StatusBadge({ status }: { status: string }) {
  const variants = {
    pending: "secondary",
    accepted: "default",
    rejected: "destructive",
    user: "secondary",
    admin: "default",
  } as const;

  return (
    <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
      {status}
    </Badge>
  );
}
