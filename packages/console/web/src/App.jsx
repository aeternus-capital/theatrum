import store from './store';
import '@mantine/core/styles.css';
import * as API from './network.js';
import '@mantine/notifications/styles.css';
import { loadFlags } from './store/app.js';
import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ModalsProvider } from '@mantine/modals';
import { PostHogProvider } from 'posthog-js/react';
import { Notifications } from '@mantine/notifications';
import { Provider as StoreProvider, useDispatch } from 'react-redux';
import { createTheme, MantineProvider, AppShell } from '@mantine/core';

import Header from './components/Header';
import Footer from './components/Footer';
import Actions from './components/Actors';
import History from './components/History';
import Methods from './components/Methods';
import Entities from './components/Entities';
import Playground from './components/Playground';

const theme = createTheme({
    primaryColor: 'blue',
});

const App = () => {
    return (
        <AppShell
            padding="md"
            header={{ height: 60 }}
            footer={{ height: 40 }}
            navbar={{ width: 250, breakpoint: 'md' }}
            aside={{ width: 250, breakpoint: 'md' }}
        >
            <AppShell.Header>
                <Header />
            </AppShell.Header>
            <AppShell.Navbar
                p="md"
                style={{
                    overflow: 'hidden',
                    overflowY: 'auto',
                }}
            >
                <History />
            </AppShell.Navbar>
            <AppShell.Main>
                <Playground />
            </AppShell.Main>
            <AppShell.Aside
                p="md"
                style={{
                    overflow: 'hidden',
                    overflowY: 'auto',
                }}
            >
                <Actions />
                <Entities />
                <Methods />
            </AppShell.Aside>
            <AppShell.Footer p="sm">
                <Footer />
            </AppShell.Footer>
        </AppShell>
    );
};

const PosthogProvider = ({ children }) => {
    const dispatch = useDispatch();
    const [ telemetryEnabled, setTelemetryEnabled ] = useState(false);

    useEffect(() => {
        API.getFlags()
            .then((flags) => {
                dispatch(loadFlags(flags));
                setTelemetryEnabled(!!flags.telemetry);
            })
            .catch(() => null);
    }, []);

    if (!telemetryEnabled) {
        return children;
    }

    return (
        <PostHogProvider
            apiKey="phc_aUgtDVxCCZnRZ7cXx9wQPUoySWzhduBmsxNjwmwMeOR"
            options={{
                autocapture: false,
                api_host: 'https://eu.i.posthog.com',
            }}
        >
            {children}
        </PostHogProvider>
    );
};

createRoot(document.getElementById('root')).render(
    <StoreProvider store={store}>
        <MantineProvider theme={theme}>
            <ModalsProvider>
                <Notifications autoClose={5000} />
                <PosthogProvider>
                    <App />
                </PosthogProvider>
            </ModalsProvider>
        </MantineProvider>
    </StoreProvider>
);
