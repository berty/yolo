import React from "react";
import MessageModal from "./MessageModal/MessageModal";
import { btnLg, primary } from "../../assets/widget-snippets.module.css";
import cn from "classnames";

const ProtocolDisclaimer = ({ closeAction }) => {
  const Header = "Disclaimer";
  const Body = (
    <>
      <p>Yolo does NOT use Berty Protocol yet.</p>
      <p>
        Don't send nudes{" "}
        <span role="img" aria-label="Wink">
          😉
        </span>
      </p>
    </>
  );
  const Footer = (
    <button
      type="button"
      className={cn(btnLg, primary)}
      data-dismiss="modal"
      onClick={closeAction}
    >
      OK
    </button>
  );

  return <MessageModal {...{ Header, Body, Footer }} />;
};

export default ProtocolDisclaimer;
