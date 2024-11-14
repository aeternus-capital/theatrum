import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    loaded: false,
    history: [],
};

const historySlice = createSlice({
    name: 'history',
    initialState,
    reducers: {
        loadHistory: (state, action) => {
            return {
                ...state,
                loaded: true,
                history: action.payload.sort((a, b) => b.timestamp - a.timestamp),
            };
        },
        createRecord: (state, action) => {
            const record = {
                id: Date.now(),
                ...action.payload,
            };

            localStorage.setItem(`request:${record.id}`, JSON.stringify(record));

            return {
                ...state,
                history: [
                    record,
                    ...state.history,
                ],
            };
        },
        clearHistory: (state) => {
            return {
                ...state,
                history: [],
            };
        }
    },
});

export const {
    loadHistory,
    createRecord,
    clearHistory,
} = historySlice.actions;

export default historySlice.reducer;
