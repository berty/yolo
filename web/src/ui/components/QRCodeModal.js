import React from 'react'
import MessageModal from './MessageModal/MessageModal'

const QRCodeModal = ({ closeAction, children }) => (
  <MessageModal onClose={closeAction}>
    <h2 style={{ color: 'darkgoldenrod', fontSize: '1.4rem' }}>
      Scan me!
      {' '}
      <span role="img" aria-label="a cellular phone">
        📱
      </span>
    </h2>
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
