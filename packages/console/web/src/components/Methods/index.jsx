import * as API from '../../network.js';
import styles from './index.module.scss';
import { useState, useEffect } from 'react';
import { usePostHog } from 'posthog-js/react';
import { useDisclosure } from '@mantine/hooks';
import { loadMethods } from '../../store/methods.js';
import { useDispatch, useSelector } from 'react-redux';
import { loadFromHistory } from '../../store/playground.js';
import { IconFunction, IconUsers } from '@tabler/icons-react';
import { Drawer, Group, Title, Avatar, Text, Stack, Tabs, JsonInput, FloatingIndicator, Button } from '@mantine/core';

const Methods = () => {
    const posthog = usePostHog();
    const dispatch = useDispatch();
    const [ opened, { open, close } ] = useDisclosure(false);
    const loaded = useSelector((store) => store.methods.loaded);
    const methods = useSelector((store) => store.methods.methods);
    const entities = useSelector((store) => store.entities.entities);

    const [ selectedMethod, setSelectedMethod ] = useState(null);
    const [ tabsRef, setTabsRef ] = useState(null);
    const [ controlsRefs, setControlsRefs ] = useState({});
    const [ selectedTab, setSelectedTab ] = useState('example:0');

    useEffect(() => {
        if (!loaded) {
            API.getMethods()
                .then((result) => dispatch(loadMethods(result)));
        }
    }, [ loaded ]);

    const setControlRef = (val) => (node) => {
        controlsRefs[val] = node;
        setControlsRefs(controlsRefs);
    };

    const openMethod = (method) => {
        setSelectedMethod(method);
        open();
        posthog.capture('method:open');
    };

    const tryExample = (example) => {
        dispatch(loadFromHistory({
            method: selectedMethod,
            actor: null,
            params: JSON.stringify(example.params, undefined, 2),
            response: null
        }));

        close();
        posthog.capture('method:tryExample');
    };

    const methodEntities = selectedMethod !== null ? (
        entities.filter((x) => selectedMethod.entities.includes(x.name))
    ) : [];

    return (
        <>
            <Drawer
                size="md"
                offset={8}
                radius="md"
                opened={opened}
                position="right"
                title="Method"
                onClose={close}
                overlayProps={{
                    blur: 4,
                    backgroundOpacity: 0.5,
                }}
            >
                {selectedMethod !== null && (
                    <Stack
                        gap="md"
                        style={{
                            cursor: 'default',
                            userSelect: 'none',
                        }}
                    >
                        <Group>
                            <Avatar size="lg">
                                <IconFunction
                                    size={32}
                                />
                            </Avatar>
                            <Stack gap={0}>
                                <Title order={3}>
                                    {selectedMethod.name}
                                </Title>
                                <Text size="sm">
                                    {selectedMethod.docs.description}
                                </Text>
                            </Stack>
                        </Group>
                        {methodEntities.length > 0 && (
                            <Stack gap="xs">
                                <Title
                                    order={4}
                                >
                                    Entities
                                </Title>
                                {methodEntities.map((entity) => (
                                    <Group
                                        gap="sm"
                                        key={entity.name}
                                    >
                                        <Avatar size="md">
                                            <IconUsers />
                                        </Avatar>
                                        <Stack gap={0}>
                                            <Text size="md">{entity.docs?.displayName || entity.name}</Text>
                                            {entity.docs?.displayName && (
                                                <Text size="xs">
                                                    {entity.name}
                                                </Text>
                                            )}
                                        </Stack>
                                    </Group>
                                ))}
                            </Stack>
                        )}
                        {selectedMethod.docs?.examples && (
                            <Stack gap="xs">
                                <Title
                                    order={4}
                                >
                                    Examples
                                </Title>
                                <Tabs
                                    variant="none"
                                    value={selectedTab}
                                    defaultValue="example:0"
                                    onChange={(value) => {
                                        setSelectedTab(value);
                                        posthog.capture('method:changeExample');
                                    }}
                                >
                                    <Tabs.List
                                        ref={setTabsRef}
                                        className={styles.tabs}
                                    >
                                        {selectedMethod.docs.examples.map((x, k) => (
                                            <Tabs.Tab
                                                key={`example:${k}`}
                                                value={`example:${k}`}
                                                className={styles.tab}
                                                ref={setControlRef(`example:${k}`)}
                                            >
                                                {x.name || `Example #${k + 1}`}
                                            </Tabs.Tab>
                                        ))}
                                        <FloatingIndicator
                                            parent={tabsRef}
                                            className={styles.indicator}
                                            target={controlsRefs[selectedTab]}
                                        />
                                    </Tabs.List>
                                    {selectedMethod.docs.examples.map((x, k) => (
                                        <Tabs.Panel
                                            key={`example:${k}`}
                                            value={`example:${k}`}
                                        >
                                            {x.description && (
                                                <Text
                                                    mb="md"
                                                    size="md"
                                                >
                                                    {x.description}
                                                </Text>
                                            )}
                                            <Title order={6}>Params</Title>
                                            <JsonInput
                                                autosize
                                                readOnly
                                                minRows={7}
                                                value={JSON.stringify(x.params, undefined, 4)}
                                            />
                                            <Title
                                                mt="md"
                                                order={6}
                                            >
                                                Result
                                            </Title>
                                            <JsonInput
                                                autosize
                                                readOnly
                                                minRows={7}
                                                value={JSON.stringify(x.result, undefined, 4)}
                                            />
                                            <Button
                                                mt="md"
                                                fullWidth
                                                onClick={() => tryExample(x)}
                                            >
                                                Try this example
                                            </Button>
                                        </Tabs.Panel>
                                    ))}
                                </Tabs>
                            </Stack>
                        )}
                    </Stack>
                )}
            </Drawer>
            <Group mt="md">
                <Title
                    order={4}
                    style={{
                        cursor: 'default',
                        userSelect: 'none',
                    }}
                >
                    Methods
                </Title>
            </Group>
            <div className={styles.list}>
                {methods.map((method) => (
                    <Group
                        gap="xs"
                        key={method.name}
                        style={{
                            cursor: 'pointer',
                            userSelect: 'none',
                        }}
                        onClick={() => openMethod(method)}
                    >
                        <Avatar size="sm">
                            <IconFunction
                                size={16}
                            />
                        </Avatar>
                        <Text size="sm">
                            {method.name}
                        </Text>
                    </Group>
                ))}
            </div>
        </>
    );
};

export default Methods;
