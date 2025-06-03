'use client'
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShoppingCart, MinusIcon, PlusIcon } from "lucide-react";
import { toast } from "react-toastify";
import PaymentDetails from './PaymentDetails'
// import { sendPaymentDataToGoogleSheets, PaymentData } from '@/lib/googleSheets';

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  cardholderName: z.string().min(2, "Please enter the cardholder name"),
  cardNumber: z.string().refine(
    (val) => /^[0-9]{16}$/.test(val.replace(/\s/g, "")),
    { message: "Please enter a valid card number" }
  ),
  expiryDate: z.string().refine(
    (val) => /^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(val),
    { message: "Please enter a valid expiry date (MM/YY)" }
  ),
  cvv: z.string().refine(
    (val) => /^[0-9]{3,4}$/.test(val),
    { message: "Please enter a valid CVV" }
  ),
  agreeTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms and conditions"
  })
});

type FormValues = z.infer<typeof formSchema>;

const UNIT_PRICE = process.env.NEXT_PUBLIC_UNIT_PRICE;

export default function OrderForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [quantity, setQuantity] = useState(11);
  const total = quantity * Number(UNIT_PRICE);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const { register, formState: { errors }, handleSubmit, setValue, trigger, watch, reset } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      quantity: 1,
      cardholderName: "",
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      agreeTerms: false
    }
  });

  // Watch the email field from the form
  const watchedEmail = watch("email");

  // Update the email state whenever the form email changes
  React.useEffect(() => {
    if (watchedEmail) {
      setEmailAddress(watchedEmail);
    }
  }, [watchedEmail]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmailAddress(newEmail);
    setValue("email", newEmail);
    trigger("email");
  };

  const updateQuantity = (newQuantity: number) => {
    const validQuantity = Math.max(1, newQuantity);
    setQuantity(validQuantity);
    setValue("quantity", validQuantity);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = parseInt(e.target.value, 10);
    if (!isNaN(newQuantity)) {
      updateQuantity(newQuantity);
    }
  };

  const totalAmount = (quantity * Number(UNIT_PRICE)).toFixed(2);

  // Add this function to reset the form and state
  const resetForm = () => {
    reset(); // resets react-hook-form fields to default
    setEmailAddress('');
    setQuantity(1);
    setAgreeTerms(false);
  };

  return (
    <div className="w-full flex flex-col md:flex-row gap-6 md:gap-8">
      <div className="bg-white rounded-2xl shadow-lg border-2 border-violet-300 p-6 md:p-8 flex-1">
        <div className="flex items-center mb-8">
          <span className="bg-violet-100 p-3 rounded-full mr-3">
            <ShoppingCart className="text-violet-500" size={36} />
          </span>
          <h2 className="text-3xl md:text-4xl font-bold">Order Details</h2>
        </div>
        <div className="mb-6">
          <label className="block font-semibold mb-2 text-xl" htmlFor="email">Email Address</label>
          <input
            {...register("email")}
            id="email"
            type="email"
            placeholder="your@email.com"
            onChange={handleEmailChange}
            className={`w-full px-3 py-2 mb-2 rounded-[4px] h-[60px] focus:outline-none ${errors.email ? 'border-1 border-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500' : 'border-1 border-[#333] focus:ring-2 focus:ring-black focus:border-black'}`}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>
        <div className="mb-6">
          <label className="block font-semibold mb-2 text-xl" htmlFor="quantity">Quantity (Units)</label>
          <div className="flex items-center">
            <button
              type="button"
              className="w-16 h-16 text-6xl flex items-center justify-center bg-violet-100 rounded-l-md border border-r-0 border-violet-200 hover:bg-violet-200 transition"
              onClick={() => updateQuantity(quantity - 1)}
              aria-label="Decrease quantity"
            >
              <MinusIcon className="text-violet-500" size={28} />
            </button>
            <div className="w-36 h-16 text-center border-y border-violet-200 py-2 flex items-center justify-center text-2xl font-medium select-none">
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={handleQuantityChange}
                className="w-full text-center text-2xl outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 border-transparent focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <button
              type="button"
              className="w-16 h-16 text-6xl flex items-center justify-center bg-violet-100 rounded-r-md border border-l-0 border-violet-200 hover:bg-violet-200 transition"
              onClick={() => updateQuantity(quantity + 1)}
              aria-label="Increase quantity"
            >
              <PlusIcon className="text-violet-500" size={28} />
            </button>
          </div>
        </div>
        <div className="bg-violet-50 rounded-lg p-4 mt-6 text-xl">
          <div className="flex justify-between mb-2">
            <span>Price per unit:</span>
            <span className="font-medium text-2xl text-violet-700">${Number(UNIT_PRICE).toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Quantity:</span>
            <span className="font-medium text-2xl text-violet-700">{quantity} units</span>
          </div>
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-violet-100">
            <span className="font-bold text-3xl text-violet-700">Total:</span>
            <span className="font-bold text-3xl text-violet-700">${totalAmount}</span>
          </div>
        </div>
      </div>
      <PaymentDetails
        total={total}
        emailAddress={emailAddress}
        quantity={quantity}
        validateEmail={async () => {
          const result = await trigger("email");
          if (!result && errors.email) {
            toast.error(errors.email.message as string);
          }
          return result;
        }}
        resetForm={resetForm}
        agreeTerms={agreeTerms}
        setAgreeTerms={setAgreeTerms}
      />
    </div>
  );
}
