# Базовый пример

В этом примере разработаем приложение с использованием Theatrum
для одной сущности и одного методов, а также познакомимся с Theatrum Console.

## Сущность пользователя
Создадим сущность пользователя, в которой будет только одно дополнительное поле — `userId`.
Она будет находиться в файле `./entities/user.ts`.

```typescript
import { Entity, Validator } from '%core_package%';

interface User {
    userId: number;
}

export default new Entity<'user', never, User>({
    name: 'user',
    roles: [],
    schema: {
        userId: Validator.number(),
    },
});
```

## Первый метод
Разработаем метод, который принимает два числа, а возвращает их сумму.
Он будет находиться в файле `./math/sum.ts`.

Начнем разработку с создания двух типов:
* `MathSumParams` - тип (интерфейс), описывающий внешние параметры
* `MathSumResult` - тип, описывающий возвращаемый результат

```typescript
interface MathSumParams {
    a: number;
    b: number;
}

type MathSumResult = number;
```

Напишем обработчик, который будет реализовывать функциональность нашего метода.

```typescript
const handler = async ({ a, b }: MathSumParams): Promise<MathSumResult> => {
    return a + b;
};
```

> На данный момент обработчики могут быть исключительно асинхронными.
> В будущем постараемся решить эту проблему.

Создадим метод, в котором будет находиться наг обработчик и спецификация:
описание того, кто может запускать метод и какие параметры можно использовать.

```typescript
new Method(handler, {
    entity: [ UserEntity ],
    roles: [],
    params: {
        a: Validator.number(),
        b: Validator.number(),
    },
});
```

В этой спецификации мы указали, что вызывать этот метод могут исключительно
акторы сущности `User`, какие есть у пользователей роли - нам не важно, метод
можно вызвать с любыми ролями.

Далее указано, что параметры `a` и `b` должны быть числами, иначе метод выдаст
ошибку и обработчик метода даже не будет вызван.

Полностью файл `./math/sum.ts` с методом будет следующим образом.

```typescript
import UserEntity from '@/entities/user.ts';
import { Method, Validator } from '%core_package%';

interface MathSumParams {
    a: number;
    b: number;
}

type MathSumResult = number;

const handler = async ({ a, b }: MathSumParams): Promise<MathSumResult> => {
    return a + b;
};

export default new Method(handler, {
    entity: [ UserEntity ],
    roles: [],
    params: {
        a: Validator.number(),
        b: Validator.number(),
    },
});
```

## Создание объекта Theatrum

Создадим файл `theatrum.ts` и импортируем в него наш метод.

```typescript
import MathSum from './math/sum.ts';
```

Создадим объект, который будет содержать сопоставление сущностей с их названиями.

```typescript
const entities = {
    'user': UserEntity,
};
```

Аналогичным образом создадим сопоставление для методов.

```typescript
const methods = {
    'math.sum': MathSum,
};
```

> Вы также можете использовать краткий вариант записи: импортировать модуль прямо
> в определении объекта (это работает как с сущностями, так и с методами):
> 
> ```typescript
> const methods = {
>     'math.sum': (await import('./math/sum.ts')).default,
> };
> ```

Создадим объект `theatrum`, который будем использовать для взаимодействия с методами:

```typescript
const theatrum = new Theatrum<typeof entities, typeof methods>({
    entities,
    methods,
});
```

Полный файл `./theatrum.ts` будет выглядеть следующим образом:

```typescript
import { Theatrum } from '%core_package%';
import UserEntity from './entities/user.ts';

import MathSum from './math/sum.ts';

const entities = {
    'user': UserEntity,
};

const methods = {
    'math.sum': MathSum,
};

const theatrum = new Theatrum<typeof entities, typeof methods>({
    entities,
    methods,
});

export default theatrum;
```
## Вызов метода

Теперь попробуем вызвать метод, который мы создали, для этого создадим
файл `./main.ts`, где создадим актора сущности `user` с идентификатором `1`.

```ts
const actor = theatrum.createActor('user', {
    userId: 1,
});
```

Далее требуется создать исполнителя — объект, в котором будет вызван метод.
Для создания исполнителя нужно передать актора, от имени которого будут
вызываться все методы в рамках этого исполнителя.

```ts
const executor = theatrun.createExecutor(actor);
```

Теперь все готово, чтобы вызвать метод.

```ts
const result = await executor.run('math.sum', {
    a: 5,
    b: 4,
});

console.log(result);  // 9
```

Полностью файл `./main.ts` будет следующим образом.

```ts
import theatrum from './theatrum.ts';

const actor = theatrum.createActor('user', {
    userId: 1,
});

const executor = theatrun.createExecutor(actor);

const result = await executor.run('math.sum', {
    a: 5,
    b: 4,
});

console.log(result);
```

## Использование консоли

Для более удобной разработки мы разработали Theatrum Console (`%console_package%`):
веб-интерфейс для взаимодействия с theatrum напрямую, в обход методов аутентификации.

Использование консоли позволяет сократить время на отладку и время на онбординг новых
членов команды.

Чтобы использовать консоль, нужно установить пакет `%console_package%`, после чего
создать обработчик запросов:

```ts
import { TheatrumConsole } from '%console_package%';

const console = new TheatrumConsole(theatrum);
```

Далее вам требуется создать веб-сервер для того, чтобы обработчик смог начать
принимать запросы от вас, либо встроить его в существующий веб-сервер.

> Так как мы рекомендуем Deno как основной рантайм для разработки на Theatrum,
> то дальнейший пример будет учитывать специфику именно этого окружения.

Создадим веб-сервер на порту 8000 и будем передавать все запросы в обработчик Theatrum Console.

```ts
Deno.serve({
    port: 8000,
    handler: console.handle(),
});
```

Обновленный файл `./main.ts` будет следующим образом.


```ts
import theatrum from './theatrum.ts';
import { TheatrumConsole } from '%console_package%';

const console = new TheatrumConsole(theatrum);

Deno.serve({
    port: 8000,
    handler: console.handle(),
});
```

Запустим файл `./main.ts` и зайдем по адресу [localhost:8000](http://localhost:8000)

![Console](console_main.png)

Аналогично логике выше, нам требуется создать актора, для запуска метода.

![Console](console_create_actor.png)

Теперь мы можем вызвать метод `math.sum` от имени этого актора.

![Console](console_execute.png)

Если метод не вернул ошибку, то результат его выполнения появится ниже.

![Console](console_result.png)

Также, вы можете вызвать метод в режиме отладки (Tracer Mode), чтобы поэтапно
разобраться в логике работы Theatrum под капотом.

> Будьте внимательны, события в Tracer показываются наоборот: чем выше, тем ближе к концу.

![Console](console_tracer.png)

## Заключение

В этом примере мы разработали базовое приложение с использованием Theatrum,
познакомились с основными примитивами, а также научились использовать Theatrum Console.

Полный код этого примера доступен в нашем репозитории: [examples/basic](%repo_url%/examples/basic)