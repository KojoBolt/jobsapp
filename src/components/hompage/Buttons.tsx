import { Link } from "react-router-dom";
import React from "react";

interface ButtonBaseProps {
  children: React.ReactNode;
  className?: string;
}

interface PrimaryButtonLinkProps extends ButtonBaseProps {
  to: string;
}

interface PrimaryButtonElementProps extends ButtonBaseProps, Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  to?: never;
}

export const PrimaryButton: React.FC<PrimaryButtonLinkProps | PrimaryButtonElementProps> = ({
  children,
  className,
  to,
  ...props
}: any) => {
  const styles = `inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-medium bg-gradient-to-br from-indigo-500 to-indigo-600 hover:opacity-90 active:scale-95 transition-all ${className || ''}`;

  if (to) {
    return (
      <Link to={to} className={styles}>
        {children}
      </Link>
    );
  }

  return (
    <button className={styles} {...props}>
      {children}
    </button>
  );
};

interface GhostButtonLinkProps extends ButtonBaseProps {
  to: string;
}

interface GhostButtonElementProps extends ButtonBaseProps, Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  to?: never;
}

export const GhostButton: React.FC<GhostButtonLinkProps | GhostButtonElementProps> = ({
  children,
  className,
  to,
  ...props
}: any) => {
  const styles = `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border border-white/10 bg-white/3 hover:bg-white/6 backdrop-blur-sm active:scale-95 transition ${className || ''}`;

  if (to) {
    return (
      <Link to={to} className={styles}>
        {children}
      </Link>
    );
  }

  return (
    <button className={styles} {...props}>
      {children}
    </button>
  );
};