import * as API from '../../network.js';
import styles from './index.module.scss';
import { useState, useEffect } from 'react';
import { usePostHog } from 'posthog-js/react';
import { createRecord } from '../../store/history.js';
import JsonInspector from '@microlink/react-json-view';
import { notifications } from '@mantine/notifications';
import { useDispatch, useSelector } from 'react-redux';
import { useMantineColorScheme, rem } from '@mantine/core';
import { IconCheck, IconCancel, IconBug } from '@tabler/icons-react';
import { Table, Text, Timeline, Tooltip, FloatingIndicator } from '@mantine/core';
import { Grid, Select, Button, ActionIcon, Divider, Tabs, JsonInput } from '@mantine/core';
import { selectMethod, selectActor, updateParams, updateResponse } from '../../store/playground.js';

const DefaultTraceEvents = {
    'executor:init': () => {
        return 'Executor was inited';
    },
    'executor:run': ({ 'internal:method': name, 'internal:isInternal': isInternal }) => {
        return `Executor was invoked method "${name || '<hidden method>'}"${isInternal ? ' from another method using context' : ''}`;
    },
    'executor:check_actor': ({ 'internal:method': name }) => {
        return `Executor checked actor by method "${name || '<hidden method>'}" specification`;
    },
    'executor:check_roles': ({ 'internal:method': name }) => {
        return `Executor checked actor's roles by method "${name || '<hidden method>'}" specification`;
    },
    'executor:invoke': ({ 'internal:method': name }) => {
        return `Executor was invoked method "${name || '<hidden method>'}"`;
    },
    'method:invoked': ({ 'internal:method': name }) => {
        return `Method "${name || '<hidden method>'}" was invoked`;
    },
    'method:check_params': ({ 'internal:method': name }) => {
        return `Method "${name || '<hidden method>'}" checked params by self params schema`;
    },
    'method:startup': ({ 'internal:method': name }) => {
        return `Method "${name || '<hidden method>'}" started handler with received params and context`;
    },
    'method:result': ({ 'internal:method': name }) => {
        return `Method "${name || '<hidden method>'}" was successfully run handler and return result`;
    },
    'executor:result': ({ 'internal:method': name }) => {
        return `Executor was successfully run method "${name || '<hidden method>'}" and return result`;
    },
};

const reverseTracer = (tracer) => {
    const newTracer = [];

    for (let i = 0; i < tracer.length; i++) {
        newTracer.push({
            timestamp: tracer[i].timestamp,
            event: tracer[i].event,
            data: tracer[i].data || {},
            diff: i > 0 ? tracer[i].timestamp - tracer[0].timestamp : null,
            diffPrevious: i > 0 ? tracer[i].timestamp - tracer[i - 1].timestamp : null,
        });
    }

    return newTracer.toReversed();
};

const TraceEvent = ({ timestamp, event, data = {}, diff = null, diffPrevious = null, type = 'info' }) => {
    const filteredData = Object.keys(data).reduce((a, x) => {
        if (x.startsWith('internal:')) {
            return a;
        }

        return {
            ...a,
            [x]: data[x],
        };
    }, {});

    return (
        <Timeline.Item
            __active
            __lineActive
            bullet={<div />}
            color={type !== 'error' ? 'blue' : 'red'}
            lineVariant={type !== 'error' && type !== 'success' ? 'solid' : 'dashed'}
            title={
                <div className={styles.tracer__item__title}>
                    {
                        DefaultTraceEvents[event] ? (
                            DefaultTraceEvents[event](data)
                        ) : event
                    }
                </div>
            }
        >
            <div className={styles.tracer__item__time}>
                <Tooltip
                    disabled={diff === null}
                    label="Time from executor init"
                >
                    <Text
                        size="xs"
                        c="dimmed"
                    >
                        {diff !== null ? `${diff}ms` : 'Start'}
                    </Text>
                </Tooltip>
                <Tooltip
                    disabled={diffPrevious === null}
                    label="Time from previous step"
                >
                    <Text
                        size="xs"
                        c="dimmed"
                    >
                        {new Date(timestamp).toLocaleTimeString()} {diffPrevious !== null && (
                        `(+${diffPrevious}ms)`
                    )}
                    </Text>
                </Tooltip>
            </div>
            {Object.keys(filteredData).length > 0 && (
                <JsonInput
                    autosize
                    readOnly
                    minRows={5}
                    value={JSON.stringify(filteredData, undefined, 2)}
                />
            )}
        </Timeline.Item>
    );
};

