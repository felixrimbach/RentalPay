"use server";

import { googleAuth } from "./googleAuth";
import { google } from "googleapis";

export const subscribeAction = async (formData: any) => {

    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    if (!spreadsheetId) {
        return {
            success: false,
            errors: ["There was an error connecting to google."],
        };
    }

    const rawData = {
        email: formData.email,
        quantity: formData.quantity,
        totalPrice: formData.totalPrice,
        userName: formData.userName,
        transactionId: formData.transactionId,
        transactionDetails: formData.transactionDetails,
        datetime: formData.datetime,
    };

    try {

        const sheets = await google.sheets({
            auth: await googleAuth(),
            version: "v4",
        });

        // Select spreadsheet the range to read my emails are on column A
        const readRange = "E1:E";

        // Get the emails from the spreadsheet
        const emails = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
            range: readRange,
        });

        // Get the last row number
        const lastRow = emails.data.values ? emails.data.values.length : 0;

        // Append new row at the end
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `A${lastRow + 1}:G${lastRow + 1}`,
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: [[rawData.email, rawData.userName, rawData.quantity, rawData.totalPrice, rawData.transactionId, rawData.transactionDetails, rawData.datetime]],
            },
        });

        return {
            success: true,
            errors: null,
        };

    } catch (error: unknown) {
        console.error(error);
        return error;
    }
};

export const testSubscribeAction = async (formData: any) => {

    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID_TEST;
    if (!spreadsheetId) {
        return {
            success: false,
            errors: ["There was an error connecting to google."],
        };
    }

    const rawData = {
        email: formData.email,
        quantity: formData.quantity,
        totalPrice: formData.totalPrice,
        userName: formData.userName,
        transactionId: formData.transactionId,
        transactionDetails: formData.transactionDetails,
        datetime: formData.datetime,
    };

    try {

        const sheets = await google.sheets({
            auth: await googleAuth(),
            version: "v4",
        });

        // Select spreadsheet the range to read my emails are on column A
        const readRange = "E1:E";

        // Get the emails from the spreadsheet
        const emails = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
            range: readRange,
        });

        // Get the last row number
        const lastRow = emails.data.values ? emails.data.values.length : 0;

        // Append new row at the end
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `A${lastRow + 1}:G${lastRow + 1}`,
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: [[rawData.email, rawData.userName, rawData.quantity, rawData.totalPrice, rawData.transactionId, rawData.transactionDetails, rawData.datetime]],
            },
        });

        return {
            success: true,
            errors: null,
        };

    } catch (error: unknown) {
        console.error(error);
        return error;
    }
};