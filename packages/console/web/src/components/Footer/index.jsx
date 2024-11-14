import { useEffect } from 'react';
import styles from './index.module.scss';
import { Group, Text } from '@mantine/core';
import { usePostHog } from 'posthog-js/react';
import packageJson from '../../../../deno.json';

const Footer = () => {
    const posthog = usePostHog();

    useEffect(() => {
        if (posthog.__loaded) {
            posthog.capture('app:version', {
                version: packageJson.version,
            });
        }
    }, [ posthog.__loaded ]);

    return (
        <Group className={styles.container}>
            <Text
                size="xs"
                className={styles.copyright}
            >

                2023-{new Date().getFullYear()} © Stepan Novozhilov
            </Text>
            <Text
                size="xs"
                className={styles.version}
            >
                Version: {packageJson.version}
            </Text>
        </Group>
    );
};

export default Footer;
