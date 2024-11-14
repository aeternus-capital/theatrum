import * as API from '../../network.js';
import styles from './index.module.scss';
import { useState, useEffect } from 'react';
import { usePostHog } from 'posthog-js/react';
import { useDisclosure } from '@mantine/hooks';
import { openConfirmModal } from '@mantine/modals';
import { useDispatch, useSelector } from 'react-redux';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconUser } from '@tabler/icons-react';
import { Select, JsonInput, Checkbox, Grid, Button, Tooltip } from '@mantine/core';
import { loadActors, createActor, editActor, removeActor } from '../../store/actors.js';
import { Group, Title, ActionIcon, Avatar, Text, Drawer, Input, MultiSelect } from '@mantine/core';

const Actors = () => {
    const posthog = usePostHog();
    const dispatch = useDispatch();
    const [ opened, { open, close } ] = useDisclosure(false);
    const actors = useSelector((store) => store.actors.actors);
    const loaded = useSelector((store) => store.entities.loaded);
    const entities = useSelector((store) => store.entities.entities);

    const [ selectedActor, setSelectedActor ] = useState(null);
    const [ name, setName ] = useState('');
    const [ selectedEntity, setSelectedEntity ] = useState(null);
    const [ roles, setRoles ] = useState([]);
    const [ data, setData ] = useState('{}');
    const [ needValidation, setNeedValidation ] = useState(true);

    useEffect(() => {
        if (loaded) {
            const actors = [];

            for (let i = 0, len = localStorage.length; i < len; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('actor:')) {
                    try {
                        const actor = JSON.parse(localStorage.getItem(key));
                        if (entities.find((x) => x.name === actor.entity)) {
                            actors.push(actor);
                        }
                    } catch (_) {}
                }
            }

            dispatch(loadActors(actors));
        }
    }, [ loaded, entities ]);

    const isCodeValid = () => {
        try {
            JSON.parse(data);
            return true;
        } catch (e) {
            return false;
        }
    };

    const openCreate = () => {
        setSelectedActor(null);
        setName('');
        setSelectedEntity(null);
        setRoles([]);
        setData('');
        open();
        posthog.capture('actor:openCreate');
    };

    const openEdit = (id) => {
        const actor = actors.find((x) => x.id === id);
        if (actor) {
            setSelectedActor(id);
            setName(actor.name);
            setSelectedEntity(actor.entity);
            setRoles(actor.roles);
            setData(JSON.stringify(actor.data, undefined, 2));
            open();
            posthog.capture('actor:openEdit');
        }
    };

    const generatePlaceholder = (entityName) => {
        if (entityName !== null) {
            const entity = entities.find((x) => x.name === entityName);
            if (entity && entity.schema) {
                const placeholder = Object.keys(entity.schema)
                    .reduce((acc, key) => {
                        acc[key] = '';
                        return acc;
                    }, {});

                setData(JSON.stringify(placeholder, undefined, 2));
            }
        }
    };

    const getAllRoles = (entityName) => {
        if (entityName === null) {
            return [];
        }

        const entity = entities.find((x) => x.name === entityName);
        if (!entity || !entity.roles) {
            return [];
        }

        return entity.roles.sort((a, b) => b.localeCompare(a));
    };

    const create = () => {
        const actor = {
            entity: selectedEntity,
            roles,
            data: JSON.parse(data),
        };

        const action = () => {
            close();
            dispatch(createActor({
                name,
                entity: selectedEntity,
                roles,
                data: JSON.parse(data),
            }));

            notifications.show({
                title: 'Success',
                message: `Actor "${name}" was successfully created`,
            });

            posthog.capture('actor:create');
        };

        if (!needValidation) {
            return action();
        }

        return API.postActor(actor)
            .then(action)
            .catch((e) => {
                notifications.show({
                    color: 'red',
                    title: 'Error',
                    message: e.message || 'Unknown error',
                });
            });
    };

    const edit = () => {
        const actor = {
            entity: selectedEntity,
            roles,
            data: JSON.parse(data),
        };

        const action = () => {
            close();
            dispatch(editActor({
                id: selectedActor,
                name,
                entity: selectedEntity,
                roles,
                data: JSON.parse(data),
            }));

            notifications.show({
                title: 'Success',
                message: `Actor "${name}" was successfully updated`,
            });

            posthog.capture('actor:edit');
        };

        if (!needValidation) {
            return action();
        }

        return API.postActor(actor)
            .then(action)
            .catch((e) => {
                notifications.show({
                    color: 'red',
                    title: 'Error',
                    message: e.message || 'Unknown error',
                });
            });
    };

    const remove = () => {
        openConfirmModal({
            title: `Delete actor "${name}"`,
            centered: true,
            confirmProps: {
                color: 'red',
            },
            labels: {
                confirm: 'Delete',
                cancel: `No, don't delete`,
            },
            children: (
                <Text size="sm">
                    Are you sure you want to delete actor "{name}"?
                    This action is destructive and you can't revert this.
                </Text>
            ),
            onConfirm: () => {
                dispatch(removeActor(selectedActor));
                close();
                posthog.capture('actor:remove');
            },
        });
    };

    const isEditing = selectedActor !== null;

    return (
        <>
            <Drawer
                size="md"
                offset={8}
                radius="md"
                opened={opened}
                position="right"
                title="Actor"
                onClose={close}
                overlayProps={{
                    blur: 4,
                    backgroundOpacity: 0.5,
                }}
            >
                <Input.Wrapper
                    label="Name"
                >
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </Input.Wrapper>
                <Select
                    mt="sm"
                    label="Entity"
                    placeholder="Select entity"
                    data={entities.map((x) => x.name)}
                    value={selectedEntity}
                    onChange={(value) => {
                        setSelectedEntity(value);
                        generatePlaceholder(value);
                    }}
                />
                <MultiSelect
                    mt="sm"
                    label="Roles"
                    placeholder="Select roles"
                    value={roles}
                    disabled={selectedEntity === null}
                    data={getAllRoles(selectedEntity)}
                    onChange={setRoles}
                />
                <JsonInput
                    mt="sm"
                    autosize
                    minRows={10}
                    formatOnBlur
                    value={data}
                    label="Data"
                    disabled={selectedEntity === null}
                    onChange={(value) => setData(value)}
                />
                <Checkbox
                    mt="sm"
                    label="Need actor data validation?"
                    checked={needValidation}
                    disabled={selectedEntity === null}
                    onChange={() => setNeedValidation((p) => !p)}
                />
                <Grid mt="lg">
                    <Grid.Col span={isEditing ? 9 : 12}>
                        <Button
                            fullWidth
                            onClick={!isEditing ? create : edit}
                            disabled={name.length === 0 || selectedEntity === null || !isCodeValid()}
                        >
                            {!isEditing ? 'Create' : 'Update'}
                        </Button>
                    </Grid.Col>
                    {isEditing && (
                        <Grid.Col span={3}>
                            <Button
                                fullWidth
                                color="red"
                                onClick={remove}
                                disabled={name.length === 0 || selectedEntity === null || !isCodeValid()}
                            >
                                Delete
                            </Button>
                        </Grid.Col>
                    )}
                </Grid>
            </Drawer>
            <Group
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                }}
            >
                <Title
                    order={4}
                    style={{
                        userSelect: 'none',
                    }}
                >
                    Actors
                </Title>
                <Tooltip
                    label="Create actor"
                    position="left"
                >
                    <ActionIcon
                        size="xs"
                        onClick={openCreate}
                    >
                        <IconPlus />
                    </ActionIcon>
                </Tooltip>
            </Group>
            <div className={styles.list}>
                {actors.map((actor) => (
                    <Group
                        gap="xs"
                        key={actor.id}
                        onClick={() => openEdit(actor.id)}
                        style={{
                            cursor: 'pointer',
                            userSelect: 'none',
                        }}
                    >
                        <Avatar size="sm">
                            <IconUser
                                size={16}
                            />
                        </Avatar>
                        <div style={{ marginTop: 0 }}>
                            <Text size="sm">
                                {actor.name}
                            </Text>
                            <Text size="xs">
                                Entity: {actor.entity}
                            </Text>
                        </div>
                    </Group>
                ))}
            </div>
        </>
    );
};

export default Actors;
