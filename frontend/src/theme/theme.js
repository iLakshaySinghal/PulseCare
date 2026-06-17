import { createTheme } from '@mui/material/styles';

export const getTheme = (mode) => {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? '#6366f1' : '#4f46e5', // Indigo glow
        light: isDark ? '#818cf8' : '#6366f1',
        dark: isDark ? '#4f46e5' : '#3730a3',
        contrastText: '#ffffff'
      },
      secondary: {
        main: isDark ? '#ec4899' : '#db2777', // Pink highlights
        light: isDark ? '#f472b6' : '#ec4899',
        dark: isDark ? '#db2777' : '#9d174d'
      },
      background: {
        default: isDark ? '#0f172a' : '#f8fafc', // deep blue slate vs soft slate-50
        paper: isDark ? '#1e293b' : '#ffffff'    // slate 800 vs pure white
      },
      text: {
        primary: isDark ? '#f8fafc' : '#0f172a',
        secondary: isDark ? '#94a3b8' : '#475569',
        disabled: isDark ? '#64748b' : '#94a3b8'
      },
      divider: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)',
      error: {
        main: '#f43f5e'
      },
      warning: {
        main: '#f59e0b'
      },
      success: {
        main: '#10b981'
      },
      info: {
        main: '#0ea5e9'
      }
    },
    typography: {
      fontFamily: '"Inter", sans-serif',
      h1: { fontFamily: '"Outfit", sans-serif', fontWeight: 800 },
      h2: { fontFamily: '"Outfit", sans-serif', fontWeight: 700 },
      h3: { fontFamily: '"Outfit", sans-serif', fontWeight: 700 },
      h4: { fontFamily: '"Outfit", sans-serif', fontWeight: 600 },
      h5: { fontFamily: '"Outfit", sans-serif', fontWeight: 600 },
      h6: { fontFamily: '"Outfit", sans-serif', fontWeight: 600 },
      button: {
        fontFamily: '"Outfit", sans-serif',
        textTransform: 'none',
        fontWeight: 600
      }
    },
    shape: {
      borderRadius: 12
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '10px 20px',
            boxShadow: 'none',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: isDark 
                ? '0 4px 12px 0 rgba(99, 102, 241, 0.2)' 
                : '0 4px 12px 0 rgba(79, 70, 229, 0.15)'
            }
          },
          containedPrimary: {
            background: isDark 
              ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' 
              : 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
            '&:hover': {
              background: isDark 
                ? 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)' 
                : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
            }
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.45)' : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(16px)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 23, 42, 0.08)',
            boxShadow: isDark 
              ? '0 8px 32px 0 rgba(0, 0, 0, 0.4)' 
              : '0 8px 32px 0 rgba(15, 23, 42, 0.06)',
            borderRadius: 16
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.45)' : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(16px)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 23, 42, 0.08)',
            boxShadow: isDark 
              ? '0 8px 32px 0 rgba(0, 0, 0, 0.4)' 
              : '0 8px 32px 0 rgba(15, 23, 42, 0.06)',
            borderRadius: 16
          }
        }
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              backgroundColor: isDark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255, 255, 255, 0.9)',
              borderRadius: 8,
              transition: 'border-color 0.2s',
              '& fieldset': {
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.12)'
              },
              '&:hover fieldset': {
                borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(15, 23, 42, 0.25)'
              },
              '&.Mui-focused fieldset': {
                borderColor: isDark ? '#6366f1' : '#4f46e5'
              }
            }
          }
        }
      }
    }
  });
};

export default getTheme;
