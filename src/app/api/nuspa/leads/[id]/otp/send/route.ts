import { apiHandler, withStatus } from "@/lib/http";
import { requestOtp } from "@/lib/services/otpService";

// Satış Görüşmesi akışı: satın alma niyetinde OTP zorunludur.
export const POST = apiHandler(async (_req, { params }: { params: { id: string } }) => {
  const result = requestOtp(Number(params.id));
  return withStatus(result, 201);
});
