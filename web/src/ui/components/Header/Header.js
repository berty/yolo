import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useContext } from "react";
import { useHistory } from "react-router-dom";
import LogoBertyTechMono from "../../../assets/svg/LogoBertyTechMono";
import { GlobalContext } from "../../../store/GlobalStore";
import styles from "./Header.module.css";

const Header = ({ children }) => {
  const { updateState } = useContext(GlobalContext);
  const history = useHistory();

  return (
    <>
      <header className={styles.container}>
        <div className={styles.homeBar}>
          <div
            className={styles.homeBarLogo}
            title="Yolo home"
            role="link"
            onClick={() => {
              updateState({
                needsRefresh: true,
              });
              history.push("/");
            }}
          />
          <div className={styles.attr}>
            <a
              className={styles.attrLink}
              href="https://github.com/berty/yolo"
              aria-label="View source on GitHub"
              title="View source on GitHub"
            >
              <FontAwesomeIcon icon={faGithub} />
            </a>
            <a
              className={styles.attrLink}
              href="https://github.com/berty"
              aria-label="Berty Technologies repositories"
              title="Berty Technologies repositories"
            >
              <LogoBertyTechMono />
            </a>
          </div>
        </div>
        {children}
        {/* <aside>{state.resultSource}</aside> */}
      </header>
    </>
  );
};

// Header.whyDidYouRender = {
//   logOwnerReasons: true,
// }

export default Header;
