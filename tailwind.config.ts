import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    fontFamily: {
      sans: ['Poppins', 'sans-serif'],
      merriweather: ['Merriweather', 'serif'],
      poppins: ['Poppins', 'sans-serif'],
    },
    extend: {
      gridTemplateColumns: {
        "20": "repeat(20, minmax(0, 1fr))",
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        status: {
          reviewing: "hsl(var(--status-reviewing))",
          submitted: "hsl(var(--status-submitted))",
          interview: "hsl(var(--status-interview))",
        },
        tracker: {
          applied: "hsl(var(--tracker-applied))",
          "applied-bg": "hsl(var(--tracker-applied-bg))",
          screening: "hsl(var(--tracker-screening))",
          "screening-bg": "hsl(var(--tracker-screening-bg))",
          interview: "hsl(var(--tracker-interview))",
          "interview-bg": "hsl(var(--tracker-interview-bg))",
          offer: "hsl(var(--tracker-offer))",
          "offer-bg": "hsl(var(--tracker-offer-bg))",
          rejected: "hsl(var(--tracker-rejected))",
          "rejected-bg": "hsl(var(--tracker-rejected-bg))",
          accepted: "hsl(var(--tracker-accepted))",
          "accepted-bg": "hsl(var(--tracker-accepted-bg))",
          declined: "hsl(var(--tracker-declined))",
          "declined-bg": "hsl(var(--tracker-declined-bg))",
        },
        gold: {
          DEFAULT: "hsl(var(--gold))",
          foreground: "hsl(var(--gold-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-left": {
          from: { opacity: "0", transform: "translateX(-20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px hsl(213 94% 55% / 0.3)" },
          "50%": { boxShadow: "0 0 40px hsl(213 94% 55% / 0.5)" },
        },
        "pulse-gold": {
          "0%, 100%": { boxShadow: "0 0 20px hsl(43 96% 56% / 0.3)" },
          "50%": { boxShadow: "0 0 40px hsl(43 96% 56% / 0.5)" },
        },
        "progress-fill": {
          from: { width: "0%" },
          to: { width: "var(--progress-width)" },
        },
        "marquee": {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-100%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out forwards",
        "slide-in-left": "slide-in-left 0.5s ease-out forwards",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "pulse-gold": "pulse-gold 2s ease-in-out infinite",
        "progress-fill": "progress-fill 2s ease-out forwards",
        "marquee": "marquee 25s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
