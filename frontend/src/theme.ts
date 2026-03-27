import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4338CA', // Indigo 700 - trustworthy, stable, protective
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#10B981', // Emerald 500 - success/safe
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F8FAFC', // Slate 50
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F172A', // Slate 900
      secondary: '#64748B', // Slate 500
    },
    divider: '#E2E8F0', // Slate 200
  },
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, color: '#0F172A' },
    h2: { fontWeight: 700, color: '#0F172A' },
    h3: { fontWeight: 700, color: '#0F172A' },
    h4: { fontWeight: 700, color: '#0F172A' },
    h5: { fontWeight: 600, color: '#0F172A' },
    h6: { fontWeight: 600, color: '#0F172A' },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
    body1: {
      color: '#334155',
      lineHeight: 1.6,
    },
    body2: {
      color: '#64748B',
    }
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          '&:hover': {
            backgroundColor: '#3730A3', // Indigo 800
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
          border: '1px solid #E2E8F0',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: '#0F172A',
          boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          borderBottom: '1px solid #E2E8F0',
        },
      },
    },
  },
});
