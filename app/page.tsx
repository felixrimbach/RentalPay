"use client";
import React, { useState } from "react";
import OrderForm from "@/components/OrderForm";

export default function Page() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-violet-100 flex flex-col">
      <header className="py-10 text-center bg-white  shadow-lg">
        <h1 className="text-3xl md:text-4xl font-bold">Product Order Form</h1>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-6 w-screen my-10 md:my-0">
        <OrderForm />
      </main>
      <footer className="text-center text-gray-500 text-sm py-6 bg-white">
        © 2025 Your Company. All rights reserved.
      </footer>
    </div>
  );
}