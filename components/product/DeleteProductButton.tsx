"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function DeleteProductButton({ id }: { id: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    const confirmed = window.confirm("Удалить продукт?");
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) {
        alert("Не удалось удалить продукт");

        return res;
      }
      router.push("/");
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("Ошибка при удалении продукта");
    }
  };

  return (
    <Button
      className="bg-red-600 hover:bg-red-700 text-white"
      onClick={handleDelete}
    >
      Удалить
    </Button>
  );
}
