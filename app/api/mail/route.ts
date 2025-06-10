import { NextRequest } from "next/server";
import sgMail from "@sendgrid/mail";
import { NextResponse } from "next/server";

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
        const html = `<!DOCTYPE html>
                    <html>
                    <head>
                    <base target="_top">
                    </head>
                    <body>
                    <p style="font-size: 16pt; text-align: left;">Dear ${userName},</p>
                    <p style="text-align: left;">This is to confirm that your payment of ${totalPrice} USD for ${quantity} unit(s) has been received.</p>
                    <p style="text-align: left;">Transaction details:</p>
                    <div style="font-size: 8pt; background-color: #f9f9f9; border-left: 4px solid #007BFF; padding: 15px; font-family: 'Courier New', monospace; white-space: pre-wrap;">
                    Number of units: ${quantity}
                    Amount paid: ${totalPrice} USD
                    Transaction ID: ${transactionId}
                    Date / Time: ${datetime}
                    </div>
                    <p style="text-align: left;">If you have any questions or concerns, please contact us at <a href="mailto:payment@globibo.com">payment@globibo.com</a>.</p>
                    <p style="text-align: left;">Thank you for your business.</p>
                    </body>
                    </html>
                    `

        const msg = {
            to: email,
            from: 'payment@globibo.com', // Change to your verified sender
            subject: 'Your Payment has been received',
            text: 'Your Payment has been received',
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