"use client";
import React from "react";
import OrderFormTest from "@/components/OrderFormTest";

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-violet-100 flex flex-col">
      <header className="py-10 text-center bg-[#268DBB] text-white shadow-lg">
        <h1 className="text-3xl md:text-4xl font-bold">Device Rental Payment Form (Test)</h1>
        <div id="google_translate_element"></div>
        <script type="text/javascript">
          function googleTranslateElementInit() {
            new google.translate.TranslateElement(
              {pageLanguage: "en"},
              "google_translate_element"
            );
          }
        </script>
        <script type="text/javascript" 
          src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit">
        </script>

      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-6 w-screen my-10 md:my-0">
        <OrderFormTest />
      </main>
      <footer className="text-center text-gray-500 text-sm py-6 bg-white">
        <p><a href="/terms" className="underline">Terms</a></p><br/>
        © Globibo Events.Studio. All rights reserved.
      </footer>
    </div>
  );
}
