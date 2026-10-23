import Image from "next/image";
import type { Lab } from "@/lib/labs";
import { cn } from "@/lib/utils";

/** A lab's picture on its own preview gradient, so nothing flashes white while it loads. */
export function LabPicture({
  lab,
  src,
  sizes,
  className,
}: {
  lab: Lab;
  src: string;
  sizes: string;
  className?: string;
}) {
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{
        background: `linear-gradient(135deg, ${lab.preview.from}, ${lab.preview.to})`,
      }}
    >
      <Image src={src} alt="" fill sizes={sizes} className="object-cover object-top" />
    </div>
  );
}
