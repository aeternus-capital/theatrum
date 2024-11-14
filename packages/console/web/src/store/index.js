import { configureStore } from '@reduxjs/toolkit';

import app from './app.js';
import actors from './actors.js';
import methods from './methods.js';
import history from './history.js';
import entities from './entities.js';
import playground from './playground.js';

export default configureStore({
    reducer: {
        app,
        actors,
        methods,
        history,
        entities,
        playground,
    },
});