const Playground = () => {
    const posthog = usePostHog();
    const dispatch = useDispatch();
    const { colorScheme } = useMantineColorScheme();
    const actors = useSelector((store) => store.actors.actors);
    const methods = useSelector((store) => store.methods.methods);

    const method = useSelector((store) => store.playground.method);
    const actor = useSelector((store) => store.playground.actor);
    const params = useSelector((store) => store.playground.params);
    const response = useSelector((store) => store.playground.response);

    const [ tabsRef, setTabsRef ] = useState(null);
    const [ controlsRefs, setControlsRefs ] = useState({});
    const [ selectedTab, setSelectedTab ] = useState('result');

    useEffect(() => {
        if (response !== null) {
            setSelectedTab(!response.tracer ? (
                typeof response.result === 'object' ? 'result' : 'raw'
            ) : 'tracer');
        }
    }, [ response ]);

    const setControlRef = (val) => (node) => {
        controlsRefs[val] = node;
        setControlsRefs(controlsRefs);
    };

    const isParamsValid = () => {
        try {
            JSON.parse(params);
            return true;
        } catch (e) {
            return false;
        }
    };

    const generatePlaceholder = (methodName) => {
        if (methodName !== null) {
            const method = methods.find((x) => x.name === methodName);
            if (method && method.paramsSchema) {
                const placeholder = Object.keys(method.paramsSchema)
                    .reduce((acc, key) => {
                        acc[key] = '';
                        return acc;
                    }, {});

                dispatch(updateParams(JSON.stringify(placeholder, undefined, 2)));
            }
        }
    };

    const execute = (debug = false) => {
        dispatch(updateResponse(null));

        const clearedActor = {
            entity: actor.entity,
            roles: actor.roles,
            data: actor.data,
        };

        const notificationId = notifications.show({
            loading: true,
            title: 'Executing your method...',
            message: 'Please wait for result',
            autoClose: false,
            withCloseButton: false,
        });

        return API.execute(clearedActor, method.name, JSON.parse(params), debug)
            .then((response) => {
                dispatch(updateResponse(response));
                dispatch(createRecord({
                    method,
                    actor,
                    params,
                    response,
                    timestamp: Date.now(),
                }));

                posthog.capture('playground:execute', {
                    debug,
                    params: JSON.stringify(params).length,
                    response: JSON.stringify(response).length,
                    metrics: Object.keys(response.metrics || {}).map((x) => x.startsWith('user_')).length,
                    performance: {
                        commonTime: response.metrics?.commonTime || null,
                        executeTime: response.metrics?.executeTime || null,
                    },
                });

                return notifications.update({
                    id: notificationId,
                    loading: false,
                    autoClose: 2000,
                    withCloseButton: true,
                    title: `Success`,
                    message: `Method "${method.name}" was successfully executed`,
                    icon: (
                        <IconCheck
                            style={{
                                width: rem(18),
                                height: rem(18),
                            }}
                        />
                    ),
                });
            })
            .catch((e) => {
                posthog.capture('playground:executeError', {
                    isTheatrumError: typeof e.code === 'number',
                });

                if (!!e.code) {
                    return notifications.update({
                        id: notificationId,
                        loading: false,
                        autoClose: 10000,
                        withCloseButton: true,
                        color: 'red',
                        title: `TheatrumError #${e.code}`,
                        message: `${e.message}. Try to execute with tracer for more details.`,
                        icon: (
                            <IconCancel
                                style={{
                                    width: rem(18),
                                    height: rem(18),
                                }}
                            />
                        ),
                    });
                }

                return notifications.update({
                    id: notificationId,
                    loading: false,
                    autoClose: 10000,
                    withCloseButton: true,
                    color: 'red',
                    title: 'Error',
                    message: `${e.message}. Try to execute with tracer for more details.`,
                    icon: (
                        <IconCancel
                            style={{
                                width: rem(18),
                                height: rem(18),
                            }}
                        />
                    ),
                });
            });
    };

    return (
        <>
            <Grid>
                <Grid.Col span={7}>
                    <Select
                        label="Method"
                        placeholder="Select method"
                        data={methods.map((x) => x.name)}
                        value={method !== null ? method.name : null}
                        onChange={(value) => {
                            dispatch(selectMethod(methods.find((x) => x.name === value) || null));
                            dispatch(selectActor(null));
                            generatePlaceholder(value);
                        }}
                    />
                </Grid.Col>
                <Grid.Col span={3}>
                    <Select
                        label="Actor"
                        placeholder="Select actor"
                        disabled={method === null}
                        value={actor !== null ? String(actor.id) : null}
                        onChange={(value) => {
                            dispatch(selectActor(actors.find((x) => x.id === Number(value)) || null));
                        }}
                        data={
                            actors
                                .filter((x) => method !== null && method.entities.includes(x.entity))
                                .map((x) => ({
                                    value: String(x.id),
                                    label: `[${x.entity}] ${x.name}`,
                                }))
                        }
                    />
                </Grid.Col>
                <Grid.Col span={2}>
                    <div className={styles.execute}>
                        <Button
                            fullWidth
                            onClick={() => execute()}
                            className={styles.execute__run}
                            disabled={
                                method === null || actor === null || !isParamsValid()
                            }
                        >
                            Execute
                        </Button>
                        <Tooltip
                            position="bottom"
                            label="Execute with tracer"
                        >
                            <ActionIcon
                                size="lg"
                                onClick={() => execute(true)}
                                className={styles.execute__debug}
                                disabled={
                                    method === null || actor === null || !isParamsValid()
                                }
                            >
                                <IconBug size={18} />
                            </ActionIcon>
                        </Tooltip>
                    </div>
                </Grid.Col>
            </Grid>
            <JsonInput
                mt="xs"
                autosize
                minRows={10}
                formatOnBlur
                label="Params"
                value={params}
                disabled={method === null}
                onChange={(value) => dispatch(updateParams(value))}
            />
            {response !== null && (
                <>
                    <Divider mt="lg" mb="md" />
                    <Tabs
                        variant="none"
                        value={selectedTab}
                        defaultValue="result"
                        onChange={(value) => {
                            setSelectedTab(value);
                            posthog.capture('playground:selectResultTab', {
                                tab: value,
                            });
                        }}
                    >
                        <Tabs.List
                            ref={setTabsRef}
                            className={styles.tabs}
                        >
                            {typeof response.result === 'object' && (
                                <Tabs.Tab
                                    value="result"
                                    className={styles.tab}
                                    ref={setControlRef('result')}
                                >
                                    Result
                                </Tabs.Tab>
                            )}
                            <Tabs.Tab
                                value="raw"
                                className={styles.tab}
                                ref={setControlRef('raw')}
                            >
                                Raw
                            </Tabs.Tab>
                            {response.tracer && (
                                <Tabs.Tab
                                    value="tracer"
                                    className={styles.tab}
                                    ref={setControlRef('tracer')}
                                >
                                    Tracer
                                </Tabs.Tab>
                            )}
                            {response.metrics && (
                                <Tabs.Tab
                                    value="metrics"
                                    className={styles.tab}
                                    ref={setControlRef('metrics')}
                                >
                                    Metrics
                                </Tabs.Tab>
                            )}
                            <FloatingIndicator
                                parent={tabsRef}
                                className={styles.indicator}
                                target={controlsRefs[selectedTab]}
                            />
                        </Tabs.List>
                        <Tabs.Panel value="result">
                            <JsonInspector
                                sortKeys
                                name={null}
                                indentWidth={4}
                                iconStyle="square"
                                theme={colorScheme === 'dark' ? 'google' : undefined}
                                src={typeof response.result === 'object' ? response.result : {}}
                                style={colorScheme === 'dark' ? {
                                    backgroundColor: 'none'
                                } : {}}
                            />
                        </Tabs.Panel>
                        <Tabs.Panel value="raw">
                            <JsonInput
                                autosize
                                readOnly
                                minRows={10}
                                label="Raw result"
                                value={JSON.stringify(response.result, undefined, 2)}
                            />
                        </Tabs.Panel>
                        {response.tracer && (
                            <Tabs.Panel value="tracer">
                                <Timeline
                                    mt="md"
                                    size="xs"
                                    lineWidth={2}
                                >
                                    <TraceEvent
                                        diffPrevious={null}
                                        type={response.error ? 'error' : 'success'}
                                        event={response.error ? 'Unexpected error' : 'Execute successfully finished'}
                                        data={response.error ? response.error : { result: response.result } || {}}
                                        timestamp={response.tracer[response.tracer.length - 1].timestamp}
                                        diff={response.tracer[response.tracer.length - 1].timestamp - response.tracer[0].timestamp}
                                    />
                                    {reverseTracer(response.tracer).map((x, k) => (
                                        <TraceEvent
                                            key={`${x.timestamp}:${x.event}:${k}`}
                                            {...x}
                                        />
                                    ))}
                                </Timeline>
                            </Tabs.Panel>
                        )}
                        {response.metrics && (
                            <Tabs.Panel value="metrics">
                                <Table
                                    style={{
                                        userSelect: 'none',
                                    }}
                                >
                                    <Table.Thead>
                                        <Table.Th>Metric</Table.Th>
                                        <Table.Th>Value</Table.Th>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {typeof response.metrics.commonTime === 'number' && (
                                            <Table.Tr>
                                                <Table.Td>Common request time</Table.Td>
                                                <Table.Td>{response.metrics.commonTime}ms</Table.Td>
                                            </Table.Tr>
                                        )}
                                        {typeof response.metrics.executeTime === 'number' && (
                                            <Table.Tr>
                                                <Table.Td>Execution time</Table.Td>
                                                <Table.Td>{response.metrics.executeTime}ms</Table.Td>
                                            </Table.Tr>
                                        )}
                                        {typeof response.metrics === 'object' && (
                                            Object.keys(response.metrics)
                                                .filter((x) => x.startsWith('user_'))
                                                .map((x) => (
                                                    <Table.Tr>
                                                        <Table.Td>{x.replace('user_', '')}</Table.Td>
                                                        <Table.Td>{response.metrics[x]}</Table.Td>
                                                    </Table.Tr>
                                                ))
                                        )}
                                    </Table.Tbody>
                                </Table>
                            </Tabs.Panel>
                        )}
                    </Tabs>
                </>
            )}
        </>
    );
};

export default Playground;
