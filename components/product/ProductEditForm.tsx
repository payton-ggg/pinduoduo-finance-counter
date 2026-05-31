"use client";

import ProductForm from "./ProductForm";

type ProductEditFormProps = {
  id: string;
  initialData: any;
};

export function ProductEditForm({ id, initialData }: ProductEditFormProps) {
  return (
    <ProductForm
      id={id}
      initialData={initialData}
    />
  );
}

export default ProductEditForm;
