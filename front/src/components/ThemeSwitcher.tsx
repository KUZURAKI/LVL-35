import React from "react";
import styles from "../components/Components.module.scss";
import { Sun, MoonStar } from "lucide-react";

interface ThemeSwitcherProps {
  theme: string;
  setTheme: (theme: string) => void;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ theme, setTheme }) => {
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <button onClick={toggleTheme} className={styles.themeButton}>
      {theme === "dark" ? (
        <Sun className="icon" />
      ) : (
        <MoonStar className="icon" />
      )}
    </button>
  );
};

export default ThemeSwitcher;
