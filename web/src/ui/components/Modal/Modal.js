import React from "react";
import { X } from "react-feather";
import {
  faded,
  modalOverlay,
  modalContainer,
  modalHeader,
  modalClose,
  modalTitle,
  modalBody,
  modalFooter,
} from "../../../assets/modal-snippets.module.css";

const Modal = ({
  Title = null,
  Body = null,
  Footer = null,
  onClose = () => {},
  modalOverlayClassName = "",
  modalContainerClassName = "",
  modalHeaderClassName = "",
  modalBodyClassName = "",
  modalFooterClassName = "",
}) => (
  <>
    <div
      className={faded}
      onClick={(e) => {
        onClose();
        e.stopPropagation();
      }}
    />
    <div
      className={modalOverlayClassName || modalOverlay}
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className={modalContainerClassName || modalContainer}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className={modalHeaderClassName || modalHeader}>
          <X
            className={modalClose}
            data-dismiss="modal"
            aria-label="Close"
            onClick={onClose}
          />
          {Title && <span className={modalTitle}>{Title}</span>}
        </div>

        {Body && <div className={modalBodyClassName || modalBody}>{Body}</div>}
        {Footer && (
          <div className={modalFooterClassName || modalFooter}>{Footer}</div>
        )}
      </div>
    </div>
  </>
);

export default Modal;
