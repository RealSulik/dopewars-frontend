
type Props = {
  visible: boolean;
  image: string;
  text: string;
  onClose: () => void;
};

export default function EventPopup({ visible, image, text, onClose }: Props) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-[9999] animate-fadeInFast"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "rgba(0,0,0,0.85)",
          padding: "20px",
          borderRadius: "12px",
          border: "2px solid rgba(128,0,255,0.5)",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          maxWidth: "550px",
          width: "90%",
          animation: "fadeInScale 0.35s ease",
          boxShadow:
            "0 0 20px rgba(128,0,255,0.5), 0 0 45px rgba(128,0,255,0.25)",
        }}
      >
        <img
          src={image}
          alt="event"
          style={{
            width: "100%",
            maxWidth: "550px",
            height: "auto",
            marginBottom: "20px",
            borderRadius: "8px",
          }}
        />

        <p
          style={{
            fontSize: "1.35rem",
            marginBottom: "10px",
          }}
        >
          {text}
        </p>
      </div>

      {/* Animation keyframes */}
      <style>{`
        @keyframes fadeInFast {
          from {opacity: 0;}
          to {opacity: 1;}
        }

        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.85);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeInFast {
          animation: fadeInFast 0.3s ease;
        }
      `}</style>
    </div>
  );
}
