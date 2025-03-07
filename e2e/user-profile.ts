///<reference path="../dist/mobx-model-ui.d.ts" />
import {  NUMBER, STRING, Model, model, id, field, foreign, one, local } from '../dist/mobx-model-ui'


describe('User Profile.', () => {
    @local()
    @model
    class User extends Model {
        @id(NUMBER())                                   id      : number
        @field(STRING({maxLength: 24, required: true})) name    : string
        profile : UserProfile
    }

    @local()
    @model
    class UserProfile extends Model {
        @id(NUMBER())                    id         : number
        @field(NUMBER({required: true})) user_id	: number
        @foreign(User)                   user       : User
    }
    one(UserProfile)(User, 'profile') 

    it('...', async ()=> {
        let user_a = new User({id: 1, name: 'A'})
        let user_b = new User({id: 2, name: 'B'})
        expect(user_a.profile).toBe(undefined)
        expect(user_b.profile).toBe(undefined)

        let user_profile_a = new UserProfile({id: 1, user_id: user_a.id, test: 'A'})
        let user_profile_b = new UserProfile({id: 2, user_id: user_b.id, test: 'B'})
        expect(user_a.profile).toBe(user_profile_a)
        expect(user_b.profile).toBe(user_profile_b)
        expect(user_profile_a.user).toBe(user_a)
        expect(user_profile_b.user).toBe(user_b)
    })
})
