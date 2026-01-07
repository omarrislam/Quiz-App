import { Suspense } from "react";
import SecondCamClient from "./SecondCamClient";

export const dynamic = "force-dynamic";

export default function SecondCamPage() {
  return (
    <Suspense fallback={null}>
      <SecondCamClient />
    </Suspense>
  );
}
