MobX-Model-UI
===
ex [@Andrey-Omelyanuk/MobX-ORM:2.1.7](https://github.com/Andrey-Omelyanuk/mobx-orm)

Data and UI models based on [MobX](https://github.com/mobxjs/mobx)
Inspired by [ember-data](https://github.com/emberjs/data) and [js-data](https://github.com/js-data/js-data).
This library is another opinion (my personal) about what models should be on the front-end and how work with it.

Introduction:
---
There are entities into the lib:

    Model, Field, Repository, Adapter
    Query, Filter
    Input, Form

A quick example:
---

```ts
    // This exapmle is not tested yet, it how I whant to see it.
    import { Model, model, field, foreign, many } from 'mobx-model-ui'

    @model class User extends Model {
        @id    id   : number  // it can be a string for UUID for example
        @field name : string

        authorship: Author[]
    }

    @model class Book extends Model {
        @id    id   : number
        @field title: string

        authorship: Author[]
    }

    @model class Author extends Model {
        @id    id       : number 
        @field user_id  : string
        @field book_id  : string

        @foreign(User)  user: User 
        @foreign(Book)  book: Book 
    }
    many(Author)(User, 'authorship') 
    many(Author)(Book, 'authorship') 

    let user_a = new User({id: 1, name: 'User A'})
    let user_b = new User({id: 2, name: 'User B'})

    let book_a = new Book({id: 1, name: 'Book A'})
    let book_b = new Book({id: 2, name: 'Book B'})
    let book_c = new Book({id: 3, name: 'Book C'})

    new Author({id: 1, user_id: 1, book_id: 1})
    new Author({id: 2, user_id: 1, book_id: 2})
    new Author({id: 3, user_id: 1, book_id: 3})
    new Author({id: 4, user_id: 2, book_id: 3})

    for (const autorship of user_a.authorship) console.log(autorship.book.title)
    // Book A
    // Book B
    // Book C
    for (const autorship of user_b.authorship) console.log(autorship.book.title)
    // Book C
    for (const autorship of book_a.authorship) console.log(autorship.user.name)
    // User A
    for (const autorship of book_b.authorship) console.log(autorship.user.name)
    // User A
    for (const autorship of book_c.authorship) console.log(autorship.user.name)
    // User A
    // User B
```

More examples you can find into ./e2e tests.


# For Developers:
I recommend to use docker for development. See the `makefile` how to use it.

If you don't want to use docker then you can see `scripts` commands into `package.json`
How to debug:
```sh
node_modules/.bin/jest --testMatch='**/src/**/*.spec.ts' --watchAll
node --inspect-brk=0.0.0.0 node_modules/.bin/jest --runInBand --testMatch='**/src/**/model-class.spec.ts'
node --inspect-brk=0.0.0.0 node_modules/.bin/jest --runInBand -t 'raw_obj with one relations'
chrome://inspect/#devices
```
