///<reference path="../dist/mobx-model-ui.d.ts" />
import { Model, model, local, field, foreign, many } from '../dist/mobx-model-ui'


describe('e2e: Chat.', () => {

    function declare() {

        @local()
        @model class User extends Model {
            @field  first_name  : string
            @field  last_name   : string
                    messages    : Message[]

            get full_name() : string { return `${this.first_name} ${this.last_name}` }
        }

        @local()
        @model class Channel extends Model {
                messages: Message[]

            async sendMessage(user: User, text: string) {
                let message = new Message({channel_id: this.id, user_id: user.id, text: text, created: new Date()})
                return message.save()
            }
        }

        @local()
        @model class Message extends Model {
            @field created     : Date
            @field text        : string
            @field channel_id  : number
            @field user_id     : number

            @foreign(Channel) channel : Channel
            @foreign(User)    user    : User
        }
        many(Message, 'user_id'   )(User, 'messages') 
        many(Message, 'channel_id')(Channel, 'messages') 

        return { User: User, Channel: Channel, Message: Message }
    } 

    it('init', async ()=> {
        const {User, Channel, Message} = declare()
        let channelA = new Channel(); await channelA.save()
        let channelB = new Channel(); await channelB.save()
        let userA = new User({first_name: 'A', last_name: 'X'}); await userA.save()
        let userB = new User({first_name: 'B', last_name: 'X'}); await userB.save()

        expect(User.repository.cache.store.size).toBe(2)
        expect(Channel.repository.cache.store.size).toBe(2)
        expect(Message.repository.cache.store.size).toBe(0)
    })

    it('Send messages', async ()=> {
        const {User, Channel, Message} = declare()
        let channelA = new Channel(); await channelA.save()
        let channelB = new Channel(); await channelB.save()
        let userA = new User({first_name: 'A', last_name: 'X'}); await userA.save()
        let userB = new User({first_name: 'B', last_name: 'X'}); await userB.save()

        await channelA.sendMessage(userA, 'First  message from userA')
        await channelA.sendMessage(userA, 'Second message from userA')
        await channelA.sendMessage(userB, 'First  message from userB')
        await channelA.sendMessage(userA, 'Third  message from userA')

        expect(channelA.messages.length).toBe(4)
        expect(channelA.messages[0].text).toBe('First  message from userA')
        expect(channelA.messages[1].text).toBe('Second message from userA')
        expect(channelA.messages[2].text).toBe('First  message from userB')
        expect(channelA.messages[3].text).toBe('Third  message from userA')

        expect(userA.messages.length).toBe(3)
        expect(userA.messages[0].text).toBe('First  message from userA')

        await userA.messages[0].delete()
        expect(userA.messages.length).toBe(2)
        expect(userA.messages[0].text).toBe('Second message from userA')
        expect(userA.messages[1].text).toBe('Third  message from userA')

        await channelB.sendMessage(userA, 'B:First  message from userA')
        await channelB.sendMessage(userA, 'B:Second message from userA')
        await channelB.sendMessage(userB, 'B:First  message from userB')
        await channelB.sendMessage(userA, 'B:Third  message from userA')

        expect(userA.messages.length).toBe(5)
        expect(userB.messages.length).toBe(2)
        expect(userA.messages[userA.messages.length-1].text).toBe('B:Third  message from userA')
    })
})
