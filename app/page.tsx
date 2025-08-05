"use client";
import React, { useEffect, useState } from "react";
import OrderForm from "@/components/OrderForm";

export default function Page() {
  useEffect(() => {
    // Tell TS to ignore type check for this
    (window as any).googleTranslateElementInit = () => {
      new (window as any).google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: "id,nl,en,de,fr,hi,it,ja,km,ko,zh-CN,ms,es,th,vi,yue",
          layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
           autoDisplay: false,              // Disable auto-popup (default: true)
        },
        "google_translate_element"
      );
    };

    const script = document.createElement("script");
    script.src =
      "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-violet-100 flex flex-col">
      <header className="py-10 text-center bg-[#268DBB] text-white shadow-lg">
        <h1 className="text-3xl md:text-4xl font-bold">
          Device Rental Payment Form
        </h1>

        <div className="absolute right-6 top-6 max-w-[150px] md:max-w-none">
          <div id="google_translate_element"></div>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-6 w-screen my-10 md:my-0">
        <OrderForm />
      </main>
      <footer className="text-center text-gray-500 text-sm py-6 bg-white">
      <p><a href="/terms" className="underline">Terms</a></p><br/>
        © Globibo Events.Studio. All rights reserved.
      </footer>
    </div>
  );
}
