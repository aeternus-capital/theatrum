import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    loaded: false,
    actors: [],
};

const actorsSlice = createSlice({
    name: 'actors',
    initialState,
    reducers: {
        loadActors: (state, action) => {
            return {
                ...state,
                loaded: true,
                actors: action.payload.sort((a, b) => a.name.localeCompare(b.name)),
            };
        },
        createActor: (state, action) => {
            const actor = {
                id: Date.now(),
                ...action.payload,
            };

            localStorage.setItem(`actor:${actor.id}`, JSON.stringify(actor));

            return {
                ...state,
                actors: [
                    ...state.actors,
                    actor,
                ].sort((a, b) => a.name.localeCompare(b.name)),
            };
        },
        editActor: (state, action) => {
            localStorage.setItem(`actor:${action.payload.id}`, JSON.stringify(action.payload));

            return {
                ...state,
                actors: state.actors
                    .map((x) => x.id === action.payload.id ? action.payload : x)
                    .sort((a, b) => a.name.localeCompare(b.name)),
            };
        },
        removeActor: (state, action) => {
            localStorage.removeItem(`actor:${action.payload}`);

            return {
                ...state,
                actors: state.actors.filter((x) => x.id !== action.payload),
            }
        },
    },
});

export const {
    loadActors,
    createActor,
    editActor,
    removeActor,
} = actorsSlice.actions;

export default actorsSlice.reducer;
