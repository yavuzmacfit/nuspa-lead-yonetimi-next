import { apiHandler } from "@/lib/http";
import { badRequest } from "@/lib/errors";
import { verifyOtp } from "@/lib/services/otpService";

export const POST = apiHandler(async (req, { params }: { params: { id: string } }) => {
  const { challengeId, code } = await req.json();
  if (!challengeId || !code) throw badRequest("challengeId ve code zorunludur.");
  return verifyOtp(Number(params.id), Number(challengeId), String(code));
});
