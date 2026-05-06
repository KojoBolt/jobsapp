import * as React from "react";
import {
  ThemeProvider,
  createTheme,
} from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import type { ThemeOptions } from "@mui/material/styles";

interface AppThemeProps {
  children: React.ReactNode;
  disableCustomTheme?: boolean;
  themeComponents?: ThemeOptions["components"];
}

export default function AppTheme(props: AppThemeProps) {
  const { children, disableCustomTheme, themeComponents } = props;

  const theme = React.useMemo(() => {
    if (disableCustomTheme) {
      return createTheme();
    }

    return createTheme({
      cssVariables: {
        colorSchemeSelector: "data-mui-color-scheme",
        cssVarPrefix: "template",
      },
      colorSchemes: {
        light: {
          palette: {
            primary: {
              main: "#2563EB",
            },
            secondary: {
              main: "#7C3AED",
            },
            background: {
              default: "#F8FAFC",
              paper: "#FFFFFF",
            },
            text: {
              primary: "#1E293B",
              secondary: "#64748B",
            },
            divider: "#E2E8F0",
          },
        },
        dark: {
          palette: {
            primary: {
              main: "#60A5FA",
            },
            secondary: {
              main: "#A78BFA",
            },
            background: {
              default: "#0F172A",
              paper: "#1E293B",
            },
            text: {
              primary: "#F8FAFC",
              secondary: "#94A3B8",
            },
            divider: "#334155",
          },
        },
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              margin: 0,
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              backgroundImage: "none",
              borderRadius: 16,
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: "none",
            },
          },
        },
        ...(themeComponents || {}),
      },
    });
  }, [disableCustomTheme, themeComponents]);

  if (disableCustomTheme) {
    return <>{children}</>;
  }

  return (
    <ThemeProvider theme={theme} disableTransitionOnChange>
      <CssBaseline enableColorScheme />
      {children}
    </ThemeProvider>
  );
}