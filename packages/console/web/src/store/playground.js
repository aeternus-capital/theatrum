import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    method: null,
    actor: null,
    params: '{}',
    response: null,
};

const playgroundSlice = createSlice({
    name: 'playground',
    initialState,
    reducers: {
        selectMethod: (state, action) => {
            return {
                ...state,
                method: action.payload,
            };
        },
        selectActor: (state, action) => {
            return {
                ...state,
                actor: action.payload,
            };
        },
        updateParams: (state, action) => {
            return {
                ...state,
                params: action.payload,
            };
        },
        updateResponse: (state, action) => {
            return {
                ...state,
                response: action.payload,
            };
        },
        loadFromHistory: (state, action) => {
            return {
                ...state,
                method: action.payload.method,
                actor: action.payload.actor,
                params: action.payload.params,
                response: action.payload.response,
            };
        },
    },
});

export const {
    selectMethod,
    selectActor,
    updateParams,
    updateResponse,
    loadFromHistory,
} = playgroundSlice.actions;

export default playgroundSlice.reducer;
