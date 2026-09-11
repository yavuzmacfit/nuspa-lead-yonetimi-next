"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { apiFetch } from "@/lib/apiClient";
import { useAppData } from "@/lib/AppDataContext";
import { Lead } from "@/lib/types";

export default function SendOtpModal({
  lead,
  onClose,
  onSuccess,
}: {
  lead: Lead;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useAppData();
  const [challengeId, setChallengeId] = useState<number | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);

  async function sendOtp() {
    setSendingOtp(true);
    try {
      const res = await apiFetch<{ challengeId: number; devCode: string }>(`/api/nuspa/leads/${lead.id}/otp/send`, {
        method: "POST",
      });
      setChallengeId(res.challengeId);
      setDevCode(res.devCode);
      setOtpInput("");
      toast(`OTP gönderildi: (+90) ${lead.gsmAreaCode} ${lead.gsmNo}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err), true);
    } finally {
      setSendingOtp(false);
    }
  }

  useEffect(() => {
    sendOtp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function verify() {
    if (!challengeId) return;
    if (!otpInput.trim()) {
      toast("OTP kodunu giriniz.", true);
      return;
    }
    setVerifying(true);
    try {
      await apiFetch(`/api/nuspa/leads/${lead.id}/otp/verify`, {
        method: "POST",
        body: JSON.stringify({ challengeId, code: otpInput.trim() }),
      });
      toast("OTP doğrulandı. Satış Görüşmesi aksiyonu artık kullanılabilir.");
      onSuccess();
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err), true);
    } finally {
      setVerifying(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="modal-header">
        <h2>SMS GÖNDER — OTP DOĞRULAMA</h2>
        <button className="close" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="modal-body">
        <div className="in-call-screen">
          <div className="in-call-avatar">🔐</div>
          <div className="in-call-name">
            {lead.memberName} {lead.memberSurname}
          </div>
          <div className="in-call-phone">
            (+90) {lead.gsmAreaCode} {lead.gsmNo} numarasına OTP gönderildi
          </div>

          <div className="field" style={{ width: 200, marginTop: 18 }}>
            <input
              className="otp-code-input"
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="••••••"
              maxLength={6}
            />
          </div>

          <div className="otp-actions">
            <button className="otp-resend" disabled={sendingOtp} onClick={sendOtp}>
              Kodu Tekrar Gönder
            </button>
            <button className="btn btn-primary" disabled={verifying || !otpInput.trim()} onClick={verify}>
              Doğrula
            </button>
          </div>

          {devCode && (
            <div className="otp-demo-note">
              Demo modu — gerçek SMS sağlayıcı bağlı değil. Kod: <strong>{devCode}</strong>
            </div>
          )}

          <div className="inline-note warn" style={{ marginTop: 16, textAlign: "center" }}>
            OTP doğrulanmadan &quot;Satış Görüşmesi&quot; aksiyonu (satın alma akışı) kullanılamaz.
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <span></span>
        <button className="btn btn-ghost" onClick={onClose}>
          İptal
        </button>
      </div>
    </Modal>
  );
}
