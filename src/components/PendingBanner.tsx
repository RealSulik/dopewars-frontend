// src/components/PendingBanner.tsx

interface Props {
  hash: string;
}

export default function PendingBanner({ hash }: Props) {
  const short =
    hash.slice(0, 6) + "..." + hash.slice(-4);

  return (
    <div className="
      fixed inset-0 
      bg-black/70 
      backdrop-blur-sm 
      z-50
      flex flex-col 
      justify-center 
      items-center
    ">
      <div className="bg-[#222] px-6 py-4 rounded-xl border border-gray-500 text-white shadow-lg">
        <div className="font-bold text-xl mb-2">
          Transaction Pending...
        </div>
        <div className="opacity-80 text-sm">
          TX: {short}
        </div>
        <div className="opacity-60 text-xs mt-2">
          Waiting for blockchain confirmation
        </div>
      </div>
    </div>
  );
}
