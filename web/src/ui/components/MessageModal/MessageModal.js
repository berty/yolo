import React from "react";
import Modal from "../Modal/Modal";
import {
  messageModalOverlay,
  messageModalContainer,
  messageModalBody,
} from "./MessageModal.module.css";

const MessageModal = ({
  Header = null,
  Body = null,
  Footer = null,
  onClose = () => {},
}) => (
  <Modal
    Title={Header}
    Body={Body}
    modalContainerClassName={messageModalContainer}
    modalOverlayClassName={messageModalOverlay}
    modalBodyClassName={messageModalBody}
    Footer={Footer}
    onClose={onClose}
  />
);

export default MessageModal;
