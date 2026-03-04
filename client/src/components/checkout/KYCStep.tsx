import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, CheckCircle2, X, UserCheck, RotateCcw, Upload } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n";
import { motion } from "framer-motion";

interface KYCStepProps {
    onComplete: (data: { faceIdImage: string; residencyImage: string; passportImage: string }) => void;
    onBack: () => void;
}

type DocKey = "faceId" | "residency" | "passport";

const DOC_CONFIG: Record<DocKey, { labelAr: string; labelEn: string; hintAr: string; hintEn: string; facingMode: "user" | "environment" }> = {
    faceId: { labelAr: "1. بصمة الوجه (Face ID)", labelEn: "1. Face ID", hintAr: "ضع وجهك داخل الإطار ثم اضغط التقاط", hintEn: "Center your face then press capture", facingMode: "user" },
    residency: { labelAr: "2. صورة الإقامة / الهوية", labelEn: "2. Residency / ID", hintAr: "ضع بطاقة الإقامة أمام الكاميرا", hintEn: "Hold your residency card in front of camera", facingMode: "environment" },
    passport: { labelAr: "3. صورة جواز السفر", labelEn: "3. Passport", hintAr: "ضع جواز السفر أمام الكاميرا", hintEn: "Hold your passport in front of camera", facingMode: "environment" },
};

