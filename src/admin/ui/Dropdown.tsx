import type React from "react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface DropdownProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  isOpen,
  onClose,
  children,
  className = "",
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownRef.current) return;

      const target = event.target as HTMLElement;
      if (dropdownRef.current.contains(target)) return;

      // Exempt only THIS dropdown's own trigger — the one sharing its wrapper.
      // A bare `.closest(".dropdown-toggle")` check would also exempt other
      // dropdowns' triggers, so opening one wouldn't close another.
      const toggle = target.closest(".dropdown-toggle");
      if (toggle && dropdownRef.current.parentElement?.contains(toggle)) return;

      onClose();
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      // cn() merges rather than concatenates, so a caller's border/bg/radius
      // actually overrides these defaults instead of racing them in the CSS.
      className={cn(
        "absolute right-0 mt-2 z-[9999] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark",
        className,
      )}
    >
      {children}
    </div>
  );
};