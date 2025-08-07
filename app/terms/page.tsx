"use client";
import React from "react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-violet-100 flex flex-col">
      <header className="py-10 text-center bg-[#268DBB] text-white shadow-lg">
        <h1 className="text-3xl md:text-4xl font-bold">Terms & Conditions</h1>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-6 w-screen my-10">
        <div className="bg-white rounded-2xl shadow-lg border-2 border-violet-300 p-8 max-w-4xl w-full">
          <h2 className="text-2xl font-bold mb-4 text-[#4054A5]">Device Rental & Payment Terms and Conditions</h2>
          <ol className="list-decimal pl-6 text-lg text-gray-700 space-y-4">
            <li>
              <strong>Rental Agreement:</strong> By renting a device, you agree to abide by these Terms & Conditions. The rental period, fees, and return date will be specified at the time of booking.
            </li>
            <li>
              <strong>Payment:</strong> Full payment is required prior to the release of any device. A device consists of a smartphone, one headset, and a charger cable with a plug in a box. Payment can be made via the methods specified on our website. All prices are in USD unless otherwise stated.
            </li>
            <li>
              <strong>Security Deposit:</strong> A security deposit may be required for each device rented. The deposit will be refunded upon return of the device in good working condition, subject to inspection.
            </li>
            <li>
              <strong>Device Use:</strong> Devices must be used responsibly and only for their intended purpose. The renter is responsible for any loss, theft, or damage during the rental period.
            </li>
            <li>
              <strong>Return of Devices:</strong> Devices must be returned by the agreed date and in the same condition as received. Late returns may incur additional charges. Devices returned damaged or with missing parts may result in partial or full forfeiture of the security deposit.
            </li>
            <li>
              <strong>Cancellation & Refunds:</strong> Cancellations must be made at least 24 hours before the rental start date for a full refund. No refunds will be issued for cancellations made after this period or for early returns.
            </li>
            <li>
              <strong>Liability:</strong> Globibo is not liable for any indirect, incidental, or consequential damages arising from the use or inability to use the rented device. The user is responsible for charging the device safely. 
            </li>
            <li>
              <strong>Privacy:</strong> Personal information collected during the rental process will be handled in accordance with our Privacy Policy and will not be shared with third parties except as required by law. All saved informatoin will be distroyed after 3 months of the time of rental.
            </li>
            <li>
              <strong>Contact:</strong> For any questions or concerns regarding these terms, please contact us at <a href="mailto:payment@globibo.com" className="text-blue-600 underline">payment@globibo.com</a>.
            </li>
            <li>
              <strong>Governing Law:</strong> These Terms & Conditions are governed by the laws of Singapore. Any disputes will be subject to the exclusive jurisdiction of the courts of Singapore.
            </li>
          </ol>
        </div>
      </main>
      <footer className="text-center text-gray-500 text-sm py-6 bg-white">
        <p><a href="/" className="underline">Home</a></p><br/>
        © Globibo Events.Studio. All rights reserved.
      </footer>
    </div>
  );
}
