# Архитектура

## Концепция
Theatrum — это фреймворк для создания API-бекендов.
Он реализует механизм работы с кодовой базой проекта, в котором много сущностей.

Если рассматривать Theatrum в модели `Identify`->`Authenticate`->`Authorize`, то
он является реализацией последнего элемента — механизма авторизации.

```d2
direction: right

user: Реализует\nпользователь
theatrum: Реализует\nTheatrum

user.id: Идентификация
user.authn: Аутентификация
theatrum.authz: Авторизация

user.id->user.authn {
    style.animated: true
}
user.authn->theatrum.authz {
    style.animated: true
}

```

## Пример работы
Рассмотрим работу Theatrum на примере одного запроса.
В начале у нас есть объект `theatrum`, который мы создали.
Он содержит список всех методов и сущностей.

```d2
direction: right

entities: Сущности
entities.style.multiple: true
methods: Методы
methods.style.multiple: true
theatrum: Theatrum
theatrum.entities: Сущности
theatrum.entities.style.multiple: true
theatrum.methods: Методы
theatrum.methods.style.multiple: true

entities->theatrum.entities: Используется в {
    style.animated: true
    style.stroke-dash: 3
}
methods->theatrum.methods: Используется в {
    style.animated: true
    style.stroke-dash: 3
}
```

Для запроса нам также потребуется актор. Создать его можно
непосредственно из объекта `theatrum`.

> Стоит отдельно отметить, что актор — это производный объект от сущности,
> поэтому, чтобы создать актора, сущность которой он принадлежит, должна быть
> передана в `theatrum` при создании.

```d2
direction: right

theatrum: Theatrum
theatrum.entities: Сущности
theatrum.entities.style.multiple: true
theatrum.methods: Методы
theatrum.methods.style.multiple: true
actor: Актор

theatrum.entities->actor: Является родителем {
    style.animated: true
    style.stroke-dash: 3
}
theatrum->actor: Создает
```

Чтобы вызвать метод, требуется создать исполнителя. Для его работы требуется актор.
Мы будем использовать тот, что только что создали.

```d2
direction: right

theatrum: Theatrum
theatrum.entities: Сущности
theatrum.entities.style.multiple: true
theatrum.methods: Методы
theatrum.methods.style.multiple: true
actor: Актор
executor: Исполнитель
executor.methods: Методы
executor.methods.style.multiple: true
executor.actor: Актор

theatrum->executor: Создает
theatrum.methods->executor.methods: Используется в {
    style.animated: true
    style.stroke-dash: 3
}
actor->executor.actor: Используется в {
    style.animated: true
    style.stroke-dash: 3
}
```

Теперь, когда у нас есть исполнитель, можно вызвать нужный метод от имени актора.
Для этого используется функция исполнителя `run`.

```d2
direction: right

req: "run('math.sum', { a: 5, b: 4 })"
executor: Исполнитель
executor.methods: Методы
executor.methods.style.multiple: true
executor.actor: Актор

req->executor
```

Сразу после вызова функции `run`, исполнитель находит нужный метод по переданному
названию и, после ряда проверок, вызывает его, если они успешно пройдены. При вызове
метода в него передаются параметры, переданные в функцию `run`, и контекст исполнителя.

```d2
direction: right

executor: Исполнитель
executor.methods: Методы
executor.methods.style.multiple: true
executor.actor: Актор
context: Контекст
context.actor: Актор
method: Метод
method.context: Контекст

executor->context: Создает
executor.actor->context.actor: Используется в {
    style.animated: true
    style.stroke-dash: 3
}
context->method.context: Используется в {
    style.animated: true
    style.stroke-dash: 3
}
executor->method: "Вызывает с\n{ a: 5, b: 4 }"
```

После того как метод был вызван, он проверяет переданные в него параметры и,
если они являются корректными, вызывает обработчик с пользовательской
бизнес-логикой.

```d2
direction: right

method: Метод
method.params: "Параметры запроса\n{ a: 5, b: 4 }"
method.context: Контекст
method.context.actor: Актор
handler: Обработчик

method.params->handler: Используется в {
    style.animated: true
    style.stroke-dash: 3
}
method->handler: Вызывает
method.context->handler: Используется в {
    style.animated: true
    style.stroke-dash: 3
}
```

Теперь, если рассмотреть обработчик (ваша бизнес-логика), то
у вас есть доступ к:
* Проверенному актору (вы его аутентифицировали ранее, theatrum авторизовал его для запуска метода)
* Проверенным параметрам (согласно спецификации метода)

При этом неважно какой именно актор запустил ваш обработчик: если
это случилось, то у актора гарантированно были полномочия это сделать
(исходя из его `entity` и набора ролей). Параметры, которые доступны
в вашем обработчике, прошли все предварительные проверки и гарантировано
соответствуют вашей спецификации метода.

Вы можете использовать эти все данные сразу в вашей бизнес-логике
или провести дополнительные проверки: например, если метод может быть
вызван сущностями `User` и `Admin`, то при вызове от имени `User`
будет возвращена только базовая информация, а при вызове от имени `Admin`
будет возвращена более обогащенная информация.

```d2
direction: right
params: "Параметры запроса ✅\n{ a: 5, b: 4 }"
context: Контекст
context.actor: Актор ✅
handler: Обработчик

context->handler {
    style.animated: true
    style.stroke-dash: 3
}
params->handler {
    style.animated: true
    style.stroke-dash: 3
}
```

Вернемся к нашему примеру. Как только обработчик успешно завершит свое
выполнение, он вернет результат в метод, тот в свою очередь передаст его
исполнителю, а от туда он вернется пользователю.

```d2
direction: left

handler: Обработчик
method: Метод
executor: Исполнитель
external: ""
external.style.opacity: 0


method<-handler: Результат\n9
executor<-method: Результат\n9
external<-executor: Результат\n9 {
    style.animated: true
    style.stroke-dash: 3
}
```
