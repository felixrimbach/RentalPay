"use client";
import React from "react";
import Link from "next/link";

export default function ThanksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-violet-100 flex flex-col">
      <header className="py-10 text-center bg-[#268DBB] text-white shadow-lg">
        <h1 className="text-3xl md:text-4xl font-bold">Thank You!</h1>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-6 w-screen my-10 md:my-0">
        <div className="bg-white rounded-2xl shadow-lg border-2 border-violet-300 p-8 max-w-xl w-full flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-4 text-[#55BD85]">The Transaction was successful.</h2>
          <p className="text-lg text-gray-700 mb-6 text-center">
            You will receive a confirmation email.<br /><br />
          </p>
          <Link href="/" className="btn btn-primary text-lg px-8 py-3 rounded-md shadow-md">
            Go back to Rental Page
          </Link>
        </div>
      </main>
      <footer className="text-center text-gray-500 text-sm py-6 bg-white">
        <p><Link href="/terms" className="underline">Terms</Link></p><br/>
        © Globibo Events.Studio. All rights reserved.
      </footer>
    </div>
  );
}
