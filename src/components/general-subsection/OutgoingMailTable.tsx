import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, ArrowUpDown, ExternalLink } from "lucide-react";
import { OutgoingMail, LETTER_CLASSIFICATIONS, DELIVERY_METHODS } from "./types";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";

interface OutgoingMailTableProps {
  mails: OutgoingMail[];
  onEdit: (mail: OutgoingMail) => void;
  refetch: () => void;
}

type SortConfig = {
  key: keyof OutgoingMail;
  direction: 'asc' | 'desc';
} | null;

export function OutgoingMailTable({ mails, onEdit, refetch }: OutgoingMailTableProps) {
  const { toast } = useToast();
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      return format(parseISO(dateString), "d MMMM yyyy", { locale: id });
    } catch {
      return dateString;
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('outgoing_mails')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal menghapus surat keluar",
      });
      return;
    }

    toast({
      title: "Berhasil",
      description: "Surat keluar berhasil dihapus",
    });
    refetch();
  };

  const handleSort = (key: keyof OutgoingMail) => {
    setSortConfig((currentSort) => {
      if (currentSort?.key === key) {
        if (currentSort.direction === 'asc') {
          return { key, direction: 'desc' };
        }
        return null;
      }
      return { key, direction: 'asc' };
    });
  };

  const sortedMails = [...mails].sort((a, b) => {
    if (!sortConfig) return 0;

    const { key, direction } = sortConfig;
    const aValue = a[key];
    const bValue = b[key];

    if (aValue === null) return 1;
    if (bValue === null) return -1;

    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead onClick={() => handleSort('number')} className="cursor-pointer hover:bg-muted">
            No. Surat <ArrowUpDown className="inline h-4 w-4 ml-1" />
          </TableHead>
          <TableHead onClick={() => handleSort('date')} className="cursor-pointer hover:bg-muted">
            Tanggal <ArrowUpDown className="inline h-4 w-4 ml-1" />
          </TableHead>
          <TableHead onClick={() => handleSort('origin')} className="cursor-pointer hover:bg-muted">
            Pengirim <ArrowUpDown className="inline h-4 w-4 ml-1" />
          </TableHead>
          <TableHead onClick={() => handleSort('destination')} className="cursor-pointer hover:bg-muted">
            Tujuan <ArrowUpDown className="inline h-4 w-4 ml-1" />
          </TableHead>
          <TableHead onClick={() => handleSort('classification')} className="cursor-pointer hover:bg-muted">
            Klasifikasi <ArrowUpDown className="inline h-4 w-4 ml-1" />
          </TableHead>
          <TableHead onClick={() => handleSort('description')} className="cursor-pointer hover:bg-muted">
            Uraian <ArrowUpDown className="inline h-4 w-4 ml-1" />
          </TableHead>
          <TableHead onClick={() => handleSort('delivery_method')} className="cursor-pointer hover:bg-muted">
            Keterangan <ArrowUpDown className="inline h-4 w-4 ml-1" />
          </TableHead>
          <TableHead onClick={() => handleSort('is_reply_letter')} className="cursor-pointer hover:bg-muted">
            Surat Balasan <ArrowUpDown className="inline h-4 w-4 ml-1" />
          </TableHead>
          <TableHead onClick={() => handleSort('reference')} className="cursor-pointer hover:bg-muted">
            Referensi <ArrowUpDown className="inline h-4 w-4 ml-1" />
          </TableHead>
          <TableHead onClick={() => handleSort('employee_name')} className="cursor-pointer hover:bg-muted">
            Pembuat <ArrowUpDown className="inline h-4 w-4 ml-1" />
          </TableHead>
          <TableHead>Link</TableHead>
          <TableHead>Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedMails.map((mail) => (
          <TableRow key={mail.id}>
            <TableCell>{mail.number}</TableCell>
            <TableCell>{formatDate(mail.date)}</TableCell>
            <TableCell>{mail.origin}</TableCell>
            <TableCell>{mail.destination}</TableCell>
            <TableCell>{LETTER_CLASSIFICATIONS[mail.classification as keyof typeof LETTER_CLASSIFICATIONS] || '-'}</TableCell>
            <TableCell>{mail.description}</TableCell>
            <TableCell>{DELIVERY_METHODS[mail.delivery_method as keyof typeof DELIVERY_METHODS] || '-'}</TableCell>
            <TableCell>{mail.is_reply_letter ? "Ya" : "Tidak"}</TableCell>
            <TableCell>{mail.reference}</TableCell>
            <TableCell>{mail.employee_name}</TableCell>
            <TableCell>
              {mail.link && (
                <a 
                  href={mail.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => onEdit(mail)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleDelete(mail.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
