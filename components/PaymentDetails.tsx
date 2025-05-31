"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    PayPalScriptProvider,
    usePayPalCardFields,
    PayPalCardFieldsProvider,
    PayPalNumberField,
    PayPalExpiryField,
    PayPalCVVField,
    PayPalNameField,
} from "@paypal/react-paypal-js";
import { CreditCard } from "lucide-react";
import { toast } from "react-toastify";
import { subscribeAction } from "@/app/subscribeAction";

export default function PaymentDetails({
    total,
    emailAddress,
    validateEmail,
    quantity,
    resetForm,
    agreeTerms,
    setAgreeTerms,
}: {
    total?: number,
    emailAddress: string,
    validateEmail: () => Promise<boolean>,
    quantity: number,
    resetForm: () => void,
    agreeTerms: boolean,
    setAgreeTerms: (agreeTerms: boolean) => void,
}) {
    const [isPaying, setIsPaying] = useState(false);
    const initialOptions = {
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
        "enable-funding": "venmo",
        "buyer-country": "US",
        currency: "USD",
        components: "card-fields",
    };

    // If total is not passed, fallback to 0.00
    const displayTotal = total !== undefined ? total : 0.0;

    // Store the latest values in refs so we can access them in callbacks
    const emailRef = React.useRef(emailAddress);
    const quantityRef = React.useRef(quantity);
    const totalRef = React.useRef(total);

    // Update refs when props change
    React.useEffect(() => {
        emailRef.current = emailAddress;
        quantityRef.current = quantity;
        totalRef.current = total;
    }, [emailAddress, quantity, total]);

    const [resetKey, setResetKey] = useState(0);

    function handleReset() {
        setResetKey(prev => prev + 1);
    }

    const createOrder = useCallback(async () => {
        try {
            const response = await fetch("/api/orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    cart: [
                        {
                            quantity: totalRef.current?.toString(),
                        },
                    ],
                }),
            });

            const orderData = await response.json();

            if (orderData.id) {
                return orderData.id;
            } else {
                const errorDetail = orderData?.details?.[0];
                const errorMessage = errorDetail
                    ? `${errorDetail.issue} ${errorDetail.description} (${orderData.debug_id})`
                    : JSON.stringify(orderData);

                throw new Error(errorMessage);
            }
        } catch (error) {
            toast.error(`Sorry, your transaction could not be processed. Please try again`, {
                position: "top-right",
                autoClose: 4000,
                closeOnClick: true,
                draggable: true,

            });
            console.error(`Could not initiate PayPal Checkout...${error}`);
        }
    }, []);

    const onApprove = useCallback(async (data: any) => {
        try {
            const response = await fetch(`/api/orders/${data.orderID}/capture`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const orderData = await response.json();
            // Three cases to handle:
            //   (1) Recoverable INSTRUMENT_DECLINED -> call actions.restart()
            //   (2) Other non-recoverable errors -> Show a failure message
            //   (3) Successful transaction -> Show confirmation or thank you message

            const transaction =
                orderData?.purchase_units?.[0]?.payments?.captures?.[0] ||
                orderData?.purchase_units?.[0]?.payments?.authorizations?.[0];
            const errorDetail = orderData?.details?.[0];

            if (errorDetail || !transaction || transaction.status === "DECLINED") {
                // (2) Other non-recoverable errors -> Show a failure message
                let errorMessage;
                if (transaction) {
                    errorMessage = `Transaction ${transaction.status}: ${transaction.id}`;
                } else if (errorDetail) {
                    errorMessage = `${errorDetail.description} (${orderData.debug_id})`;
                } else {
                    errorMessage = JSON.stringify(orderData);
                }

                throw new Error(errorMessage);
            } else {
                // Use the current values from refs
                subscribeAction({
                    email: emailRef.current,
                    quantity: quantityRef.current,
                    userName: orderData.payment_source.card.name || '',
                    totalPrice: totalRef.current,
                    transactionId: transaction.id,
                    transactionDetails: JSON.stringify(orderData),
                    datetime: new Date().toISOString()
                });

                toast.success(`Thanks for your purchase!`, {
                    position: "top-right",
                    autoClose: 4000,
                    closeOnClick: true,
                    draggable: true,
                });
                // --- Reset parent form fields (email, quantity, etc.) ---
                if (resetForm) {
                    resetForm();
                }
                handleReset();
            }
        } catch (error) {
            toast.error(`Sorry, your transaction could not be processed. Please try again.`, {
                position: "top-right",
                autoClose: 4000,

                closeOnClick: true,
                draggable: true,
            });
            console.error("Payment error:", error);
        }
    }, [emailAddress, quantity, total, resetForm]);

    const onError = useCallback((error: any) => {
        console.error("Payment error:", error);
        toast.error(`Sorry, your transaction could not be processed. Please try again.`, {
            position: "top-right",
            autoClose: 4000,
            closeOnClick: true,
            draggable: true,
        });
    }, []);

    const SubmitPayment = useCallback(({ isPaying, setIsPaying }: { isPaying: boolean, setIsPaying: (isPaying: boolean) => void }) => {
        const { cardFieldsForm } = usePayPalCardFields();

        const handleClick = async () => {
            // First validate email
            if (await !validateEmail()) {
                toast.error("Please enter a valid email address", {
                    position: "top-right",
                    autoClose: 4000,
                    closeOnClick: true,
                    draggable: true,
                });
                return;
            } else {
                if (!cardFieldsForm) {
                    const childErrorMessage =
                        "Unable to find any child components in the <PayPalCardFieldsProvider />";
                    throw new Error(childErrorMessage);
                }

                const formState = await cardFieldsForm.getState();
                if (!formState.isFormValid) {
                    toast.error("The payment form is invalid", {
                        position: "top-right",
                        autoClose: 4000,

                        closeOnClick: true,
                        draggable: true,

                    });
                }

                setIsPaying(true);
                cardFieldsForm.submit().finally(() => {
                    setIsPaying(false);
                });
            }
        };

        return (
            <button
                className={`w-full py-5 mt-6 rounded-xl text-2xl font-bold text-white 
                ${isPaying
                        ? "bg-gray-500"
                        : "bg-gradient-to-r from-violet-600 disabled:opacity-50 to-violet-800 hover:from-violet-700 hover:to-violet-900"
                    } transition shadow-lg`}
                onClick={handleClick}
                disabled={isPaying || !agreeTerms}
            >
                {isPaying ? "Processing..." : `Pay $${displayTotal.toFixed(2)} Now`}
            </button>
        );
    }, [displayTotal, isPaying, agreeTerms, validateEmail, emailAddress, quantity, total]);

    return (
        <div className="bg-white rounded-2xl shadow-lg border-2 border-violet-300 p-6 md:p-8 flex-1">
            <div className="flex items-center mb-8">
                <span className="bg-violet-100 p-3 rounded-full mr-4">
                    <CreditCard className="text-violet-600" size={36} />
                </span>
                <h2 className="text-3xl md:text-4xl font-bold">Payment Details</h2>
            </div>

            <div className="mt-6 space-y-6">
                <PayPalScriptProvider options={initialOptions} key={resetKey}>
                    <PayPalCardFieldsProvider
                        createOrder={createOrder}
                        onApprove={async (data) => onApprove(data)}
                        onError={onError}
                        style={{
                            input: {
                                "outline": "5px solid #c4b5fd",
                                "padding": "16px",
                                "font-size": "18px",
                                "color": "#333",
                            },
                            body: {
                                padding: "0",
                            }
                        }}
                    >
                        <div className="mb-6">
                            <label htmlFor="card-number" className="block text-xl font-semibold text-gray-700 mb-2">
                                Full Name
                            </label>
                            <PayPalNameField />
                        </div>
                        <div className="mb-6">
                            <label htmlFor="card-number" className="block text-xl font-semibold text-gray-700 mb-2">
                                Card Number
                            </label>
                            <PayPalNumberField />
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div>
                                <label htmlFor="expiry" className="block text-xl font-semibold text-gray-700 mb-2">
                                    Expiry Date
                                </label>
                                <PayPalExpiryField />
                            </div>

                            <div>
                                <label htmlFor="cvc" className="block text-xl font-semibold text-gray-700 mb-2">
                                    CVC
                                </label>
                                <PayPalCVVField />
                            </div>
                        </div>

                        <div className="flex items-center mb-6">
                            <input
                                type="checkbox"
                                className={`w-8 h-8 mr-3 flex items-center justify-center rounded border-2 cursor-pointer
                                ${agreeTerms ? 'border-violet-600' : 'border-gray-400'}`}
                                onClick={() => {
                                    setAgreeTerms(!agreeTerms);
                                }}
                            />
                            <label
                                htmlFor="terms"
                                className="text-lg cursor-pointer"
                                onClick={() => setAgreeTerms(!agreeTerms)}
                            >
                                I agree to the terms and conditions
                            </label>
                        </div>

                        {/* Custom client component to handle card fields submission */}
                        <SubmitPayment
                            isPaying={isPaying}
                            setIsPaying={setIsPaying}
                        />
                    </PayPalCardFieldsProvider>
                </PayPalScriptProvider>
            </div>
        </div>
    );
}
