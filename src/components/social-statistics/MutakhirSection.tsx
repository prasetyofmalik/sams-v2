import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, FileDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { MutakhirDataForm } from "./MutakhirForm";
import { MutakhirTable } from "./MutakhirTable";
import { UpdateData, MutakhirSectionProps } from "./types";
import { exportToExcel } from "@/utils/excelExport";

export function MutakhirSection({ surveyType }: MutakhirSectionProps) {
  const [searchQuery1, setSearchQuery1] = useState("");
  const [isAddUpdateOpen, setIsAddUpdateOpen] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<UpdateData | null>(
    null
  );

  // Query to get all samples
  const { data: allSamples = [] } = useQuery({
    queryKey: [`${surveyType}_samples`, searchQuery1],
    queryFn: async () => {
      let query = supabase.from(`${surveyType}_samples`).select("*");

      if (searchQuery1) {
        query = query.or(
          `sample_code.ilike.%${searchQuery1}%, kecamatan.ilike.%${searchQuery1}%, desa_kelurahan.ilike.%${searchQuery1}%, pml.ilike.%${searchQuery1}%, ppl.ilike.%${searchQuery1}%`
        );
      }

      const { data, error } = await query;
      if (error) {
        console.error("Error fetching samples:", error);
        throw error;
      }
      return data;
    },
  });

  // Query to get all updates
  const {
    data: updatedSamples = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [`${surveyType}_updates`, searchQuery1],
    queryFn: async () => {
      let query = supabase
        .from(`${surveyType}_updates`)
        .select(
          `
          id,
          sample_code,
          families_before,
          families_after,
          households_after,
          status,
          created_at
        `
        )
        .order("created_at", { ascending: false });

      const { data: updates, error } = await query;
      if (error) {
        console.error("Error fetching updates:", error);
        throw error;
      }

      // Create a map of updates by sample_code
      const updatesMap = new Map();
      updates?.forEach((update) => {
        if (!updatesMap.has(update.sample_code)) {
          updatesMap.set(update.sample_code, update);
        }
      });

      // Combine samples with their updates
      return allSamples.map((sample) => {
        const update = updatesMap.get(sample.sample_code);
        return {
          ...sample,
          id: update?.id || null,
          families_before: update?.families_before || null,
          families_after: update?.families_after || null,
          households_after: update?.households_after || null,
          status: update?.status,
          created_at: update?.created_at || null,
        };
      });
    },
    enabled: allSamples.length > 0, // Only run this query after samples are loaded
  });

  const handleExport = () => {
    const exportData = updatedSamples.map((update) => ({
      "kode prop [2 digit]": "14",
      "kode kab [2 digit]": "05",
      "kode NKS [6 digit]": update.sample_code,
      "Sudah Selesai 1 BS? [sudah/belum]": update.status || "belum",
      "Jumlah Keluarga Sebelum Pemutakhiran": update.families_before || "-",
      "Jumlah Keluarga Hasil Pemutakhiran": update.families_after || "-",
      "Jumlah Rumah Tangga Hasil Pemutakhiran": update.households_after || "-",
    }));
    exportToExcel(exportData, `pemutakhiran-data-${surveyType}`);
  };

  const handleClose = () => {
    setIsAddUpdateOpen(false);
    setEditingUpdate(null);
  };

  const handleEdit = (data: UpdateData) => {
    setEditingUpdate(data);
    setIsAddUpdateOpen(true);
  };

  return (
    <div className="space-y-6 flex flex-col">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center w-full sm:w-auto">
          <Input
            placeholder="Cari pemutakhiran..."
            value={searchQuery1}
            onChange={(e) => setSearchQuery1(e.target.value)}
            className="w-full sm:w-[300px]"
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={handleExport}
          >
            <FileDown className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button
            onClick={() => setIsAddUpdateOpen(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Tambah Pemutakhiran
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-y-auto flex-grow">
        {isLoading ? (
          <div className="p-8 text-center">Loading...</div>
        ) : (
          <MutakhirTable
            updates={updatedSamples}
            onEdit={handleEdit}
            refetch={refetch}
            surveyType={surveyType}
          />
        )}
      </div>

      <MutakhirDataForm
        isOpen={isAddUpdateOpen}
        onClose={handleClose}
        onSuccess={refetch}
        initialData={editingUpdate}
        surveyType={surveyType}
      />
    </div>
  );
}