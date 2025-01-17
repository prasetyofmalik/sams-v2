import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { UpdateSsnM25DataFormProps } from "./types";

const statusOptions = [
  { value: 'belum', label: "Belum Selesai" },
  { value: 'sudah', label: "Sudah Selesai" },
];

export function MutakhirDataForm({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: UpdateSsnM25DataFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: samples = [] } = useQuery({
    queryKey: ["ssn_m25_samples"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ssn_m25_samples")
        .select("sample_code")
        .order("sample_code");

      if (error) throw error;
      return data;
    },
  });

  const form = useForm({
    defaultValues: {
      sample_code: initialData?.sample_code || "",
      status: initialData?.status || "belum",
      families_before: initialData?.families_before || 0,
      families_after: initialData?.families_after || 0,
      households_after: initialData?.households_after || 0,
    },
  });

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        sample_code: initialData.sample_code,
        status: initialData.status || "belum",
        families_before: initialData.families_before || 0,
        families_after: initialData.families_after || 0,
        households_after: initialData.households_after || 0,
      });
    }
  }, [initialData, form]);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const updateData = { ...data };

      if (initialData?.id) {
        const { error } = await supabase
          .from("ssn_m25_updates")
          .update(updateData)
          .eq("id", initialData.id);

        if (error) throw error;
        toast.success("Data pemutakhiran berhasil diperbarui");
      } else {
        const { error } = await supabase
          .from("ssn_m25_updates")
          .insert([updateData]);

        if (error) throw error;
        toast.success("Data pemutakhiran berhasil ditambahkan");
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving update data:", error);
      toast.error(
        `Gagal ${
          initialData?.id ? "memperbarui" : "menambahkan"
        } data pemutakhiran`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("ssn_m25_updates")
        .delete()
        .eq("id", initialData.id);

      if (error) throw error;
      toast.success("Data pemutakhiran berhasil dihapus");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error deleting update data:", error);
      toast.error("Gagal menghapus data pemutakhiran");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {initialData?.id ? "Edit" : "Tambah"} Data Pemutakhiran
          </DialogTitle>
          <DialogDescription>
            Isi detail pemutakhiran data di bawah ini
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="sample_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NKS</FormLabel>
                  <Select
                    disabled={!!initialData}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Pilih Nomor Kode Sampel" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white">
                      {samples.map((sample) => (
                        <SelectItem
                          key={sample.sample_code}
                          value={sample.sample_code}
                        >
                          {sample.sample_code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="families_before"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Jumlah Keluarga Sebelum Pemutakhiran (Blok II)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (value >= 0) {
                          field.onChange(value);
                        }
                      }}
                      min="0"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="families_after"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Jumlah Keluarga Hasil pemutakhiran (Blok II)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (value >= 0) {
                          field.onChange(value);
                        }
                      }}
                      min="0"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="households_after"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Jumlah Rumah Tangga Hasil Pemutakhiran (Blok II)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (value >= 0) {
                          field.onChange(value);
                        }
                      }}
                      min="0"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sudah Selesai Dimutakhirkan</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Pilih status pemutakhiran" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white">
                      {statusOptions.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value.toString()}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between items-center">
              {initialData?.id && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Menghapus..." : "Hapus"}
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button type="button" variant="outline" onClick={onClose}>
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
