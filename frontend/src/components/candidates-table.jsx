import { MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function CandidatesTable({ rows }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Candidate</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Match score</TableHead>
          <TableHead>Stage</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.name}>
            <TableCell className="font-medium text-foreground">{row.name}</TableCell>
            <TableCell className="text-muted-foreground">{row.role}</TableCell>
            <TableCell>
              <Badge tone="primary">{row.score}% fit</Badge>
            </TableCell>
            <TableCell>
              <Badge tone="success">{row.stage}</Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">{row.updatedAt}</TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default CandidatesTable;
