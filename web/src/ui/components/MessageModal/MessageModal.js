import React from 'react'
import './MessageModal.scss'

const MessageModal = ({ children }) => (
  <>
    <div className="faded" />
    <div className="MessageModal">
      <div className="modal modal-blur fade show">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            {children}
          </div>
        </div>
      </div>
    </div>
  </>
)

export default MessageModal
