import styles from './index.module.scss';
import { usePostHog } from 'posthog-js/react';
import { useMantineColorScheme, Group, Title, Switch, Anchor } from '@mantine/core';

const links = [
    {
        link: 'https://aeternus-capital.github.io/theatrum',
        label: 'Documentation',
    },
    {
        link: 'https://github.com/aeternus-capital/theatrum',
        label: 'GitHub',
    },
    {
        link: 'https://github.com/aeternus-capital/theatrum/issues/new',
        label: 'Report bug',
    },
];

const Header = () => {
    const posthog = usePostHog();
    const { colorScheme, setColorScheme } = useMantineColorScheme();

    return (
        <Group
            px="md"
            className={styles.header}
        >
            <div className={styles.left}>
                <Title
                    order={2}
                    className={styles.left__brand}
                >
                    Theatrum Console
                </Title>
                <Switch
                    size="lg"
                    onLabel="Light"
                    offLabel="Dark"
                    className={styles.left__switch}
                    checked={colorScheme === 'dark'}
                    onChange={() => {
                        const value = colorScheme === 'light' ? 'dark' : 'light';

                        setColorScheme(value);
                        posthog.capture('header:switchTheme', {
                            oldValue: colorScheme,
                            newValue: value,
                        });
                    }}
                />
            </div>
            <div>
                {links.map((x) => (
                    <Anchor
                        key={x.link}
                        href={x.link}
                        className={styles.left__link}
                        onClick={() => {
                            posthog.capture('header:openLink', {
                                link: x.link,
                                label: x.label,
                            });
                        }}
                    >
                        {x.label}
                    </Anchor>
                ))}
            </div>
        </Group>
    );
};

export default Header;
