import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../admin/context/ThemeContext";
import { T } from "@/admin/ui/system";

/**
 * Header icon button — same 32px rounded-lg shell as the sidebar toggle and
 * the notification bell, so the control row reads as one set.
 */
export const ThemeToggleButton: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light mode" : "Dark mode"}
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${T.hairline} ${T.ink2}
                  transition-colors hover:bg-[#F4F4F2] hover:text-[#111110]
                  dark:hover:bg-white/5 dark:hover:text-white`}
    >
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
};
