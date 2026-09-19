import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import React from "react";
import { Link } from "react-router-dom";

const Products = () => {
  return (
    <main className="bg-auth-bg h-screen px-4 py-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-text-secondary text-xs tracking-widest">MANAGE</p>
          <h2 className="text-xl font-semibold">Products</h2>
        </div>
        <Link to="/admin/addproduct">
        <Button className="py-4 px-4 rounded-none cursor-pointer">
          <Plus/>
          Add Product
        </Button>
        </Link>
      </div>

      <section className="bg-white">
      </section>
    </main>
  );
};

export default Products;
