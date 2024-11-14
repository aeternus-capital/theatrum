import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    loaded: false,
    entities: [],
};

const entitiesSlice = createSlice({
    name: 'entities',
    initialState,
    reducers: {
        loadEntities: (state, action) => {
            return {
                ...state,
                loaded: true,
                entities: action.payload.sort((a, b) => a.name.localeCompare(b.name)),
            };
        },
    },
});

export const {
    loadEntities,
} = entitiesSlice.actions;

export default entitiesSlice.reducer;
