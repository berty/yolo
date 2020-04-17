import React, {useEffect, useContext} from 'react';
import axios from 'axios';
import {response} from '../../assets/faker.js';
import {ResultContext, PLATFORMS} from '../../store/ResultStore.js';
import {cloneDeep} from 'lodash';

const getData = ({platformId, apiKey}) =>
  process.env.YOLO_UI_TEST === 'true'
    ? Promise.resolve(response).then(async (response) => {
        await new Promise((r) => setTimeout(r, 200));
        return await response;
      })
    : axios.get(
        `${process.env.API_URL}/build-list?artifact_kind=${platformId}&`,
        {
          headers: apiKey
            ? {
                Authorization: 'Basic ' + btoa(`${apiKey}`),
              }
            : {},
        }
      );

const Filters = () => {
  const {state, updateState} = useContext(ResultContext);

  useEffect(() => {
    const makeRequest = () => {
      updateState({
        error: null,
        isLoaded: false,
        items: [],
      });
      getData({platformId: state.platformId, apiKey: state.apiKey}).then(
        (result) => {
          const {
            data: {builds},
          } = result;
          updateState({
            isLoaded: true,
            items: cloneDeep(builds),
            error: null,
          });
        },
        (error) => {
          updateState({
            isLoaded: true,
          });
          if (!error.response)
            return updateState(
              cloneDeep({
                error: {message: 'Network Error', status: 500, data: ''},
              })
            );
          const {
            response: {statusText: message, status, data},
          } = error;
          updateState({
            error: {message, status, data},
          });
        }
      );
    };
    if (state.platformId !== PLATFORMS.none) {
      makeRequest();
    }
  }, [state.apiKey, state.platformId]);

  return (
    <div
      className="container mt-3 ml-4"
      style={{display: 'flex', height: '40px'}}
    >
      <section style={{display: 'flex'}}>
        <div className="form-group">
          <select
            disabled={!state.isLoaded}
            className="mb-4"
            id="kind"
            onChange={(e) => {
              const {
                target: {value: platform},
              } = e;
              return updateState({platformId: platform});
            }}
          >
            <option defaultValue value={PLATFORMS.none}>
              Platform
            </option>
            <option value={PLATFORMS.iOS}>iOS</option>
            <option value={PLATFORMS.android}>Android</option>
          </select>
        </div>
      </section>
    </div>
  );
};

export default Filters;
