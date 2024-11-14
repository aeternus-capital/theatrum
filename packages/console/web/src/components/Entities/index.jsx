import * as API from '../../network.js';
import styles from './index.module.scss';
import { useState, useEffect } from 'react';
import { usePostHog } from 'posthog-js/react';
import { useDisclosure } from '@mantine/hooks';
import { loadEntities } from '../../store/entities.js';
import { useDispatch, useSelector } from 'react-redux';
import { IconUsers, IconUser, IconFunction } from '@tabler/icons-react';
import { Drawer, Group, Title, Avatar, Text, Stack } from '@mantine/core';

const Entities = () => {
    const posthog = usePostHog();
    const dispatch = useDispatch();
    const [ opened, { open, close } ] = useDisclosure(false);
    const actors = useSelector((store) => store.actors.actors);
    const loaded = useSelector((store) => store.entities.loaded);
    const methods = useSelector((store) => store.methods.methods);
    const entities = useSelector((store) => store.entities.entities);

    const [ selectedEntity, setSelectedEntity ] = useState(null);

    useEffect(() => {
        if (!loaded) {
            API.getEntities()
                .then((result) => dispatch(loadEntities(result)));
        }
    }, [ loaded ]);

    const openEntity = (entity) => {
        setSelectedEntity(entity);
        open();
        posthog.capture('entity:open');
    };

    const entityActors = selectedEntity !== null ? (
        actors.filter((x) => x.entity === selectedEntity.name)
    ) : [];

    const entityMethods = selectedEntity !== null ? (
        methods.filter((x) => x.entities.includes(selectedEntity.name))
    ) : [];

    return (
        <>
            <Drawer
                size="md"
                offset={8}
                radius="md"
                opened={opened}
                position="right"
                title="Entity"
                onClose={close}
                overlayProps={{
                    blur: 4,
                    backgroundOpacity: 0.5,
                }}
            >
                {selectedEntity !== null && (
                    <Stack
                        gap="md"
                        style={{
                            cursor: 'default',
                            userSelect: 'none',
                        }}
                    >
                        <Group>
                            <Avatar size="lg">
                                <IconUsers
                                    size={32}
                                />
                            </Avatar>
                            <Stack gap={0}>
                                <Title order={3}>
                                    {selectedEntity.docs?.displayName || selectedEntity.name}
                                </Title>
                                {selectedEntity.docs?.description && (
                                    <Text size="sm">
                                        {selectedEntity.docs.description}
                                    </Text>
                                )}
                            </Stack>
                        </Group>
                        {selectedEntity.docs?.displayName && (
                            <Stack gap={4}>
                                <Title order={4}>
                                    Original name
                                </Title>
                                <Text size="sm">
                                    {selectedEntity.name}
                                </Text>
                            </Stack>
                        )}
                        {entityActors.length > 0 && (
                            <Stack gap="xs">
                                <Title
                                    order={4}
                                >
                                    Actors
                                </Title>
                                {entityActors.map((actor) => (
                                    <Group
                                        gap="sm"
                                        key={actor.id}
                                    >
                                        <Avatar size="md">
                                            <IconUser />
                                        </Avatar>
                                        <Text size="md">{actor.name}</Text>
                                    </Group>
                                ))}
                            </Stack>
                        )}
                        {entityMethods.length > 0 && (
                            <Stack gap="xs">
                                <Title
                                    order={4}
                                >
                                    Methods
                                </Title>
                                {entityMethods.map((method) => (
                                    <Group
                                        key={method.name}
                                        gap="sm"
                                    >
                                        <Avatar size="md">
                                            <IconFunction />
                                        </Avatar>
                                        <Text size="md">{method.name}</Text>
                                    </Group>
                                ))}
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
                    Entities
                </Title>
            </Group>
            <div className={styles.list}>
                {entities.map((entity) => (
                    <Group
                        gap="xs"
                        key={entity.name}
                        style={{
                            cursor: 'pointer',
                            userSelect: 'none',
                        }}
                        onClick={() => openEntity(entity)}
                    >
                        <Avatar size="sm">
                            <IconUsers
                                size={16}
                            />
                        </Avatar>
                        <div style={{marginTop: 0}}>
                            <Text size="sm">
                                {entity.docs?.displayName || entity.name}
                            </Text>
                            {entity.docs?.displayName && (
                                <Text size="xs">
                                    {entity.name}
                                </Text>
                            )}
                        </div>
                    </Group>
                    ))}
            </div>
        </>
    );
};

export default Entities;
