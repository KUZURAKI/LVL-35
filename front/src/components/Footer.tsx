import styles from "../components/Components.module.scss";

const Footer = () => {
  return (
    <footer>
      <hr className={styles.hrWidth} />
      <div className={styles.container}>
        <div className={styles.contant}>
          <div className={styles.contantLeft}>
            <p>@fkskrrkdjs</p>
            <video src="items.mp4" autoPlay muted loop playsInline></video>
          </div>
          <div className={styles.contantRight}>
            <img src="i-link.jpg" alt="" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
