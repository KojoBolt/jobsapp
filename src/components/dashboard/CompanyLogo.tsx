import { useState } from "react";
import { Avatar } from "@/admin/ui/system";

/**
 * Company logo, with an initials fallback.
 *
 * Shows a logo ONLY when one is genuinely known — `company_logo` on the
 * application row, set at source time from data the job board actually gave
 * us (JSearch's `employer_logo`/`employer_website`, Remotive's
 * `company_logo`, Findwork's `logo`) or, for Greenhouse, from the
 * hand-checked domain in `ats_companies`.
 *
 * This deliberately does NOT infer a domain from the company name. That
 * earlier approach turned "Corriculo Ltd" into corriculo.com and, whenever
 * the guess landed on a real-but-unrelated site — usually a parked
 * for-sale page — a perfectly valid favicon came back and a stranger's mark
 * was rendered next to a real employer. Nothing downstream can detect that:
 * a wrong logo and a right one are identical bytes. Initials are always
 * better than a confident lie, so absence of data means initials.
 */

/** URLs already known to be unreachable. Module-level so a miss isn't
 *  re-requested every time the feed re-renders on a filter or sort. */
const broken = new Set<string>();

const CompanyLogo = ({
  name,
  logo,
  size = 32,
}: {
  name?: string | null;
  /** Only pass a URL the source supplied. Never a derived one. */
  logo?: string | null;
  size?: number;
}) => {
  const src = logo && /^https?:\/\//i.test(logo) ? logo : null;
  const [failed, setFailed] = useState(src ? broken.has(src) : true);
  const [loaded, setLoaded] = useState(false);

  const giveUp = () => {
    if (src) broken.add(src);
    setFailed(true);
  };

  return (
    <span
      className="relative inline-block shrink-0"
      style={{ width: size, height: size }}
    >
      {/* Sits underneath at all times, so it shows while the logo loads and
          simply remains if the logo never arrives — no empty box, no layout
          shift, nothing to swap in on failure. */}
      <Avatar name={name || "?"} size={size} />

      {src && !failed && (
        <img
          src={src}
          alt=""
          aria-hidden
          loading="lazy"
          referrerPolicy="no-referrer"
          // Dead link, hotlink block, decode failure, offline — all land here.
          onError={giveUp}
          onLoad={(e) => {
            // A served-but-useless image (1×1 tracking pixel, empty
            // placeholder) loads fine and would paint a blank disc over
            // perfectly good initials.
            if (e.currentTarget.naturalWidth < 8) giveUp();
            else setLoaded(true);
          }}
          // Opaque backing and ring only once there is a real logo to back;
          // applied up front they would hide the initials for the whole request.
          className={`absolute inset-0 h-full w-full rounded-full object-contain p-[3px]
                      transition-opacity duration-150 ${
                        loaded
                          ? "bg-white opacity-100 ring-1 ring-[#EAEAE7] dark:ring-white/10"
                          : "opacity-0"
                      }`}
        />
      )}
    </span>
  );
};

export default CompanyLogo;
