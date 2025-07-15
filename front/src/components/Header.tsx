import { useState, useEffect } from "react";
import ThemeSwitcher from "../components/ThemeSwitcher";
import styles from "../components/Components.module.scss";
import { Link } from "react-router-dom";
import { CodeXml, LogIn } from "lucide-react";

interface HeaderProps {
  onOpenModal: () => void;
}

const Header = ({ onOpenModal }: HeaderProps) => {
  const [theme, setTheme] = useState<string>(() => {
    return localStorage.getItem("theme") || "dark";
  });

  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <header>
      <div className={styles.container}>
        <Link to="/">
          <CodeXml className="icon" />
        </Link>
        <div className={styles.linkItems}>
          <button className={styles.loginButton} onClick={onOpenModal}>
            <LogIn className="icon" />
          </button>
          <hr className={styles.hrHeight} />
          <ThemeSwitcher theme={theme} setTheme={setTheme} />
          {/* <hr className={styles.hrHeight} />
          <button className={styles.loginButton}>Ru</button>
          <button className={styles.loginButton}>En</button> */}
        </div>
      </div>
      <hr className={styles.hrWidth} />
    </header>
  );
};

export default Header;
