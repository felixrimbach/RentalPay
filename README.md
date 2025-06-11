# Next.js PayPal, Google Sheets Integration.

This is a simple application for ordering units of a product using PayPal and write order details to Google Sheets.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file and add your PayPal client ID:

   ```bash
   # Google Sheets API credentials
   GOOGLE_SHEETS_CLIENT_EMAIL=google_service_accout
   GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\key\n-----END PRIVATE KEY-----\n"
   GOOGLE_SHEETS_SPREADSHEET_ID=google_sheet_id
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=paypal_client_id
   NEXT_PUBLIC_PAYPAL_API_URL=https://api-m.paypal.com
   NEXT_PUBLIC_PAYPAL_CLIENT_SECRET=paypal_client_secret
   NEXT_PUBLIC_UNIT_PRICE=
   NEXT_PUBLIC_DEFAULT_QUANTITY=
   SENDGRID_API_KEY=
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

4. Open the browser and navigate to `http://localhost:3000` to see the app in action.
5. Production build:

   ```bash
   npm run build
   npm run start
   ```
