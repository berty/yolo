import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import queryString from "query-string";

export const counterSlice = createSlice({
  name: "counter",
  initialState: {
    value: 0,
    resultsLength: 0,
  },
  reducers: {
    increment: (state) => {
      // Redux Toolkit allows us to write "mutating" logic in reducers. It
      // doesn't actually mutate the state because it uses the Immer library,
      // which detects changes to a "draft state" and produces a brand new
      // immutable state based off those changes
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action) => {
      state.value += action.payload;
    },
    setResultsLength: (state, action) => {
      state.resultsLength = action.payload;
    },
  },
});

export const {
  increment,
  decrement,
  incrementByAmount,
  setResultsLength,
} = counterSlice.actions;

// The function below is called a thunk and allows us to perform async logic. It
// can be dispatched like a regular action: `dispatch(incrementAsync(10))`. This
// will call the thunk with the `dispatch` function as the first argument. Async
// code can then be executed and other actions can be dispatched
export const incrementAsync = (amount) => (dispatch) => {
  setTimeout(() => {
    dispatch(incrementByAmount(amount));
  }, 1000);
};

export const getResults = () => (dispatch) => {
  const options = {
    method: "get",
    baseURL: `${process.env.REACT_APP_API_SERVER}/api/build-list`,
    params: { limit: 10 },

    paramsSerializer: (params) => queryString.stringify(params),
    headers: {
      Authorization: `Basic ${btoa(process.env.REACT_APP_YOLO_APP_PW)}`,
    },
  };
  return axios(options)
    .then(
      (results) => dispatch(setResultsLength(100)),
      (err) => {
        console.log(`err:`, err);
        dispatch(setResultsLength(-1));
      }
    )
    .catch((err) => {
      console.log(err);
      dispatch(setResultsLength(-10));
    });
};

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state) => state.counter.value)`
export const selectCount = (state) => state.counter.value;
export const selectResultsLength = (state) => state.counter.resultsLength;

export default counterSlice.reducer;
