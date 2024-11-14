import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    loaded: false,
    methods: [],
};

const methodsSlice = createSlice({
    name: 'methods',
    initialState,
    reducers: {
        loadMethods: (state, action) => {
            return {
                ...state,
                loaded: true,
                methods: action.payload.sort((a, b) => a.name.localeCompare(b.name)),
            };
        },
    },
});

export const {
    loadMethods,
} = methodsSlice.actions;

export default methodsSlice.reducer;
