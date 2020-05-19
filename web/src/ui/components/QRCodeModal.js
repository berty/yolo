import React from 'react'
import MessageModal from './MessageModal/MessageModal'

const QRCodeModal = ({ closeAction, children }) => (
  <MessageModal>
    <div style={{ width: 'auto' }}>
      {children}
      <div className="modal-footer">
        <button
          type="button"
          className="btn btn-sm btn-shadow"
          data-dismiss="modal"
          onClick={closeAction}
        >
          Close
        </button>
      </div>
    </div>
  </MessageModal>
)

export default QRCodeModal
