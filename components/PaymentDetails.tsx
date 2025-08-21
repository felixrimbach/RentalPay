"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { CreditCard } from "lucide-react";
import { toast } from "react-toastify";
import { subscribeAction } from "@/app/subscribeAction";
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

export default function PaymentDetails({
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
    emailError?: string,
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
        idRef.current = customerId;
        nameRef.current = customerName;
        quantityRef.current = quantity;
        totalRef.current = total;
    }, [emailAddress,customerId,customerName,quantity, total]);

    // Update isWaitingForSwipe ref when state changes
    React.useEffect(() => {
        console.log('useEffect: isWaitingForSwipe changed to:', isWaitingForSwipe);
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

        // Remove all non-digits
        const digitsOnly = input.replace(/\D/g, '');

        // Handle different lengths
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
            // Limit to 4 digits max: MMYY format
            const month = digitsOnly.slice(0, 2);
            const year = digitsOnly.slice(2, 4);
            formatted = `${month}/${year}`;
        }

        // Update the card data
        handleCardDataChange('expiryDate', formatted);

        // Handle cursor position after formatting
        setTimeout(() => {
            const inputElement = e.target;
            let newCursorPosition = cursorPosition;

            // Adjust cursor position based on formatting changes
            if (digitsOnly.length === 3 && cursorPosition >= 2) {
                // After adding slash for 3rd digit
                newCursorPosition = 4; // Position after "MM/Y"
            } else if (digitsOnly.length >= 4 && cursorPosition >= 4) {
                // After formatting MMYY to MM/YY
                newCursorPosition = 5; // Position after "MM/YY"
            }

            inputElement.setSelectionRange(newCursorPosition, newCursorPosition);
        }, 0);
    };

    // Handle keydown events for better UX
    const handleExpiryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const input = e.currentTarget;
        const cursorPosition = input.selectionStart || 0;
        const value = input.value;

        // Handle backspace at the slash position
        if (e.key === 'Backspace' && cursorPosition === 3 && value.charAt(2) === '/') {
            e.preventDefault();
            const newValue = value.slice(0, 2);
            handleCardDataChange('expiryDate', newValue);
            setTimeout(() => {
                input.setSelectionRange(2, 2);
            }, 0);
        }
        // Handle delete at position before slash
        else if (e.key === 'Delete' && cursorPosition === 2 && value.charAt(2) === '/') {
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

    // Handle card data changes with validation
    const handleCardDataChange = (field: keyof CardData, value: string) => {
        setCardData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    // Validate individual field
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
                // Check if card is expired
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

    // Validate all card data
    const validateCardData = (): boolean => {
        const newErrors: ErrorState = {
            cardholderName: validateField('cardholderName', cardData.cardholderName),
            cardNumber: validateField('cardNumber', cardData.cardNumber),
            expiryDate: validateField('expiryDate', cardData.expiryDate),
            cvv: validateField('cvv', cardData.cvv)
        };

        setErrors(newErrors);

        // Return true if no errors
        return !Object.values(newErrors).some(error => error !== '');
    };

    // Parse magnetic stripe data from card reader
    function parseSwipeData(rawData: string): CardDetails {
        console.log('Raw swipe data:', rawData);

        // Track 1 pattern: %B<cardnumber>^<NAME>^<YYMM>...
        const track1Pattern = /^%B(\d{13,19})\^([^^]*)\^(\d{2})(\d{2})/;
        // Track 2 pattern: ;<cardnumber>=YYMM...
        const track2Pattern = /^;(\d{13,19})=(\d{2})(\d{2})/;

        let match = track1Pattern.exec(rawData);
        console.log('Track 1 match:', match);

        if (match) {
            const [, cardNumber, name, expYear, expMonth] = match;
            console.log('Parsed Track 1 data:', {
                cardNumber,
                name,
                expYear,
                expMonth
            });

            // Format name: handle both "LAST/FIRST" and "FIRST LAST" formats
            let formattedName = name.trim();
            if (formattedName.includes('/')) {
                // Convert "LAST/FIRST" to "FIRST LAST"
                const [last, first] = formattedName.split('/');
                formattedName = `${first.trim()} ${last.trim()}`;
            }
            console.log('Formatted name:', formattedName);

            // Format expiry date as MM/YY
            const formattedExpiry = `${expMonth}/${expYear}`;
            console.log('Formatted expiry:', formattedExpiry);

            return {
                cardNumber,
                expMonth,
                expYear,
                name: formattedName
            };
        }

        match = track2Pattern.exec(rawData);
        console.log('Track 2 match:', match);

        if (match) {
            const [, cardNumber, expYear, expMonth] = match;
            console.log('Parsed Track 2 data:', {
                cardNumber,
                expYear,
                expMonth
            });

            return {
                cardNumber,
                expMonth,
                expYear
            };
        }

        throw new Error('Card data format not recognized');
    }

    // Process the swiped card data
    const processSwipeData = (swipeData: string) => {
        console.log('processSwipeData called with:', swipeData);
        try {
            // Ensure swipeData is treated as a string
            const rawDataString = String(swipeData);
            console.log('Raw data as string:', rawDataString);

            const parsedData = parseSwipeData(rawDataString);
            console.log('Successfully parsed card data:', parsedData);

            if (parsedData) {
                // Format the expiry date as MM/YY, ensuring year is included
                const formattedExpiryDate = `${parsedData.expMonth}/${parsedData.expYear}`;
                console.log('Formatted expiry date:', formattedExpiryDate);

                // Auto-fill the form with swiped card data
                setCardData(prevData => {
                    const newData = {
                        ...prevData,
                        cardNumber: parsedData.cardNumber,
                        expiryDate: formattedExpiryDate,
                        cardholderName: parsedData.name || prevData.cardholderName
                    };
                    console.log('Setting card data to:', newData);
                    return newData;
                });

                // Clear any existing errors for the fields we just filled
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
            console.error('Error processing swipe data:', error);
            toast.error('Failed to read card data. Please try again or enter manually.', {
                position: "top-right",
                autoClose: 4000,
            });
        }

        console.log('processSwipeData: setting isWaitingForSwipe to false');
        setIsWaitingForSwipe(false);
        isWaitingForSwipeRef.current = false;
    };

    // Initialize CardSwipeRaw when component mounts
    useEffect(() => {
        cardSwipeRef.current = new CardSwipeRaw({
            enabled: false, // Start disabled
            onScan: (data: string[]) => {
                if (isWaitingForSwipeRef.current) {
                    const swipeData = data.join('');
                    console.log('Card swipe detected:', swipeData);
                    processSwipeData(swipeData);
                }
            },
            debug: true // Enable debug logging
        });

        return () => {
            if (cardSwipeRef.current) {
                cardSwipeRef.current.disable();
            }
        };
    }, []);

    // Handle swipe button click
    const handleSwipeClick = () => {
        console.log('handleSwipeClick: current isWaitingForSwipe =', isWaitingForSwipe);
        if (isWaitingForSwipe) {
            // Cancel swipe mode
            console.log('Canceling swipe mode');
            setIsWaitingForSwipe(false);
            isWaitingForSwipeRef.current = false;
            if (cardSwipeRef.current) {
                cardSwipeRef.current.disable();
            }
            return;
        }

        console.log('Starting swipe mode - ready for card reader input');
        setIsWaitingForSwipe(true);
        isWaitingForSwipeRef.current = true;

        if (cardSwipeRef.current) {
            cardSwipeRef.current.enable();
        }

        // Show timeout after 30 seconds
        setTimeout(() => {
            if (isWaitingForSwipeRef.current) {
                console.log('Timeout: canceling swipe');
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
            // Validate both email and card data together
            const isEmailValid = await validateEmail();
            const isCardValid = validateCardData();

            // If either validation fails, stop here (errors are already displayed)
            if (!isEmailValid || !isCardValid) {
                return;
            }

            setIsPaying(true);

            // Create order first
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
                // Success - save subscription
                subscribeAction({
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

                // Reset form and agreement only on successful payment
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
            console.error("Payment error:", error);
        } finally {
            setIsPaying(false);
        }
    }, [cardData, validateEmail, createOrder, resetForm]);

    return (
        <div className="bg-white rounded-2xl shadow-lg border-2 border-violet-300 p-6 md:p-8 flex-1">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                    <span className="bg-violet-100 p-3 rounded-full mr-4">
                        <CreditCard className="text-[#4054A5]" size={36} />
                    </span>
                    <h2 className="text-3xl md:text-4xl text-[#55BD85] font-bold">Payment Details</h2>
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
