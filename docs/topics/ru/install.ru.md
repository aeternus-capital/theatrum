# Установка

Используйте ваш привычный пакетный менеджер для установки библиотеки

<tabs group="install">
    <tab id="npm-install" title="npm" group-key="npm">
        <code-block lang="shell">
            npx jsr add %core_package%
        </code-block>
    </tab>
    <tab id="yarn-install" title="yarn" group-key="yarn">
        <code-block lang="shell">
            yarn dlx jsr add %core_package%
        </code-block>
    </tab>
    <tab id="deno-install" title="deno" group-key="deno">
        <p>
            Добавьте в ваш <code>deno.json</code> следующие строки:<br/><br/>
        </p>
        <code-block lang="shell">
            deno add jsr:%core_package%
        </code-block>
        <p>
            Или импортируйте библиотеку прямо в коде (нерекомендуется):<br/><br/>
        </p>
        <code-block lang="typescript">
            import { Theatrum } from 'jsr:%core_package%';
        </code-block>
    </tab>
</tabs>