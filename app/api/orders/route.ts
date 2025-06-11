import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import {
    ApiError,
    CheckoutPaymentIntent,
    Client,
    Environment,
    LogLevel,
    OrderApplicationContextShippingPreference,
    OrderRequest,
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
const createOrder = async ({ cart, card }: any) => {
    console.log(cart)

    // Format expiry date from MM/YY to YYYY-MM
    const expiryParts = card.expiryDate.split('/');
    const month = expiryParts[0];
    const year = `20${expiryParts[1]}`;
    const formattedExpiry = `${year}-${month}`;

    const collect: OrderRequest = {
        intent: CheckoutPaymentIntent.Capture,
        purchaseUnits: [
            {
                amount: {
                    currencyCode: "USD",
                    value: cart[0].quantity,
                },
            },
        ],
        applicationContext: {
            shippingPreference: OrderApplicationContextShippingPreference.NoShipping,
        },
        paymentSource: {
            card: {
                number: card.cardNumber.replace(/\s/g, ''),
                expiry: formattedExpiry,
                securityCode: card.cvv,
                name: card.cardholderName,
            }
        }
    };

    try {
        const paypalRequestId = uuidv4();
        const { body, ...httpResponse } = await ordersController.createOrder(
            {
                body: collect,
                prefer: "return=minimal",
                paypalRequestId,
            }
        );
        return {
            jsonResponse: JSON.parse(body as string),
            httpStatusCode: httpResponse.statusCode,
        };
    } catch (error) {
        console.error(error)
        throw error;
    }
};

export async function POST(request: NextRequest) {
    try {
        const { cart, card } = await request.json();
        const { jsonResponse, httpStatusCode } = await createOrder({ cart, card });
        return NextResponse.json(jsonResponse, { status: httpStatusCode });
    } catch (error) {
        console.error("Failed to create order:", error);
        return NextResponse.json(
            { error: "Failed to create order." },
            { status: 500 }
        );
    }
} 