import React from "react";
import MessageModal from "./MessageModal/MessageModal";
import { btnLg, primary } from "../../assets/widget-snippets.module.css";
import cn from "classnames";

const QRCodeModal = ({ closeAction, children }) => (
  <MessageModal
    onClose={closeAction}
    Header="Scan me!"
    Body={children}
    Footer={
      <button
        type="button"
        className={cn(btnLg, primary)}
        data-dismiss="modal"
        onClick={closeAction}
      >
        Close
      </button>
    }
  />
);

export default QRCodeModal;
