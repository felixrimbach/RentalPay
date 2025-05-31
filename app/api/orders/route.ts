import { NextRequest, NextResponse } from "next/server";
import {
    ApiError,
    CheckoutPaymentIntent,
    Client,
    Environment,
    LogLevel,
    OrdersController,
} from "@paypal/paypal-server-sdk";

const { NEXT_PUBLIC_PAYPAL_CLIENT_ID, NEXT_PUBLIC_PAYPAL_CLIENT_SECRET } = process.env;

if (!NEXT_PUBLIC_PAYPAL_CLIENT_ID || !NEXT_PUBLIC_PAYPAL_CLIENT_SECRET) {
    throw new Error("Missing PayPal credentials");
}

const client = new Client({
    clientCredentialsAuthCredentials: {
        oAuthClientId: NEXT_PUBLIC_PAYPAL_CLIENT_ID,
        oAuthClientSecret: NEXT_PUBLIC_PAYPAL_CLIENT_SECRET,
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

/**
 * Create an order to start the transaction.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_create
 */
const createOrder = async (cart: any) => {
    const collect = {
        body: {
            intent: CheckoutPaymentIntent.Capture,
            purchaseUnits: [
                {
                    amount: {
                        currencyCode: "USD",
                        value: cart[0].quantity,
                    },
                },
            ],
        },
        prefer: "return=minimal",
    };

    try {
        const { body, ...httpResponse } = await ordersController.createOrder(
            collect
        );

        return {
            jsonResponse: JSON.parse(body as string),
            httpStatusCode: httpResponse.statusCode,
        };
    } catch (error) {
        if (error instanceof ApiError) {
            throw new Error(error.message + 'ddddd');
        }
        throw error;
    }
};

export async function POST(request: NextRequest) {
    try {
        const { cart } = await request.json();
        const { jsonResponse, httpStatusCode } = await createOrder(cart);
        return NextResponse.json(jsonResponse, { status: httpStatusCode });
    } catch (error) {
        console.error("Failed to create order:", error);
        return NextResponse.json(
            { error: "Failed to create order." },
            { status: 500 }
        );
    }
} 