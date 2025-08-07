import { NextRequest } from "next/server";
import sgMail from "@sendgrid/mail";
import { NextResponse } from "next/server";
import { format, addMinutes} from 'date-fns';

function toUTC(date: Date) {
    return addMinutes(date, date.getTimezoneOffset());
}

export async function POST(request: NextRequest) {
    try {
        const { email,
            quantity,
            userName,
            totalPrice,
            transactionId,
            datetime
         } = await request.json();
        sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
        const date = new Date();
        const utcDate = toUTC(date);
        const formatted = format(utcDate, 'yyyy-MM-dd HH-mm');
        const html = `<!DOCTYPE html>
                    <html>
                    <head>
                    <base target="_top">
                    </head>
                    <body>
                    <p style="font-size: 16pt; text-align: left;">Mini-Device Rental Receipt</p>
                    <p style="font-size: 16pt; text-align: left;"></p>
                    <p style="font-size: 16pt; text-align: left;">Dear ${userName},</p>
                    <p style="font-size: 16pt; text-align: left;">This is to confirm that your payment of ${totalPrice} USD for ${quantity} unit(s) has been received.</p>
                    <p style="font-size: 16pt; text-align: left;">Transaction details:</p>
                    <div style="font-size: 16pt; background-color: #f9f9f9; border-left: 4px solid #007BFF; padding: 15px; font-family: 'Courier New', monospace; white-space: pre-wrap;">
                    Number of units: ${quantity}
                    Amount paid: ${totalPrice} USD
                    Transaction ID: ${transactionId}
                    Date / Time: ${formatted}
                    </div>
                    <p style="font-size: 16pt; text-align: left;">Please note that USD 70 per device will be refunded once the device(s) is/are returned in a good condition. In order to receive the refund, you must return the device on August 27 by 12PM Macau time at Main Platform.</p>
                    <p style="font-size: 16pt; text-align: left;">If you have any questions or concerns, please contact us at <a href="mailto:payment@globibo.com">payment@globibo.com</a>.</p>
                    <p style="font-size: 16pt; text-align: left;">Thank you for your business.</p>
                    <p style="font-size: 16pt; text-align: left;"></p>                    
                    <p style="font-size: 16pt; text-align: left;">Globibo Pte. Ltd. (on behalf of MDRT) / 114 Lavender Street 06-63 / 338729 Singapore</p>
                    </body>
                    </html>
                    `

        const msg = {
            to: email,
            from: 'payment@globibo.com', // Change to your verified sender
            subject: 'Receipt: Your Payment has been received (Device Rental)',
            text: 'Receipt: Your Payment has been received (Device Rental)',
            html: html,
        };

        await sgMail.send(msg)
        console.log('Email sent successfully');

        return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 });
    } catch (error) {
        console.error("Failed to send email:", error);
        return NextResponse.json(
            { error: "Failed to send email." },
            { status: 500 }
        );
    }
} 
