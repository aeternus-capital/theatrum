import { useEffect } from 'react';
import styles from './index.module.scss';
import { usePostHog } from 'posthog-js/react';
import { IconTrash } from '@tabler/icons-react';
import { useDispatch, useSelector } from 'react-redux';
import { loadFromHistory } from '../../store/playground.js';
import { loadHistory, clearHistory } from '../../store/history.js';
import { Group, Title, ActionIcon, Text, Tooltip, JsonInput } from '@mantine/core';

const History = () => {
    const posthog = usePostHog();
    const dispatch = useDispatch();
    const loaded = useSelector((store) => store.history.loaded);
    const history = useSelector((state) => state.history.history);

    const clear = () => {
        const removeRecords = [];
        for (let i = 0, len = localStorage.length; i < len; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('request:')) {
                removeRecords.push(key);
            }
        }

        for (const key in removeRecords) {
            localStorage.removeItem(removeRecords[key]);
        }

        dispatch(clearHistory());
        posthog.capture('history:clear', {
            items: removeRecords.length,
            mostOld: removeRecords.length > 0 ? removeRecords[removeRecords.length - 1].replace('request:', '') : null,
        });
    };

    useEffect(() => {
        if (!loaded) {
            const history = [];

            for (let i = 0, len = localStorage.length; i < len; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('request:')) {
                    try {
                        history.push(JSON.parse(localStorage.getItem(key)));
                    } catch (_) {}
                }
            }

            dispatch(loadHistory(history));
        }
    }, [ loaded ]);

    return (
        <>
            <Group
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                }}
            >
                <Title
                    order={4}
                    style={{
                        cursor: 'default',
                        userSelect: 'none',
                    }}
                >
                    History
                </Title>
                {history.length > 0 && (
                    <Tooltip
                        label="Clear history"
                        position="right"
                    >
                        <ActionIcon
                            size="xs"
                            onClick={clear}
                        >
                            <IconTrash />
                        </ActionIcon>
                    </Tooltip>
                )}
            </Group>
            <div className={styles.list}>
                {history.map((x) => (
                    <Tooltip
                        key={x.id}
                        position="right"
                        label={
                            <JsonInput
                                autosize
                                readOnly
                                minRows={5}
                                value={JSON.stringify(JSON.parse(x.params) || {}, undefined, 2)}
                            />
                        }
                    >
                        <div
                            onClick={() => dispatch(loadFromHistory(x))}
                            style={{
                                cursor: 'pointer',
                                userSelect: 'none',
                            }}
                        >
                            <Text
                                size="sm"
                            >
                                {x.method.name}
                            </Text>
                            <Text
                                size="xs"
                            >
                                Actor: {x.actor.name}
                            </Text>
                            <Text
                                size="xs"
                            >
                                Time: {new Date(x.timestamp).toLocaleString()}
                            </Text>
                        </div>
                    </Tooltip>
                ))}
            </div>
        </>
    );
};

export default History;
