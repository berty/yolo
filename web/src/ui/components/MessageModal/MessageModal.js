import React from 'react';
import './MessageModal.scss';

const MessageModal = ({closeAction}) => {
  return (
    <>
      <div className="faded" />
      <div className="MessageModal">
        <div className="modal modal-blur fade show">
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">🚧 Disclaimer 🚧</h5>
                <button
                  type="button"
                  className="close"
                  data-dismiss="modal"
                  aria-label="Close"
                  onClick={closeAction}
                ></button>
              </div>
              <div className="modal-body">
                Yolo does NOT use Berty Protocol yet. <br />
                Don't send nudes 😉
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-sm btn-shadow"
                  data-dismiss="modal"
                  onClick={closeAction}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MessageModal;
