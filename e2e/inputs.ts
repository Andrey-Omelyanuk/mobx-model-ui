import { field, ILIKE, Input, Model, id, NUMBER, model, ORDER_BY, STRING, ARRAY, DESC } from '../dist/mobx-model-ui'


describe('Other tests: Inputs.', () => {

    @model
    class File extends Model {
        @id(NUMBER()) id: number
        @field(STRING({maxLength: 24, required: true})) title: string
    }

    it('...', async ()=> {
        const input = new Input(STRING(), { syncURL: 'search', debounce: 400 })
        const filesQuery = File.getQuery({
            filter      : ILIKE('title', input),
            orderBy     : new Input(ARRAY(ORDER_BY()), {value: [['uploaded_at', DESC]]}),
            relations   : new Input(ARRAY(STRING())   , {value: ['versions', ]}),
            autoupdate  : false
        })
    })
})
