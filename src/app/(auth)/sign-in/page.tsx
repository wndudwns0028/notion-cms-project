import { Suspense } from "react";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { SignInForm } from "./sign-in-form";

export default function SignInPage() {
  return (
    <Suspense fallback={<LoadingSpinner fullPage />}>
      <SignInForm />
    </Suspense>
  );
}
