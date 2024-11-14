import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    flags: {},
};

const appSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        loadFlags: (state, action) => {
            return {
                ...state,
                flags: action.payload,
            };
        },
    },
});

export const {
    loadFlags,
} = appSlice.actions;

export default appSlice.reducer;
