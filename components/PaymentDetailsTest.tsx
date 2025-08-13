"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { CreditCard } from "lucide-react";
import { toast } from "react-toastify";
import {  testSubscribeAction } from "@/app/subscribeAction";
import CardSwipeRaw from "./CardSwipeRaw";
import { useRouter } from "next/navigation";

// Card data interface
interface CardData {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    cardholderName: string;
}

interface CardDetails {
    cardNumber: string;
    expMonth: string;
    expYear: string;
    name?: string; // Optional: Only present if Track 1 data is available
}

// Error state interface
interface ErrorState {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    cardholderName: string;
}

export default function PaymentDetailsTest({
    total,
    emailAddress,
    customerId,
    customerName,
    validateEmail,
    quantity,
    resetForm,
    agreeTerms,
    setAgreeTerms,
    emailError,
}: {
    total?: number,
    emailAddress: string,
    customerId: string,
    customerName: string,
    validateEmail: () => Promise<boolean>,
    quantity: number,
    resetForm: () => void,
    agreeTerms: boolean,
    setAgreeTerms: (agreeTerms: boolean) => void,
    emailError?: string
}) {
    const [isPaying, setIsPaying] = useState(false);
    const [isWaitingForSwipe, setIsWaitingForSwipe] = useState(false);
    const isWaitingForSwipeRef = useRef(false);
    const cardSwipeRef = useRef<CardSwipeRaw | null>(null);
    const [cardData, setCardData] = useState<CardData>({
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardholderName: ''
    });
    const router = useRouter();
    // Add error state management
    const [errors, setErrors] = useState<ErrorState>({
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardholderName: ''
    });

    // If total is not passed, fallback to 0.00
    const displayTotal = total !== undefined ? total : 0.0;

    // Store the latest values in refs so we can access them in callbacks
    const emailRef = React.useRef(emailAddress);
    const quantityRef = React.useRef(quantity);
    const totalRef = React.useRef(total);
    const idRef = React.useRef(customerId);
    const nameRef = React.useRef(customerName);
    // Update refs when props change
    React.useEffect(() => {
        emailRef.current = emailAddress;
        quantityRef.current = quantity;
        totalRef.current = total;
    }, [emailAddress,quantity, total]);
    
    React.useEffect(() => {
        idRef.current = customerId;
    }, [idRef]);
    
    React.useEffect(() => {
        nameRef.current = customerName;
    }, [nameRef]);

    // Update isWaitingForSwipe ref when state changes
    React.useEffect(() => {
        isWaitingForSwipeRef.current = isWaitingForSwipe;
    }, [isWaitingForSwipe]);

    // Format card number with spaces
    const formatCardNumber = (value: string) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = matches && matches[0] || '';
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        if (parts.length) {
            return parts.join(' ');
        } else {
            return v;
        }
    };

    // Enhanced expiry date formatting with better UX
    const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        const cursorPosition = e.target.selectionStart || 0;
        const digitsOnly = input.replace(/\D/g, '');
        let formatted = '';
        if (digitsOnly.length === 0) {
            formatted = '';
        } else if (digitsOnly.length === 1) {
            formatted = digitsOnly;
        } else if (digitsOnly.length === 2) {
            formatted = digitsOnly;
        } else if (digitsOnly.length === 3) {
            formatted = `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2, 3)}`;
        } else if (digitsOnly.length >= 4) {
            const month = digitsOnly.slice(0, 2);
            const year = digitsOnly.slice(2, 4);
            formatted = `${month}/${year}`;
        }
        handleCardDataChange('expiryDate', formatted);
        setTimeout(() => {
            const inputElement = e.target;
            let newCursorPosition = cursorPosition;
            if (digitsOnly.length === 3 && cursorPosition >= 2) {
                newCursorPosition = 4;
            } else if (digitsOnly.length >= 4 && cursorPosition >= 4) {
                newCursorPosition = 5;
            }
            inputElement.setSelectionRange(newCursorPosition, newCursorPosition);
        }, 0);
    };

    const handleExpiryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const input = e.currentTarget;
        const cursorPosition = input.selectionStart || 0;
        const value = input.value;
        if (e.key === 'Backspace' && cursorPosition === 3 && value.charAt(2) === '/') {
            e.preventDefault();
            const newValue = value.slice(0, 2);
            handleCardDataChange('expiryDate', newValue);
            setTimeout(() => {
                input.setSelectionRange(2, 2);
            }, 0);
        } else if (e.key === 'Delete' && cursorPosition === 2 && value.charAt(2) === '/') {
            e.preventDefault();
            const newValue = value.slice(0, 2) + value.slice(4);
            const digitsOnly = newValue.replace(/\D/g, '');
            const formatted = digitsOnly.length <= 2 ? digitsOnly : `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2)}`;
            handleCardDataChange('expiryDate', formatted);
            setTimeout(() => {
                input.setSelectionRange(2, 2);
            }, 0);
        }
    };

    const handleCardDataChange = (field: keyof CardData, value: string) => {
        setCardData(prev => ({
            ...prev,
            [field]: value
        }));
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const validateField = (field: keyof CardData, value: string): string => {
        switch (field) {
            case 'cardholderName':
                return !value.trim() ? "Please enter the cardholder name" : "";
            case 'cardNumber':
                const cleanCardNumber = value.replace(/\s/g, '');
                if (!cleanCardNumber) return "Please enter a card number";
                if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) return "Please enter a valid card number";
                if (!/^\d+$/.test(cleanCardNumber)) return "Card number must contain only digits";
                return "";
            case 'expiryDate':
                if (!value) return "Please enter an expiry date";
                if (value.length !== 5 || !value.includes('/')) return "Please enter a valid expiry date (MM/YY)";
                const [month, year] = value.split('/');
                if (!month || !year || month.length !== 2 || year.length !== 2) {
                    return "Please enter a valid expiry date (MM/YY)";
                }
                const monthNum = parseInt(month, 10);
                const yearNum = parseInt(year, 10);
                if (monthNum < 1 || monthNum > 12) return "Please enter a valid month (01-12)";
                if (yearNum < 0 || yearNum > 99) return "Please enter a valid year";
                const currentDate = new Date();
                const currentYear = currentDate.getFullYear() % 100;
                const currentMonth = currentDate.getMonth() + 1;
                if (yearNum < currentYear || (yearNum === currentYear && monthNum < currentMonth)) {
                    return "Card has expired";
                }
                return "";
            case 'cvv':
                if (!value) return "Please enter a CVV";
                if (value.length < 3 || value.length > 4) return "Please enter a valid CVV (3-4 digits)";
                if (!/^\d+$/.test(value)) return "CVV must contain only digits";
                return "";
            default:
                return "";
        }
    };

    const validateCardData = (): boolean => {
        const newErrors: ErrorState = {
            cardholderName: validateField('cardholderName', cardData.cardholderName),
            cardNumber: validateField('cardNumber', cardData.cardNumber),
            expiryDate: validateField('expiryDate', cardData.expiryDate),
            cvv: validateField('cvv', cardData.cvv)
        };
        setErrors(newErrors);
        return !Object.values(newErrors).some(error => error !== '');
    };

    function parseSwipeData(rawData: string): CardDetails {
        const track1Pattern = /^%B(\d{13,19})\^([^\^]*)\^(\d{2})(\d{2})/;
        const track2Pattern = /^;(\d{13,19})=(\d{2})(\d{2})/;
        let match = track1Pattern.exec(rawData);
        if (match) {
            const [, cardNumber, name, expYear, expMonth] = match;
            let formattedName = name.trim();
            if (formattedName.includes('/')) {
                const [last, first] = formattedName.split('/');
                formattedName = `${first.trim()} ${last.trim()}`;
            }
            return {
                cardNumber,
                expMonth,
                expYear,
                name: formattedName
            };
        }
        match = track2Pattern.exec(rawData);
        if (match) {
            const [, cardNumber, expYear, expMonth] = match;
            return {
                cardNumber,
                expMonth,
                expYear
            };
        }
        throw new Error('Card data format not recognized');
    }

    const processSwipeData = (swipeData: string) => {
        try {
            const rawDataString = String(swipeData);
            const parsedData = parseSwipeData(rawDataString);
            if (parsedData) {
                const formattedExpiryDate = `${parsedData.expMonth}/${parsedData.expYear}`;
                setCardData(prevData => ({
                    ...prevData,
                    cardNumber: parsedData.cardNumber,
                    expiryDate: formattedExpiryDate,
                    cardholderName: parsedData.name || prevData.cardholderName
                }));
                setErrors(prevErrors => ({
                    ...prevErrors,
                    cardNumber: '',
                    expiryDate: '',
                    cardholderName: parsedData.name ? '' : prevErrors.cardholderName,
                }));
                toast.success('Card swiped successfully!', {
                    position: "top-right",
                    autoClose: 3000,
                });
            }
        } catch (error) {
            toast.error('Failed to read card data. Please try again or enter manually.', {
                position: "top-right",
                autoClose: 4000,
            });
        }
        setIsWaitingForSwipe(false);
        isWaitingForSwipeRef.current = false;
    };

    useEffect(() => {
        cardSwipeRef.current = new CardSwipeRaw({
            enabled: false,
            onScan: (data: string[]) => {
                if (isWaitingForSwipeRef.current) {
                    const swipeData = data.join('');
                    processSwipeData(swipeData);
                }
            },
            debug: true
        });
        return () => {
            if (cardSwipeRef.current) {
                cardSwipeRef.current.disable();
            }
        };
    }, []);

    const handleSwipeClick = () => {
        if (isWaitingForSwipe) {
            setIsWaitingForSwipe(false);
            isWaitingForSwipeRef.current = false;
            if (cardSwipeRef.current) {
                cardSwipeRef.current.disable();
            }
            return;
        }
        setIsWaitingForSwipe(true);
        isWaitingForSwipeRef.current = true;
        if (cardSwipeRef.current) {
            cardSwipeRef.current.enable();
        }
        setTimeout(() => {
            if (isWaitingForSwipeRef.current) {
                setIsWaitingForSwipe(false);
                isWaitingForSwipeRef.current = false;
                if (cardSwipeRef.current) {
                    cardSwipeRef.current.disable();
                }
                toast.info('Swipe timeout. Please try again.', {
                    position: "top-right",
                    autoClose: 3000,
                });
            }
        }, 30000);
    };

    const createOrder = useCallback(async () => {
        const response = await fetch("/api/orders-test", {
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
                card: cardData
            }),
        });
        const orderData = await response.json();
        if (!orderData.id) {
            const errorDetail = orderData?.details?.[0];
            const errorMessage = errorDetail
                ? `${errorDetail.issue} ${errorDetail.description} (${orderData.debug_id})`
                : JSON.stringify(orderData);
            throw new Error(errorMessage);
        }
        return orderData;
    }, [cardData]);

    const processPayment = useCallback(async () => {
        try {
            const isEmailValid = await validateEmail();
            const isCardValid = validateCardData();
            if (!isEmailValid || !isCardValid) {
                return;
            }
            setIsPaying(true);
            const orderData = await createOrder();
            const transaction =
                orderData?.purchase_units?.[0]?.payments?.captures?.[0] ||
                orderData?.purchase_units?.[0]?.payments?.authorizations?.[0];
            const errorDetail = orderData?.details?.[0];
            if (errorDetail || !transaction || transaction.status === "DECLINED") {
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
              testSubscribeAction({
                    email: emailRef.current,
                    quantity: quantityRef.current,
                    userName: cardData.cardholderName,
                    totalPrice: totalRef.current,
                    transactionId: transaction.id,
                    transactionDetails: JSON.stringify(orderData),
                    datetime: new Date().toISOString(),
                    custId: idRef.current,
                    custName: nameRef.current
                });
                await fetch('api/mail', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: emailRef.current,
                        quantity: quantityRef.current,
                        userName: cardData.cardholderName,
                        totalPrice: totalRef.current,
                        transactionId: transaction.id,
                        datetime: new Date().toISOString()
                    })
                });
                toast.success(`Thanks for your purchase!`, {
                    position: "top-right",
                    autoClose: 4000,
                    closeOnClick: true,
                    draggable: true,
                });
                if (resetForm) {
                    resetForm();
                }
                setCardData({
                    cardNumber: '',
                    expiryDate: '',
                    cvv: '',
                    cardholderName: ''
                });
                setErrors({
                    cardNumber: '',
                    expiryDate: '',
                    cvv: '',
                    cardholderName: ''
                });
                router.push('/thanks');
            }
        } catch (error) {
            toast.error(`Sorry, your transaction could not be processed. Please try again.`, {
                position: "top-right",
                autoClose: 4000,
                closeOnClick: true,
                draggable: true,
            });
        } finally {
            setIsPaying(false);
        }
    }, [cardData, validateEmail, createOrder, resetForm]);
    console.log( customerId, customerName);
    return (
        <div className="bg-white rounded-2xl shadow-lg border-2 border-violet-300 p-6 md:p-8 flex-1">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                    <span className="bg-violet-100 p-3 rounded-full mr-4">
                        <CreditCard className="text-[#4054A5]" size={36} />
                    </span>
                    <h2 className="text-3xl md:text-4xl text-[#55BD85] font-bold">Payment Details (Test)</h2>
                </div>
                <div>
                    <button
                        className={`flex items-center text-lg font-bold rounded-full p-3 transition-colors ${isWaitingForSwipe
                            ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                            : 'bg-violet-100 text-gray-500 hover:text-[#268DBB] hover:bg-violet-200'
                            }`}
                        onClick={handleSwipeClick}
                        disabled={isPaying}
                    >
                        {isWaitingForSwipe ? 'Cancel Swipe' : 'Swipe'}
                    </button>
                </div>
            </div>
            
            <div className="mt-6 space-y-6">
                {/* Swipe Mode Indicator */}
                {isWaitingForSwipe && (
                    <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 text-center">
                        <div className="flex items-center justify-center mb-2">
                            <div className="animate-pulse bg-orange-500 rounded-full h-3 w-3 mr-2"></div>
                            <span className="text-orange-700 font-semibold text-lg">Waiting for card swipe...</span>
                        </div>
                        <p className="text-orange-600 text-sm">
                            Please swipe your card through the card reader or click "Cancel Swipe" to cancel
                        </p>
                    </div>
                )}

                {/* Custom Card Fields */}
                <div className="mb-6">
                    <label htmlFor="cardholderName" className="block text-xl font-semibold text-gray-700 mb-2 text-[#4054A5]">
                        Full Name
                    </label>
                    <input
                        id="cardholderName"
                        type="text"
                        value={cardData.cardholderName}
                        onChange={(e) => handleCardDataChange('cardholderName', e.target.value)}
                        className={`w-full p-4 text-lg border-2 rounded-lg focus:outline-none ${errors.cardholderName
                            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500'
                            : 'border-violet-200 focus:border-violet-500'
                            }`}
                        placeholder="John Doe"
                        disabled={isPaying}
                    />
                    {errors.cardholderName && (
                        <p className="text-red-500 text-sm mt-1">{errors.cardholderName}</p>
                    )}
                </div>

                <div className="mb-6">
                    <label htmlFor="cardNumber" className="block text-xl font-semibold text-gray-700 mb-2 text-[#4054A5]">
                        Card Number
                    </label>
                    <input
                        id="cardNumber"
                        type="text"
                        value={cardData.cardNumber}
                        onChange={(e) => {
                            const formatted = formatCardNumber(e.target.value);
                            if (formatted.replace(/\s/g, '').length <= 16) {
                                handleCardDataChange('cardNumber', formatted);
                            }
                        }}
                        className={`w-full p-4 text-lg border-2 rounded-lg focus:outline-none ${errors.cardNumber
                            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500'
                            : 'border-violet-200 focus:border-violet-500'
                            }`}
                        placeholder="1234 5678 9012 3456"
                        disabled={isPaying}
                    />
                    {errors.cardNumber && (
                        <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                        <label htmlFor="expiryDate" className="block text-xl font-semibold text-gray-700 mb-2 text-[#4054A5]">
                            Expiry Date
                        </label>
                        <input
                            id="expiryDate"
                            type="text"
                            value={cardData.expiryDate}
                            onChange={handleExpiryDateChange}
                            onKeyDown={handleExpiryKeyDown}
                            className={`w-full p-4 text-lg border-2 rounded-lg focus:outline-none ${errors.expiryDate
                                ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500'
                                : 'border-violet-200 focus:border-violet-500'
                                }`}
                            placeholder="MM/YY"
                            disabled={isPaying}
                        />
                        {errors.expiryDate && (
                            <p className="text-red-500 text-sm mt-1">{errors.expiryDate}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="cvv" className="block text-xl font-semibold text-gray-700 mb-2 text-[#4054A5]">
                            CVC
                        </label>
                        <input
                            id="cvv"
                            type="text"
                            value={cardData.cvv}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                if (value.length <= 4) {
                                    handleCardDataChange('cvv', value);
                                }
                            }}
                            className={`w-full p-4 text-lg border-2 rounded-lg focus:outline-none ${errors.cvv
                                ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500'
                                : 'border-violet-200 focus:border-violet-500'
                                }`}
                            placeholder="123"
                            disabled={isPaying}
                        />
                        {errors.cvv && (
                            <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center mb-6">
                    {agreeTerms ? (
                        <input
                            type="checkbox"
                            className={`w-8 h-8 mr-3 flex items-center justify-center rounded border-2 cursor-pointer`}
                            onChange={() => !isPaying && setAgreeTerms(!agreeTerms)}
                            disabled={isPaying}
                            checked={true}
                        />
                    ) : (
                        <input
                            type="checkbox"
                            className={`w-8 h-8 mr-3 flex items-center justify-center rounded border-2 cursor-pointer`}
                            onChange={() => !isPaying && setAgreeTerms(!agreeTerms)}
                            disabled={isPaying}
                            checked={false}
                        />
                    )}
                    <label
                        htmlFor="terms"
                        className="text-lg cursor-pointer text-[#4054A5]"
                        onClick={() => !isPaying && setAgreeTerms(!agreeTerms)}
                    >
                        I agree to the terms and conditions
                    </label>
                </div>

                {/* Payment Button */}
                <button
                    className={`w-full py-5 mt-6 rounded-xl text-2xl font-bold text-white 
                    ${isPaying
                            ? "bg-gray-500"
                            : "bg-gradient-to-r from-[#268DBB] disabled:opacity-50 to-[#268DBB] hover:from-[#268DBB] hover:to-[#4054A5]"
                        } transition shadow-lg`}
                    onClick={processPayment}
                    disabled={isPaying || !agreeTerms}
                >
                    {isPaying ? "Processing..." : `Pay $${displayTotal.toFixed(2)} Now (Card)`}
                </button>
            </div>
        </div>
    );
} 