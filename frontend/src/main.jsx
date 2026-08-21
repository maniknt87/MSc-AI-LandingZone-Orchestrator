import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

const theme = createTheme({
  palette: { primary: { main: '#2563eb', dark: '#1746a2', light: '#dbeafe' }, secondary: { main: '#7c3aed' }, background: { default: '#f4f7fb', paper: '#fff' }, text: { primary: '#17233c', secondary: '#667085' }, divider: '#e4eaf2' },
  shape: { borderRadius: 12 },
  typography: { fontFamily: 'Inter, "Segoe UI", system-ui, sans-serif', h4: { fontWeight: 700, letterSpacing: '-0.035em' }, h5: { fontWeight: 700, letterSpacing: '-0.025em' }, h6: { fontWeight: 650 }, button: { fontWeight: 600, textTransform: 'none' } },
  components: { MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } }, MuiCard: { styleOverrides: { root: { border: '1px solid #e4eaf2', boxShadow: '0 1px 3px rgba(16,24,40,.04)' } } }, MuiButton: { styleOverrides: { root: { borderRadius: 9, boxShadow: 'none' } } }, MuiTextField: { defaultProps: { size: 'small' } }, MuiFormControl: { defaultProps: { size: 'small' } } },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}><CssBaseline /><App /></ThemeProvider>
  </StrictMode>,
)