export default function KYCStep({ onComplete, onBack }: KYCStepProps) {
    const { language } = useLanguage();

    const [images, setImages] = useState<Record<DocKey, string | null>>({ faceId: null, residency: null, passport: null });
    const [activeCamera, setActiveCamera] = useState<DocKey | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const isAr = language === 'ar';

    const startCamera = async (doc: DocKey) => {
        // Stop any existing stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: DOC_CONFIG[doc].facingMode, width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            streamRef.current = stream;
            setActiveCamera(doc);
            // wait for video element to mount
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            }, 100);
        } catch (err: any) {
            const isPermission = err?.name === "NotAllowedError";
            const isNoDevice = err?.name === "NotFoundError";
            const msg = isPermission
                ? (isAr ? "تم رفض إذن الكاميرا — أذن من إعدادات المتصفح" : "Camera permission denied — allow in browser settings")
                : isNoDevice
                    ? (isAr ? "لا توجد كاميرا متصلة" : "No camera found")
                    : (isAr ? "تعذّر الوصول للكاميرا. تأكد أن الموقع على HTTPS أو localhost" : "Camera unavailable. Ensure site uses HTTPS or localhost");
            toast.error(msg);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setActiveCamera(null);
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current || !activeCamera) return;
        const ctx = canvasRef.current.getContext("2d");
        if (!ctx) return;

        const v = videoRef.current;
        canvasRef.current.width = v.videoWidth;
        canvasRef.current.height = v.videoHeight;

        // Mirror only for front-facing (faceId)
        if (DOC_CONFIG[activeCamera].facingMode === "user") {
            ctx.translate(v.videoWidth, 0);
            ctx.scale(-1, 1);
        }
        ctx.drawImage(v, 0, 0);

        const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.9);
        setImages(prev => ({ ...prev, [activeCamera]: dataUrl }));
        stopCamera();
    };

    const retake = (doc: DocKey) => {
        setImages(prev => ({ ...prev, [doc]: null }));
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, docKey: DocKey) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                setImages(prev => ({ ...prev, [docKey]: reader.result as string }));
            }
        };
        reader.readAsDataURL(file);
    };

    const isStepComplete = images.faceId && images.residency && images.passport;

    /* ─── Per-doc card ─────────────────────────────────────────── */
    const DocCard = ({ docKey }: { docKey: DocKey }) => {
        const cfg = DOC_CONFIG[docKey];
        const image = images[docKey];
        const isThisActive = activeCamera === docKey;

        if (image) {
            return (
                <div className="space-y-3">
                    <p className="text-lg font-black text-gray-800">{isAr ? cfg.labelAr : cfg.labelEn}</p>
                    <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden border-2 border-green-400">
                        <img src={image} alt={docKey} className="w-full h-full object-cover" />
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-1.5 rounded-full flex items-center gap-2 font-bold text-sm">
                            <CheckCircle2 size={14} /> {isAr ? "تم ✓" : "Done ✓"}
                        </div>
                        <button onClick={() => retake(docKey)} className="absolute top-3 right-3 w-11 h-11 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-500 transition shadow-lg backdrop-blur-sm">
                            <RotateCcw size={18} />
                        </button>
                    </div>
                </div>
            );
        }

        if (isThisActive) {
            return (
                <div className="space-y-3">
                    <p className="text-lg font-black text-gray-800">{isAr ? cfg.labelAr : cfg.labelEn}</p>
                    <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden border-2 border-primary bg-black">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`w-full h-full object-cover ${docKey === "faceId" ? "scale-x-[-1]" : ""}`}
                        />
                        {/* Guide frame */}
                        {docKey === "faceId" ? (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-40 h-52 rounded-full border-4 border-white/60 border-dashed" />
                            </div>
                        ) : (
                            <div className="absolute inset-8 rounded-2xl border-4 border-white/60 border-dashed pointer-events-none" />
                        )}
                        <p className="absolute top-3 left-1/2 -translate-x-1/2 text-white text-xs font-bold bg-black/50 px-3 py-1.5 rounded-full text-center whitespace-nowrap">
                            {isAr ? cfg.hintAr : cfg.hintEn}
                        </p>
                        {/* Capture button */}
                        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-4 items-center">
                            <button onClick={stopCamera} className="w-12 h-12 rounded-full bg-black/50 border border-white/30 flex items-center justify-center hover:bg-black/70 transition">
                                <X size={18} className="text-white" />
                            </button>
                            <button onClick={capturePhoto} className="w-18 h-18 w-[72px] h-[72px] rounded-full bg-white border-4 border-primary shadow-xl flex items-center justify-center hover:scale-105 transition">
                                <Camera size={32} className="text-primary" />
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        // Default — tap to open camera or upload
        return (
            <div className="space-y-3">
                <p className="text-lg font-black text-gray-800">{isAr ? cfg.labelAr : cfg.labelEn}</p>
                {docKey === "faceId" ? (
                    <button
                        type="button"
                        onClick={() => startCamera(docKey)}
                        className="w-full aspect-[4/3] rounded-[2rem] border-2 border-dashed border-primary/30 bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center gap-4 hover:border-primary transition-all group"
                    >
                        <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center group-hover:bg-primary/20 transition">
                            <Camera size={30} className="text-primary" />
                        </div>
                        <div className="text-center">
                            <p className="font-black text-white text-base">{isAr ? "اضغط لتشغيل الكاميرا" : "Tap to open camera"}</p>
                            <p className="text-xs text-gray-400 mt-1">{isAr ? "كاميرا أمامية" : "Front camera"}</p>
                        </div>
                    </button>
                ) : (
                    <div className="grid grid-cols-2 gap-3 w-full aspect-[4/3]">
                        <button
                            type="button"
                            onClick={() => startCamera(docKey)}
                            className="w-full h-full rounded-[2rem] border-2 border-dashed border-primary/30 bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center gap-4 hover:border-primary transition-all group"
                        >
                            <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center group-hover:bg-primary/20 transition">
                                <Camera size={24} className="text-primary" />
                            </div>
                            <div className="text-center px-1">
                                <p className="font-black text-white text-sm">{isAr ? "تشغيل الكاميرا" : "Open Camera"}</p>
                            </div>
                        </button>

                        <label className="w-full h-full cursor-pointer rounded-[2rem] border-2 border-dashed border-primary/30 bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center gap-4 hover:border-primary transition-all group">
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileUpload(e, docKey)}
                            />
                            <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center group-hover:bg-primary/20 transition">
                                <Upload size={24} className="text-primary" />
                            </div>
                            <div className="text-center px-1">
                                <p className="font-black text-white text-sm">{isAr ? "رفع صورة" : "Upload Image"}</p>
                            </div>
                        </label>
                    </div>
                )}
            </div>
        );
    };

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 md:space-y-8 w-full">
            <div className="bg-white p-4 sm:p-8 md:p-10 rounded-[1.5rem] md:rounded-[3rem] shadow-xl border border-gray-50 text-right overflow-hidden w-full">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 mb-2 flex items-center justify-end gap-3 font-arabic flex-wrap">
                    التحقق من الهوية (KYC) <UserCheck className="text-primary" />
                </h2>
                <p className="text-gray-500 font-bold mb-6 md:mb-8 leading-relaxed font-arabic text-[12px] sm:text-sm">
                    لإكمال عملية التقسيط، التقط صورة لوجهك ثم صوّر وثائق الإقامة وجواز السفر.
                </p>

                <canvas ref={canvasRef} className="hidden" />

                <div className="space-y-6">
                    <DocCard docKey="faceId" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                        <DocCard docKey="residency" />
                        <DocCard docKey="passport" />
                    </div>
                </div>

                {/* Progress */}
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-8">
                    {(["faceId", "residency", "passport"] as DocKey[]).map(k => (
                        <div key={k} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-black transition-all ${images[k] ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                            {images[k] ? <CheckCircle2 size={12} /> : <div className="w-3 h-3 rounded-full border-2 border-current" />}
                            {isAr ? DOC_CONFIG[k].labelAr.split(".")[1].trim().split(" ")[0] : DOC_CONFIG[k].labelEn.split(".")[1].trim().split(" ")[0]}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-3 md:gap-4 mt-6 md:mt-8 font-arabic">
                    <Button onClick={onBack} variant="outline" className="h-12 md:h-16 rounded-full border-2 border-gray-300 text-gray-900 hover:bg-gray-100 text-sm md:text-xl font-bold">العودة</Button>
                    <Button
                        disabled={!isStepComplete}
                        onClick={() => {
                            if (images.faceId && images.residency && images.passport) {
                                onComplete({ faceIdImage: images.faceId, residencyImage: images.residency, passportImage: images.passport });
                            }
                        }}
                        className="h-12 md:h-16 rounded-full bg-primary hover:bg-primary/90 text-sm md:text-xl font-bold shadow-xl shadow-primary/20 text-gray-950 disabled:opacity-50 disabled:text-gray-700"
                    >
                        {isStepComplete ? '✓ تأكيد والمتابعة' : `${[!images.faceId, !images.residency, !images.passport].filter(Boolean).length} ${isAr ? 'متبقية' : 'remaining'}`}
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}
