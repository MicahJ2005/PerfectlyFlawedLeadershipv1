import { createContext, useContext, useState } from "react";

const ThemeContext = createContext({ darkMode: false, toggleDark: () => {} });

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem("darkMode") === "true"; } catch { return false; }
  });

  const toggleDark = () => setDarkMode(prev => {
    const next = !prev;
    try { localStorage.setItem("darkMode", String(next)); } catch {}
    return next;
  });

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
