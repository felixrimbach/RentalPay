import { NextRequest, NextResponse } from "next/server";
import {
    ApiError,
    Client,
    Environment,
    LogLevel,
    OrdersController,
} from "@paypal/paypal-server-sdk";

const { NEXT_PUBLIC_PAYPAL_SANDBOX_CLIENT_ID, NEXT_PUBLIC_PAYPAL_SANDBOX_CLIENT_SECRET } = process.env;

if (!NEXT_PUBLIC_PAYPAL_SANDBOX_CLIENT_ID || !NEXT_PUBLIC_PAYPAL_SANDBOX_CLIENT_SECRET) {
    throw new Error("Missing PayPal credentials");
}

const client = new Client({
    clientCredentialsAuthCredentials: {
        oAuthClientId: NEXT_PUBLIC_PAYPAL_SANDBOX_CLIENT_ID,
        oAuthClientSecret: NEXT_PUBLIC_PAYPAL_SANDBOX_CLIENT_SECRET,
    },
    timeout: 0,
    environment: Environment.Sandbox,
    logging: {
        logLevel: LogLevel.Info,
        logRequest: {
            logBody: true,
        },
        logResponse: {
            logHeaders: true,
        },
    },
});

const ordersController = new OrdersController(client);

const captureOrder = async (orderID: string) => {
    const collect = {
        id: orderID,
        prefer: "return=minimal",
    };

    try {
        const { body, ...httpResponse } = await ordersController.captureOrder(
            collect
        );
        return {
            jsonResponse: JSON.parse(body as string),
            httpStatusCode: httpResponse.statusCode,
        };
    } catch (error) {
        throw error;
    }
};

export async function POST(
    request: NextRequest,
) {
    try {
        // Extract orderID using regex
        const url = new URL(request.url);
        const match = url.pathname.match(/\/api\/orders-test\/([^\/]+)\/capture/);
        const orderID = match ? match[1] : '';

        const { jsonResponse, httpStatusCode } = await captureOrder(orderID);
        return NextResponse.json(jsonResponse, { status: httpStatusCode });
    } catch (error) {
        console.error("Failed to capture order:", error);
        return NextResponse.json(
            { error: "Failed to capture order." },
            { status: 500 }
        );
    }
} 