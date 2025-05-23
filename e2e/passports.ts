import { DATETIME, NUMBER, STRING,  Model, model, local, field, foreign, one, many, id } from '../dist/mobx-model-ui'


describe('Other tests: Passports.', () => {

    @local()
    @model
    class User extends Model {
        @id(NUMBER()) id: number
        @field(STRING({maxLength: 24, required: true})) user_name: string
        passport : Passport  // One
        keys     : Key[]     // Many

        async generateNewKey() {
            let new_key = new Key({user_id: this.id})
            await new_key.save()
            return new_key
        }
        async createPassport(first_name?, last_name?) {
            if (!this.passport) {
                let passport = new Passport({
                    user_id     : this.id, 
                    first_name  : first_name ? first_name : this.user_name, 
                    last_name   : last_name  ? last_name  : this.user_name
                })
                await passport.save()
            }
            return this.passport
        }
    }

    @local()
    @model
    class Passport extends Model {
        @id(NUMBER()) id: number
        // -- Fields ------------------------------------------------
        @field(NUMBER({required: true}))                user_id     : number
        @field(DATETIME({required: true}))              created     : Date
        @field(STRING({required: true, maxLength: 24})) first_name  : string
        @field(STRING({required: true, maxLength: 24})) last_name   : string
        // -- Foreigns ----------------------------------------------
        @foreign(User)                                  user        : User

        constructor(init_data?) {
            super(init_data)
            this.created = new Date()
        }
    }
    one(Passport, 'user_id')(User, 'passport') 

    @local()
    @model
    class Key extends Model {
        @id(NUMBER()) id: number
        // -- Fields ------------------------------------------------
        @field(DATETIME({required: true}))              created : Date
        @field(STRING({required: true, maxLength: 24})) private : string
        @field(STRING({required: true, maxLength: 24})) public  : string
        @field(NUMBER({required: true}))                user_id : number
        // -- Foreigns ----------------------------------------------
        @foreign(User) user: User

        constructor(init_data?) {
            super(init_data)
            this.private = 'private'
            this.public  = 'public'
        }

        async sign(passport: Passport, key: Key, type: ActionType) {
            let action = new Action({
                passport_id	: passport.id,
                key_id      : key.id,
                type        : type,
                signer_id   : this.id,
                sign        : `signer:${this.id}-passport:${passport.id}-key:${key.id}-type:${type}`
            })
            await action.save()
            return action
        }
    }
    many(Key, 'user_id')(User, 'keys') 

    enum ActionType {
        ACCEPT = 1,
        REJECT = 2
    }

    @local()
    @model
    class Action extends Model {
        @id(NUMBER()) id: number
        // -- Fields ------------------------------------------------
        @field(DATETIME({required: true}))              timestamp   : Date
        @field(NUMBER({required: true}))                passport_id : number
        @field(NUMBER({required: true}))                key_id      : number
        @field(NUMBER({required: true}))                type        : ActionType
        @field(NUMBER({required: true}))                signer_id   : number
        @field(STRING({required: true, maxLength: 24})) sign        : string
        // -- Foreigns ----------------------------------------------
        @foreign(Passport)  passport    : Passport
        @foreign(Key)       key         : Key
        @foreign(Key)       signer      : Key

        constructor(init_data?) {
            super(init_data)
            this.timestamp = new Date()
        }
    }

    it('...', async ()=> {
        let userA = new User({user_name: 'A'}); await userA.save()
        let userB = new User({user_name: 'B'}); await userB.save()
        let userC = new User({user_name: 'C'}); await userC.save()

        expect(userA.user_name).toBe('A')
        expect(userA.passport).toBe(undefined)
        expect(userA.keys.length).toBe(0)

        let passportA = await userA.createPassport(); expect(userA.passport).toBe(passportA)
        let passportB = await userB.createPassport(); expect(userB.passport).toBe(passportB)
        let passportC = await userC.createPassport(); expect(userC.passport).toBe(passportC)

        let keyA1 = await userA.generateNewKey(); expect(userA.keys.length).toBe(1)
        let keyB1 = await userB.generateNewKey(); expect(userB.keys.length).toBe(1)
        let keyC1 = await userC.generateNewKey(); expect(userC.keys.length).toBe(1)

        // self sign
        await keyA1.sign(passportA, keyA1, ActionType.ACCEPT)
        await keyB1.sign(passportB, keyB1, ActionType.ACCEPT)
        await keyC1.sign(passportC, keyC1, ActionType.ACCEPT)

        let action4 = keyA1.sign(passportB, keyB1, ActionType.ACCEPT)
        let action5 = keyB1.sign(passportA, keyA1, ActionType.ACCEPT)
    })
})
